# app/api/routes/moderation.py
from fastapi import APIRouter, HTTPException, Depends, status
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
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Moderator access required"
        )
    
    moderation_service = ModerationService(db)
    return await moderation_service.get_moderations(status=status, skip=skip, limit=limit)

@router.post("/", response_model=ModerationResponse, status_code=status.HTTP_201_CREATED)
async def create_moderation(
    moderation_data: ModerationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a moderation request"""
    # Проверяем, что пользователь указал себя как репортера или является модератором
    if moderation_data.reported_by != current_user.id and not current_user.permission.can_moderate:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create moderation requests on your behalf"
        )
    
    moderation_service = ModerationService(db)
    try:
        return await moderation_service.create_moderation(moderation_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create moderation request"
        )

@router.get("/{moderation_id}", response_model=ModerationResponse)
async def get_moderation(
    moderation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific moderation request"""
    moderation_service = ModerationService(db)
    moderation = await moderation_service.get_moderation(moderation_id)
    
    if not moderation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Moderation request not found"
        )
    
    # Пользователь может видеть свои запросы или быть модератором
    if (moderation.reported_by != current_user.id and 
        not current_user.permission.can_moderate):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return moderation

@router.put("/{moderation_id}", response_model=ModerationResponse)
async def update_moderation(
    moderation_id: UUID,
    moderation_data: ModerationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Resolve a moderation request (moderators only)"""
    if not current_user.permission.can_moderate:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Moderator access required"
        )
    
    moderation_service = ModerationService(db)
    try:
        updated_moderation = await moderation_service.update_moderation(
            moderation_id, moderation_data, current_user.id
        )
        if not updated_moderation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Moderation request not found"
            )
        return updated_moderation
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update moderation request"
        )

@router.get("/commit/{commit_id}", response_model=List[ModerationResponse])
async def get_commit_moderations(
    commit_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get moderation requests for a specific commit"""
    if not current_user.permission.can_moderate:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Moderator access required"
        )
    
    moderation_service = ModerationService(db)
    return await moderation_service.get_commit_moderations(commit_id)

@router.get("/user/my", response_model=List[ModerationResponse])
async def get_my_moderations(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's moderation requests"""
    moderation_service = ModerationService(db)
    return await moderation_service.get_user_moderations(
        current_user.id, skip=skip, limit=limit
    )

@router.get("/stats/", response_model=dict)
async def get_moderation_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get moderation statistics (moderators only)"""
    if not current_user.permission.can_moderate:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Moderator access required"
        )
    
    moderation_service = ModerationService(db)
    return await moderation_service.get_moderations_stats()
