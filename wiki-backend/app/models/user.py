from sqlalchemy import Column, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), ForeignKey("permissions.role"), nullable=False, default="user")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True))
    
    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False)
    profile_versions = relationship("ProfileVersion", back_populates="user")
    commits = relationship("Commit", back_populates="author")
    comments = relationship("Comment", back_populates="user")
    moderations = relationship("Moderation", back_populates="moderator")
    permission = relationship("Permission", back_populates="users")
    branch_tags = relationship("BranchTag", back_populates="creator")
    #created_branches = relationship("Branch", back_populates="creator")
    branch_access = relationship("BranchAccess", foreign_keys="BranchAccess.user_id", back_populates="user")


class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    bio = Column(Text)
    avatar_url = Column(Text)
    social_links = Column(JSONB)
    
    # Relationships
    user = relationship("User", back_populates="profile")
    public_page = relationship("Article", back_populates="user_profile")

class ProfileVersion(Base):
    __tablename__ = "profile_versions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="profile_versions")