# app/schemas/category.py
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from uuid import UUID

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
    children: Optional[List["CategoryResponse"]] = None

CategoryResponse.model_rebuild()