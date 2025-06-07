# app/schemas/user.py
from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    role: str = "user"

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8)

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    created_at: datetime
    last_login: Optional[datetime] = None

class RegisterResponse(UserResponse):
    access_token: str

class UserProfileBase(BaseModel):
    bio: Optional[str] = Field(None, max_length=1000)
    avatar_url: Optional[str] = Field(None, max_length=500)
    social_links: Optional[Dict[str, str]] = Field(None, description="Социальные ссылки")

class UserProfileCreate(UserProfileBase):
    pass

class UserProfileUpdate(UserProfileBase):
    pass

class UserProfileResponse(UserProfileBase):
    model_config = ConfigDict(from_attributes=True)
    
    user_id: UUID
    user: Optional[UserResponse] = None

class ProfileVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    user_id: UUID
    content: Dict[str, Any]
    created_at: datetime

# Расширенный ответ пользователя с профилем
class UserWithProfileResponse(UserResponse):
    profile: Optional[UserProfileResponse] = None

# Схема для массовых операций
class BulkUserOperation(BaseModel):
    user_ids: List[UUID]
    action: str = Field(..., pattern="^(delete|deactivate|activate)$")

class UserSearchFilter(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None