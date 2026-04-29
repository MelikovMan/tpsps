# app/schemas/template.py
from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID
import json
class TemplateBase(BaseModel):
    name: str
    content: str
    variables: Optional[Dict[str, Any]] = None
    @field_validator('variables', mode='before')
    @classmethod
    def parse_variables(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return v

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
