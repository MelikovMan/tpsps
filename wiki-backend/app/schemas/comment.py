# app/schemas/comment.py
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    article_id: UUID
    reply_to_id: Optional[UUID] = None

class CommentUpdate(BaseModel):
    content: Optional[str] = None

class CommentResponse(CommentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    article_id: UUID
    user_id: UUID
    created_at: datetime
    reply_to_id: Optional[UUID] = None
    replies: List["CommentResponse"] = []

CommentResponse.model_rebuild()
