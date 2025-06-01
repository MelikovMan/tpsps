
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.schemas.moderation import ModerationCreate, ModerationUpdate, ModerationResponse
from app.services.moderation_service import ModerationService
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[ModerationResponse])
async def get_moderations(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get moderation requests (moderators only)"""
    if not current_user.permission.can_moderate:
        raise HTTPException(status_code=403, detail="Moderator access required")
    
    moderation_service = ModerationService(db)
    return await moderation_service.get_moderations(status=status, skip=skip, limit=limit)

@router.post("/", response_model=ModerationResponse)
async def create_moderation(
    moderation: ModerationCreate,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a moderation request"""
    moderation_service = ModerationService(db)
    return await moderation_service.create_moderation(moderation)

@router.get("/{moderation_id}", response_model=ModerationResponse)
async def get_moderation(
    moderation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific moderation request"""
    if not current_user.permission.can_moderate:
        raise HTTPException(status_code=403, detail="Moderator access required")
    
    moderation_service = ModerationService(db)
    moderation = await moderation_service.get_moderation(moderation_id)
    if not moderation:
        raise HTTPException(status_code=404, detail="Moderation request not found")
    return moderation

@router.put("/{moderation_id}", response_model=ModerationResponse)
async def update_moderation(
    moderation_id: UUID,
    moderation: ModerationUpdate,
    current_user= Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Resolve a moderation request (moderators only)"""
    if not current_user.permission.can_moderate:
        raise HTTPException(status_code=403, detail="Moderator access required")
    
    moderation_service = ModerationService(db)
    updated_moderation = await moderation_service.update_moderation(
        moderation_id, moderation, current_user.id
    )
    if not updated_moderation:
        raise HTTPException(status_code=404, detail="Moderation request not found")
    return updated_moderation

@router.get("/commit/{commit_id}", response_model=List[ModerationResponse])
async def get_commit_moderations(
    commit_id: UUID,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get moderation requests for a specific commit"""
    if not current_user.permission.can_moderate:
        raise HTTPException(status_code=403, detail="Moderator access required")
    
    moderation_service = ModerationService(db)
    return await moderation_service.get_commit_moderations(commit_id)