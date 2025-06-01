# app/schemas/moderation.py
from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

class ModerationBase(BaseModel):
    status: str = "pending"
    comment: Optional[str] = None

class ModerationCreate(ModerationBase):
    commit_id: UUID

class ModerationUpdate(BaseModel):
    status: Optional[str] = None
    comment: Optional[str] = None

class ModerationResponse(ModerationBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    commit_id: UUID
    moderator_id: Optional[UUID] = None
    resolved_at: Optional[datetime] = None

