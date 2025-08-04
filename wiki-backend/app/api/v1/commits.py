# app/api/v1/commits.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.schemas.article import (
    CommitResponse, 
    CommitCreate, 
    CommitResponseDetailed,
    DiffResponse
)
from app.services.commit_service import CommitService
from app.core.security import get_current_user
from app.models.user import User
from fastapi_cache.decorator import cache
from app.core.config import settings

router = APIRouter()


@router.get("/article/{article_id}", response_model=List[CommitResponse])
@cache(expire=settings.cache_expire)
async def get_article_commits(
    article_id: UUID,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Get all commits for a specific article"""
    commit_service = CommitService(db)
    try:
        commits = await commit_service.get_article_commits(article_id, skip=skip, limit=limit)
        return [CommitResponse.model_validate(commit) for commit in commits]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/branch/{branch_id}", response_model=List[CommitResponse])
@cache(expire=settings.cache_expire)
async def get_branch_commits(
    branch_id: UUID,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Get commits for a specific branch"""
    commit_service = CommitService(db)
    try:
        commits = await commit_service.get_branch_commits(branch_id, skip=skip, limit=limit)
        return [CommitResponse.model_validate(commit) for commit in commits]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/article/{article_id}", response_model=CommitResponse)
async def create_commit(
    article_id: UUID,
    commit_data: CommitCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new commit for an article"""
    commit_service = CommitService(db)
    try:
        new_commit = await commit_service.create_commit(
            article_id=article_id,
            author_id=current_user.id,
            message=commit_data.message,
            content=commit_data.content,
            branch_id=commit_data.branch_id
        )
        return CommitResponse.model_validate(new_commit)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{commit_id}", response_model=CommitResponse)
@cache(expire=settings.cache_expire)
async def get_commit(
    commit_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific commit by ID"""
    commit_service = CommitService(db)
    commit = await commit_service.get_commit(commit_id)
    if not commit:
        raise HTTPException(status_code=404, detail="Commit not found")
    return CommitResponse.model_validate(commit)


@router.get("/{commit_id}/detailed", response_model=CommitResponseDetailed)
@cache(expire=settings.cache_expire)
async def get_commit_detailed(
    commit_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get a commit with detailed information including author and branch"""
    commit_service = CommitService(db)
    commit_details = await commit_service.get_commit_with_details(commit_id)
    
    if not commit_details:
        raise HTTPException(status_code=404, detail="Commit not found")
    
    commit, author_name, branch_name = commit_details
    
    # Rebuild content at this commit
    content = await commit_service.rebuild_content_at_commit(commit_id)
    
    response = CommitResponseDetailed.model_validate(commit)
    response.content = content
    response.author_name = author_name
    response.branch_name = branch_name
    
    return response


@router.get("/{commit_id}/diff", response_model=DiffResponse)
@cache(expire=settings.cache_expire)
async def get_commit_diff(
    commit_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get the diff for a specific commit"""
    commit_service = CommitService(db)
    diff = await commit_service.get_commit_diff(commit_id)
    if diff is None:
        raise HTTPException(status_code=404, detail="Commit not found")
    return diff


@router.get("/{commit_id}/content")
@cache(expire=settings.cache_expire)
async def get_commit_content(
    commit_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get the full content at a specific commit"""
    commit_service = CommitService(db)
    content = await commit_service.rebuild_content_at_commit(commit_id)
    if content is None:
        raise HTTPException(status_code=404, detail="Commit not found")
    return {"commit_id": commit_id, "content": content}


@router.post("/{commit_id}/revert", response_model=CommitResponse)
async def revert_commit(
    commit_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Revert a specific commit"""
    commit_service = CommitService(db)
    try:
        new_commit = await commit_service.revert_commit(commit_id, current_user.id)
        if not new_commit:
            raise HTTPException(status_code=400, detail="Unable to revert commit")
        return CommitResponse.model_validate(new_commit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))