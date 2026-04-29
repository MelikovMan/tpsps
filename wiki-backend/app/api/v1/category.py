from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID


from app.core.database import get_db
from app.core.security import require_permission
from app.models.category import Category
from app.schemas.category import CategoryResponse, CategoryCreate, CategoryUpdate
from app.models.article import Article
from app.schemas.article import ArticleResponse
from app.models.category import ArticleCategory
from app.services.category_service import CategoryService

router = APIRouter()

@router.get("/", response_model=List[CategoryResponse])
async def get_categories(
    parent_id: Optional[UUID] = Query(None, description="ID родительской категории (null = корневые)"),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Category)
        .options(selectinload(Category.children))
        .where(Category.parent_id == parent_id)
        .order_by(Category.name)
    )
    categories = result.scalars().all()
    category_service = CategoryService(db)
    return [
    category_service.category_to_response(category=category)
    for category in categories
]
@router.get("/flat", response_model=List[CategoryResponse])
async def get_all_categories_flat(
    db: AsyncSession = Depends(get_db)
):
    """Return every category in a flat list (with children field as IDs)."""
    result = await db.execute(
        select(Category)
        .options(selectinload(Category.children))
        .order_by(Category.path)
    )
    categories = result.scalars().all()
    category_service = CategoryService(db)
    return [category_service.category_to_response(c) for c in categories]
@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Category)
        .options(selectinload(Category.children))
        .where(Category.id == category_id)
    )
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    category_service = CategoryService(db)
    return category_service.category_to_response(category=category)

@router.post("/", response_model=CategoryResponse)
async def create_category(
    category_data: CategoryCreate,
    current_user = Depends(require_permission("edit")),
    db: AsyncSession = Depends(get_db)
):
    # Build path based on parent
    path = category_data.name.lower().replace(" ", "_")
    
    if category_data.parent_id:
        result = await db.execute(select(Category).where(Category.id == category_data.parent_id))
        parent = result.scalar_one_or_none()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent category not found"
            )
        path = f"{parent.path}.{path}"
    
    category = Category(
        name=category_data.name,
        parent_id=category_data.parent_id,
        path=path
    )
    
    db.add(category)
    await db.commit()
    await db.refresh(category)
    
    return CategoryResponse.model_validate(category)

@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: UUID,
    category_update: CategoryUpdate,
    current_user = Depends(require_permission("edit")),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    update_data = category_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    # Rebuild path if name or parent changed
    if "name" in update_data or "parent_id" in update_data:
        path = category.name.lower().replace(" ", "_")
        if category.parent_id:
            result = await db.execute(select(Category).where(Category.id == category.parent_id))
            parent = result.scalar_one_or_none()
            if parent:
                path = f"{parent.path}.{path}"
        category.path = path
    
    await db.commit()
    await db.refresh(category)
    
    return CategoryResponse.model_validate(category)

@router.delete("/{category_id}")
async def delete_category(
    category_id: UUID,
    current_user = Depends(require_permission("delete")),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    await db.delete(category)
    await db.commit()
    
    return {"message": f"Category {category_id} deleted successfully"}

@router.get("/{category_id}/articles", response_model=List[ArticleResponse])
async def get_category_articles(
    category_id: UUID,
    skip: int = 0,
    limit: int = 20,
    include_subcategories: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """Возвращает статьи категории (опционально включая подкатегории)."""
    # Получаем категорию (для пути)
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    if include_subcategories:
        # ltree <@ для вложенных

        path_condition = Category.path.op('<@')(category.path)
    else:
        path_condition = Category.id == category_id

    query = (
        select(Article.id, Article.title, Article.current_commit_id,
               Article.created_at, Article.updated_at, Article.status, Article.article_type)
        .distinct()
        .join(ArticleCategory, Article.id == ArticleCategory.article_id)
        .join(Category, ArticleCategory.category_id == Category.id)
        .where(path_condition)
        .order_by(Article.updated_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    articles = result.all()
    return [ArticleResponse.model_validate(a) for a in articles]

from sqlalchemy import or_

@router.get("/search", response_model=List[CategoryResponse])
async def search_categories(
    q: str = Query(..., min_length=1, description="Search query for category name"),
    parent_id: Optional[UUID] = Query(None, description="Optionally restrict to children of this parent"),
    db: AsyncSession = Depends(get_db)
):
    """
    Search categories by name (case-insensitive). Returns categories matching the query.
    Uses 'starts with' for better relevance, but also includes 'contains' matches.
    """
    # Start with a base query filtering by parent_id if provided
    query = select(Category).options(selectinload(Category.children))
    if parent_id is not None:
        query = query.where(Category.parent_id == parent_id)
    else:
        # If no parent specified, search across all categories
        query = query.where(Category.parent_id.is_(None))  # or remove to search everywhere

    # Add name search condition (case-insensitive)
    search_pattern = f"{q}%"
    contains_pattern = f"%{q}%"
    
    query = query.where(
        or_(
            Category.name.ilike(search_pattern),
            Category.name.ilike(contains_pattern)
        )
    ).order_by(
        # Order by exact match first, then starts with, then contains
        Category.name.ilike(search_pattern).desc(),
        Category.name.ilike(contains_pattern).desc(),
        Category.name
    )

    result = await db.execute(query)
    categories = result.scalars().all()
    
    category_service = CategoryService(db)
    return [category_service.category_to_response(cat) for cat in categories]
