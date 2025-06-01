
# app/schemas/permission.py
from pydantic import BaseModel, ConfigDict
from pydantic import BaseModel, ConfigDict
from typing import Optional

class PermissionBase(BaseModel):
    role: str
    can_edit: bool = False
    can_delete: bool = False
    can_moderate: bool = False
    bypass_tag_restrictions: bool = False

class UserPermissionsResponse(PermissionBase):
    role: str
    
class PermissionCreate(PermissionBase):
    pass

class PermissionUpdate(BaseModel):
    can_edit: Optional[bool] = None
    can_delete: Optional[bool] = None
    can_moderate: Optional[bool] = None
    bypass_tag_restrictions: Optional[bool] = None

class PermissionResponse(PermissionBase):
    model_config = ConfigDict(from_attributes=True)
    