# app/api/v1/tags.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import Row, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from app.core.security import get_current_user
from app.core.database import get_db
from app.schemas.tag import TagCreate, TagResponse, TagPermissionCreate, TagPermissionResponse
from app.services.tag_service import TagService
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[TagResponse])
async def get_all_tags(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Get all tags with pagination"""
    tag_service = TagService(db)
    return await tag_service.get_all_tags(skip=skip, limit=limit)

@router.get("/article/{article_id}", response_model=List[TagResponse])
async def get_article_tags(
    article_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get all tags for a specific article"""
    tag_service = TagService(db)
    return await tag_service.get_article_tags(article_id)

@router.post("/", response_model=TagResponse)
async def create_tag(
    tag: TagCreate,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new tag for an article"""
    tag_service = TagService(db)
    return await tag_service.create_tag(tag, current_user.id)

@router.delete("/{article_id}/{tag_name}")
async def delete_tag(
    article_id: UUID,
    tag_name: str,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a tag from an article"""
    tag_service = TagService(db)
    success = await tag_service.delete_tag(article_id, tag_name, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Tag not found")
    return {"message": "Tag deleted successfully"}

@router.post("/permissions/", response_model=TagPermissionResponse)
async def create_tag_permission(
    permission: TagPermissionCreate,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create tag permission (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    tag_service = TagService(db)
    return await tag_service.create_tag_permission(permission)

@router.get("/permissions/{tag_name}", response_model=List[TagPermissionResponse])
async def get_tag_permissions(
    tag_name: str,
    db: AsyncSession = Depends(get_db)
):
    """Get permissions for a specific tag"""
    tag_service = TagService(db)
    return await tag_service.get_tag_permissions(tag_name)
