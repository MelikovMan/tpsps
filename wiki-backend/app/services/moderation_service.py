# app/services/moderation_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.models.moderation import Moderation
from app.schemas.moderation import ModerationCreate, ModerationUpdate


class ModerationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_moderations(self, status: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Moderation]:
        """Get moderation requests with optional status filter"""
        query = select(Moderation)
        
        if status:
            query = query.where(Moderation.status == status)
        
        query = query.offset(skip).limit(limit).order_by(Moderation.created_at.desc())
        result = await self.db.execute(query)
        return result.scalars().all()

    async def create_moderation(self, moderation_data: ModerationCreate) -> Moderation:
        """Create a moderation request"""
        moderation = Moderation(
            commit_id=moderation_data.commit_id,
            reason=moderation_data.reason,
            description=moderation_data.description,
            reported_by=moderation_data.reported_by,
            status="pending"
        )
        
        self.db.add(moderation)
        await self.db.commit()
        await self.db.refresh(moderation)
        return moderation

    async def get_moderation(self, moderation_id: UUID) -> Optional[Moderation]:
        """Get a specific moderation request"""
        query = select(Moderation).where(Moderation.id == moderation_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def update_moderation(self, moderation_id: UUID, moderation_data: ModerationUpdate, moderator_id: UUID) -> Optional[Moderation]:
        """Update/resolve a moderation request"""
        query = select(Moderation).where(Moderation.id == moderation_id)
        result = await self.db.execute(query)
        moderation = result.scalar_one_or_none()
        
        if not moderation:
            return None
        
        update_data = moderation_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(moderation, field, value)
        
        moderation.moderated_by = moderator_id
        moderation.moderated_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(moderation)
        return moderation

    async def get_commit_moderations(self, commit_id: UUID) -> List[Moderation]:
        """Get moderation requests for a specific commit"""
        query = select(Moderation).where(Moderation.commit_id == commit_id)
        result = await self.db.execute(query)
        return result.scalars().all()
