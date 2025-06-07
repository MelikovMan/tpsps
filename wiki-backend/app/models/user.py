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
    
    # Отношения с каскадным удалением
    profile = relationship(
        "UserProfile", 
        back_populates="user", 
        uselist=False,
        cascade="all, delete-orphan"
    )
    profile_versions = relationship(
        "ProfileVersion", 
        back_populates="user",
        cascade="all, delete-orphan"
    )
    commits = relationship(
        "Commit", 
        back_populates="author",
        cascade="all, delete-orphan"
    )
    comments = relationship(
        "Comment", 
        back_populates="user",
        cascade="all, delete-orphan"
    )
    moderations = relationship(
        "Moderation", 
        back_populates="moderator",
        cascade="all, delete-orphan"
    )
    permission = relationship("Permission")
    branch_tags = relationship(
        "BranchTag",
        cascade="all, delete-orphan"
    )
    created_branches = relationship(
        "Branch",
        cascade="all, delete-orphan"
    )
    branch_access = relationship(
        "BranchAccess", 
        foreign_keys="BranchAccess.user_id",
        cascade="all, delete-orphan"
    )

class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    user_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="CASCADE"), 
        primary_key=True
    )
    bio = Column(Text)
    avatar_url = Column(Text)
    social_links = Column(JSONB)
    
    user = relationship("User", back_populates="profile")

class ProfileVersion(Base):
    __tablename__ = "profile_versions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False
    )
    content = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="profile_versions")