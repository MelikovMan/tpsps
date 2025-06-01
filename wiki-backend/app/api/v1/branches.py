# app/api/v1/branches.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.schemas.article import BranchCreate, BranchResponse, BranchCreateFromCommit
from app.services.branch_service import BranchService
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/article/{article_id}", response_model=List[BranchResponse])
async def get_article_branches(
    article_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get all branches for a specific article"""
    branch_service = BranchService(db)
    try:
        branches = await branch_service.get_article_branches(article_id)
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
        new_branch = await branch_service.create_branch(branch)
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
        new_branch = await branch_service.create_branch_from_commit(article_id, branch_data)
        return BranchResponse.model_validate(new_branch)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{branch_id}", response_model=BranchResponse)
async def get_branch(
    branch_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific branch by ID"""
    branch_service = BranchService(db)
    branch = await branch_service.get_branch(branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    return BranchResponse.model_validate(branch)


@router.get("/article/{article_id}/by-name/{branch_name}", response_model=BranchResponse)
async def get_branch_by_name(
    article_id: UUID,
    branch_name: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a branch by name within an article"""
    branch_service = BranchService(db)
    branch = await branch_service.get_branch_by_name(article_id, branch_name)
    
    if not branch:
        raise HTTPException(
            status_code=404,
            detail=f"Branch '{branch_name}' not found in article"
        )
    
    return BranchResponse.model_validate(branch)


@router.get("/article/{article_id}/by-commit/{commit_id}", response_model=BranchResponse)
async def get_branch_by_head_commit(
    article_id: UUID,
    commit_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get branch where the given commit is the head commit"""
    branch_service = BranchService(db)
    branch = await branch_service.get_branch_by_head_commit(article_id, commit_id)
    
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
    """Delete a branch"""
    branch_service = BranchService(db)
    try:
        success = await branch_service.delete_branch(branch_id)
        if not success:
            raise HTTPException(status_code=404, detail="Branch not found")
        return {"message": "Branch deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{source_branch_id}/merge/{target_branch_id}")
async def merge_branch(
    source_branch_id: UUID,
    target_branch_id: UUID,
    message: str|None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Merge a branch into another branch"""
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
async def get_branch_commits_count(
    branch_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get the number of commits in a branch"""
    branch_service = BranchService(db)
    count = await branch_service.get_branch_commits_count(branch_id)
    return {"branch_id": branch_id, "commits_count": count}


@router.get("/article/{article_id}/with-counts")
async def get_branches_with_commit_counts(
    article_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get all branches for an article with commit counts"""
    branch_service = BranchService(db)
    try:
        branches_with_counts = await branch_service.get_branches_with_commit_count(article_id)
        result = []
        for branch, count in branches_with_counts:
            branch_data = BranchResponse.model_validate(branch).model_dump()
            branch_data["commits_count"] = count
            result.append(branch_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))