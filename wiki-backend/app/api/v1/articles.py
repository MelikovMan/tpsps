from difflib import SequenceMatcher
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_active_user, require_permission
from app.models.user import User
from app.models.article import Article, Commit, Branch, CommitParent
from app.schemas.article import (
    ArticleResponse, ArticleCreate, ArticleUpdate,
    CommitResponse, CommitCreate,
    BranchResponse, BranchCreate
)
from app.services.commit_service import CommitService
router = APIRouter()

@router.get("/", response_model=List[ArticleResponse])
async def get_articles(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(Article.id, Article.title, Article.current_commit_id, Article.created_at, Article.updated_at, Article.status, Article.article_type)
    
    if status_filter:
        query = query.where(Article.status == status_filter)
    
    if search:
        query = query.where(Article.title.ilike(f"%{search}%"))
    
    query = query.offset(skip).limit(limit).order_by(Article.updated_at.desc())
    
    result = await db.execute(query)
    articles = result.all()
    
    return [ArticleResponse.model_validate(article) for article in articles]

@router.get("/{article_id}", response_model=ArticleResponse)
async def get_article(
    article_id: UUID,
    db: AsyncSession = Depends(get_db),
    branch: str = Query("main", description="Branch name")
):
    # Получаем статью с ветками и текущим коммитом
    result = await db.execute(
        select(Article)
        .where(Article.id == article_id)
        
    )
    article = result.one_or_none()
    if not article:
        raise HTTPException(status_code=404,detail="Article not found")
    commit_service = CommitService(db)
    full_content = await commit_service.rebuild_content_at_commit(article.current_commit_id)
    if not full_content:
        raise HTTPException(status_code=404,detail="Failed to extact content of the head commit")
    # Формируем ответ с дополнительным полем content
    response = ArticleResponse.model_validate(article)
    response.content = full_content
    return response

@router.post("/", response_model=ArticleResponse)
async def create_article(
    article_data: ArticleCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    # Create article
    article = Article(
        title=article_data.title,
        status=article_data.status,
        article_type=article_data.article_type
    )
    db.add(article)
    await db.flush()  # Get article ID without committing
    
    # Create initial commit
    commit = Commit(
        article_id=article.id,
        author_id=current_user.id,
        message=article_data.message,
        content_diff=article_data.content
    )
    db.add(commit)
    await db.flush()
    
    # Update article with current commit
    article.current_commit_id = commit.id
    
    # Create main branch
    main_branch = Branch(
        article_id=article.id,
        name="main",
        head_commit_id=commit.id
    )
    db.add(main_branch)
    
    await db.commit()
    await db.refresh(article)
    
    return ArticleResponse.model_validate(article)

@router.put("/{article_id}", response_model=ArticleResponse)
async def update_article(
    article_id: UUID,
    article_update: ArticleUpdate,
    current_user: User = Depends(require_permission("edit")),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Article).where(Article.id == article_id))
    article = result.scalar_one_or_none()
    
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )
    
    # Create new commit if content is being updated
    if article_update.content:
        commit = Commit(
            article_id=article.id,
            author_id=current_user.id,
            message=article_update.message,
            content_diff=article_update.content
        )
        db.add(commit)
        await db.flush()
        article.current_commit_id = commit.id
    
    # Update article fields
    update_data = article_update.model_dump(exclude_unset=True, exclude={"content", "message"})
    for field, value in update_data.items():
        setattr(article, field, value)
    
    await db.commit()
    await db.refresh(article)
    
    return ArticleResponse.model_validate(article)

@router.delete("/{article_id}")
async def delete_article(
    article_id: UUID,
    current_user: User = Depends(require_permission("delete")),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Article).where(Article.id == article_id))
    article = result.scalar_one_or_none()
    
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )
    
    await db.delete(article)
    await db.commit()
    
    return {"message": f"Article {article_id} deleted successfully"}

@router.get("/{article_id}/commits", response_model=List[CommitResponse])
async def get_article_commits(
    article_id: UUID,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Commit)
        .where(Commit.article_id == article_id)
        .order_by(Commit.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    commits = result.scalars().all()
    
    return [CommitResponse.model_validate(commit) for commit in commits]

@router.get("/{article_id}/branches", response_model=List[BranchResponse])
async def get_article_branches(
    article_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Branch).where(Branch.article_id == article_id)
    )
    branches = result.scalars().all()
    
    return [BranchResponse.model_validate(branch) for branch in branches]

@router.post("/{article_id}/branches", response_model=BranchResponse)
async def create_branch(
    article_id: UUID,
    branch_data: BranchCreate,
    current_user: User = Depends(require_permission("edit")),
    db: AsyncSession = Depends(get_db)
):
    # Verify article exists
    result = await db.execute(select(Article).where(Article.id == article_id))
    article = result.scalar_one_or_none()
    
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )
    
    # Check if branch name already exists
    result = await db.execute(
        select(Branch).where(
            and_(Branch.article_id == article_id, Branch.name == branch_data.name)
        )
    )
    existing_branch = result.scalar_one_or_none()
    
    if existing_branch:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Branch name already exists"
        )
    
    branch = Branch(
        article_id=article_id,
        name=branch_data.name,
        head_commit_id=branch_data.head_commit_id
    )
    
    db.add(branch)
    await db.commit()
    await db.refresh(branch)
    
    return BranchResponse.model_validate(branch)
