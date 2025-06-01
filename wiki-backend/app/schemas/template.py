# app/schemas/template.py
from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID

class TemplateBase(BaseModel):
    name: str
    content: str
    variables: Optional[Dict[str, Any]] = None

class TemplateCreate(TemplateBase):
    pass

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    variables: Optional[Dict[str, Any]] = None

class TemplateResponse(TemplateBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    created_at: datetime
