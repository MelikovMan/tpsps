from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class BranchTagBase(BaseModel):
    tag: str = Field(..., min_length=1, max_length=50)


class BranchTagCreate(BranchTagBase):
    branch_id: UUID


class BranchTagResponse(BranchTagBase):
    model_config = ConfigDict(from_attributes=True)
    
    branch_id: UUID
    created_by: UUID
    created_at: datetime


class BranchTagPermissionBase(BaseModel):
    tag: str
    role: str
    can_read: bool = True
    can_write: bool = False
    can_merge: bool = False
    can_delete_branch: bool = False


class BranchTagPermissionCreate(BranchTagPermissionBase):
    pass


class BranchTagPermissionResponse(BranchTagPermissionBase):
    model_config = ConfigDict(from_attributes=True)


class BranchAccessBase(BaseModel):
    branch_id: UUID
    user_id: UUID
    access_level: str = Field(..., pattern="^(read|write|admin)$")


class BranchAccessCreate(BranchAccessBase):
    pass


class BranchAccessResponse(BranchAccessBase):
    model_config = ConfigDict(from_attributes=True)
    
    granted_by: UUID
    granted_at: datetime


class BranchWithAccessInfo(BaseModel):
    """Схема ветки с информацией о доступе"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    article_id: UUID
    name: str
    description: str
    head_commit_id: UUID
    is_protected: bool
    is_private: bool
    created_by: UUID
    created_at: datetime
    tags: List[BranchTagResponse] = []
    user_access_level: Optional[str] = None  # Уровень доступа текущего пользователя
    can_read: bool = False
    can_write: bool = False
    can_merge: bool = False
    can_delete: bool = False


class BranchAccessCheck(BaseModel):
    """Результат проверки доступа к ветке"""
    has_access: bool
    access_level: str
    permissions: dict
    reason: Optional[str] = None