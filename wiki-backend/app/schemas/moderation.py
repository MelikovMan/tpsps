from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

class ModerationBase(BaseModel):
    reason: Optional[str] = None
    description: Optional[str] = None
    status: str = "pending"
    comment: Optional[str] = None

class ModerationCreate(BaseModel):
    commit_id: UUID
    reason: str
    description: Optional[str] = None
    reported_by: UUID

class ModerationUpdate(BaseModel):
    status: Optional[str] = None
    comment: Optional[str] = None

class ModerationResponse(ModerationBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    commit_id: UUID
    reported_by: UUID
    moderated_by: Optional[UUID] = None
    created_at: datetime
    moderated_at: Optional[datetime] = None
