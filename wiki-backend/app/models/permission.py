# app/models/permission.py
from sqlalchemy import Column, String, Boolean
from sqlalchemy.orm import relationship

from app.core.database import Base

class Permission(Base):
    __tablename__ = "permissions"
    
    role = Column(String(20), primary_key=True)
    can_edit = Column(Boolean, default=False)
    can_delete = Column(Boolean, default=False)
    can_moderate = Column(Boolean, default=False)
    bypass_tag_restrictions = Column(Boolean, default=False)
    
    
    # Relationships
    users = relationship("User", back_populates="permission")
    tag_permissions = relationship("TagPermission", back_populates="permission")
    branch_tag_permissions = relationship("BranchTagPermission", back_populates="permission")