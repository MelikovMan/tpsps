# app/api/v1/branches.py
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.schemas.article import (
    BranchCreate, 
    BranchResponse, 
    BranchCreateFromCommit, 
    BranchUpdate,
    BranchWithCommitCount
)
from app.services.branch_service import BranchService
from app.core.security import get_current_user, get_current_user_optional
from app.models.user import User
from fastapi_cache.decorator import cache
from app.core.config import settings

router = APIRouter()


@router.get("/article/{article_id}", response_model=List[BranchResponse])
@cache(expire=settings.cache_expire)
async def get_article_branches(
    article_id: UUID,
    include_private: bool = Query(False, description="Include private branches (only for creators)"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """Get all branches for a specific article with access control"""
    branch_service = BranchService(db)
    try:
        user_id = current_user.id if current_user else None
        branches = await branch_service.get_article_branches(
            article_id, 
            user_id, 
            include_private
        )
        return [BranchResponse.model_validate(branch) for branch in branches]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=BranchResponse)
async def create_branch(
    branch: BranchCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new branch for an article"""
    branch_service = BranchService(db)
    try:
        new_branch = await branch_service.create_branch(branch, current_user.id)
        return BranchResponse.model_validate(new_branch)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/article/{article_id}/from-commit", response_model=BranchResponse)
async def create_branch_from_commit(
    article_id: UUID,
    branch_data: BranchCreateFromCommit,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new branch starting from a specific commit"""
    branch_service = BranchService(db)
    try:
        new_branch = await branch_service.create_branch_from_commit(
            article_id, 
            branch_data, 
            current_user.id
        )
        return BranchResponse.model_validate(new_branch)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{branch_id}", response_model=BranchResponse)
@cache(expire=settings.cache_expire)
async def get_branch(
    branch_id: UUID,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific branch by ID with access control"""
    branch_service = BranchService(db)
    user_id = current_user.id if current_user else None
    branch = await branch_service.get_branch(branch_id, user_id)
    
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    return BranchResponse.model_validate(branch)


@router.put("/{branch_id}", response_model=BranchResponse)
async def update_branch(
    branch_id: UUID,
    branch_data: BranchUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a branch (only creator can update)"""
    branch_service = BranchService(db)
    try:
        updated_branch = await branch_service.update_branch(
            branch_id, 
            branch_data, 
            current_user.id
        )
        if not updated_branch:
            raise HTTPException(status_code=404, detail="Branch not found")
        return BranchResponse.model_validate(updated_branch)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/article/{article_id}/by-name/{branch_name}", response_model=BranchResponse)
@cache(expire=settings.cache_expire)
async def get_branch_by_name(
    article_id: UUID,
    branch_name: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """Get a branch by name within an article with access control"""
    branch_service = BranchService(db)
    user_id = current_user.id if current_user else None
    branch = await branch_service.get_branch_by_name(article_id, branch_name, user_id)
    
    if not branch:
        raise HTTPException(
            status_code=404,
            detail=f"Branch '{branch_name}' not found in article"
        )
    
    return BranchResponse.model_validate(branch)


@router.get("/article/{article_id}/by-commit/{commit_id}", response_model=BranchResponse)
@cache(expire=settings.cache_expire)
async def get_branch_by_head_commit(
    article_id: UUID,
    commit_id: UUID,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """Get branch where the given commit is the head commit"""
    branch_service = BranchService(db)
    user_id = current_user.id if current_user else None
    branch = await branch_service.get_branch_by_head_commit(article_id, commit_id, user_id)
    
    if not branch:
        raise HTTPException(
            status_code=404,
            detail="No branch found with this commit as head"
        )
    
    return BranchResponse.model_validate(branch)


@router.delete("/{branch_id}")
async def delete_branch(
    branch_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a branch (only creator can delete, protected branches cannot be deleted)"""
    branch_service = BranchService(db)
    try:
        success = await branch_service.delete_branch(branch_id, current_user.id)
        if not success:
            raise HTTPException(status_code=404, detail="Branch not found")
        return {"message": "Branch deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{source_branch_id}/merge/{target_branch_id}")
async def merge_branch(
    source_branch_id: UUID,
    target_branch_id: UUID,
    message: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Merge a branch into another branch with access control"""
    branch_service = BranchService(db)
    try:
        success = await branch_service.merge_branch(
            source_branch_id, 
            target_branch_id, 
            current_user.id, 
            message
        )
        if not success:
            raise HTTPException(status_code=400, detail="Unable to merge branches")
        return {"message": "Branch merged successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{branch_id}/commits-count")
@cache(expire=settings.cache_expire)
async def get_branch_commits_count(
    branch_id: UUID,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """Get the number of commits in a branch"""
    branch_service = BranchService(db)
    
    # Check access to branch first
    user_id = current_user.id if current_user else None
    branch = await branch_service.get_branch(branch_id, user_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    count = await branch_service.get