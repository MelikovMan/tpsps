# app/schemas/tag.py
from pydantic import BaseModel, ConfigDict
from uuid import UUID

class TagBase(BaseModel):
    tag: str

class TagCreate(TagBase):
    article_id: UUID

class TagResponse(TagBase):
    model_config = ConfigDict(from_attributes=True)
    
    article_id: UUID

class TagPermissionBase(BaseModel):
    tag: str
    role: str
    can_edit: bool = False

class TagPermissionCreate(TagPermissionBase):
    pass

class TagPermissionResponse(TagPermissionBase):
    model_config = ConfigDict(from_attributes=True)