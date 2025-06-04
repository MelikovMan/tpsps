# app/models/branch_tag.py
import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base

class BranchTag(Base):
    __tablename__ = "branch_tags"
    
    branch_id = Column(UUID(as_uuid=True), ForeignKey("branches.id"), primary_key=True)
    tag = Column(String(50), primary_key=True, index=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Упрощенные отношения
    branch = relationship("Branch", back_populates="tags")
    creator = relationship("User")

class BranchTagPermission(Base):
    __tablename__ = "branch_tag_permissions"
    
    tag = Column(String(50), primary_key=True, index=True)
    role = Column(String(20), ForeignKey("permissions.role"), primary_key=True)
    can_read = Column(Boolean, default=True)
    can_write = Column(Boolean, default=False)
    can_merge = Column(Boolean, default=False)
    can_delete_branch = Column(Boolean, default=False)
    
    # Удалена попытка связи с BranchTag
    permission = relationship("Permission")

class BranchAccess(Base):
    __tablename__ = "branch_access"
    
    branch_id = Column(UUID(as_uuid=True), ForeignKey("branches.id"), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    access_level = Column(String(20), nullable=False, default="read")
    granted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    granted_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Упрощенные отношения
    branch = relationship("Branch", back_populates="user_access")
    user = relationship("User", foreign_keys=[user_id])
    granter = relationship("User", foreign_keys=[granted_by])