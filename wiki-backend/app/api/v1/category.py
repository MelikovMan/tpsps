from typing import List
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID

from app.core.database import get_db
from app.core.security import require_permission
from app.models.category import Category
from app.schemas.category import CategoryResponse, CategoryCreate, CategoryUpdate

router = APIRouter()

@router.get("/", response_model=List[CategoryResponse])
async def get_categories(
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Category)
        .options(selectinload(Category.children))
        .where(Category.parent_id.is_(None))
        .order_by(Category.name)
    )
    categories = result.scalars().all()
    
    return [CategoryResponse.model_validate(category) for category in categories]

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
    
    return CategoryResponse.model_validate(category)

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
