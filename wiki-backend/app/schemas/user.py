# app/schemas/user.py
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID

class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: str = "user"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    password: Optional[str] = None

class  UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    #access_token: str
    id:UUID
    #created_at: datetime
    #last_login: Optional[datetime] = None

class  RegisterResponse(UserResponse):
    access_token: str

class UserProfileBase(BaseModel):
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    social_links: Optional[Dict[str, Any]] = None

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