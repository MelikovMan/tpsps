# app/schemas/category.py
from pydantic import BaseModel, ConfigDict, field_serializer
from typing import Optional, List, Any
from uuid import UUID
from sqlalchemy_utils import Ltree

class CategoryBase(BaseModel):
    name: str
    parent_id: Optional[UUID] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[UUID] = None

class CategoryResponse(CategoryBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    path: str
    children: Optional[List["str"]] = None

    @field_serializer('path', when_used='always')
    def serialize_path(self, path: Ltree, _info) -> str:
        return str(path)

CategoryResponse.model_rebuild()