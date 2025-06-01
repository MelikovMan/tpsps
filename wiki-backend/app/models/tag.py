from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base

class Tag(Base):
    __tablename__ = "tags"
    
    article_id = Column(UUID(as_uuid=True), ForeignKey("articles.id"), primary_key=True)
    tag = Column(String(50), primary_key=True, index=True)
    
    # Relationships  
    article = relationship("Article", back_populates="tags")
    permissions = relationship("TagPermission", back_populates="tag_obj")

class TagPermission(Base):
    __tablename__ = "tag_permissions"
    
    tag = Column(String(50), ForeignKey("tags.tag"), primary_key=True)
    role = Column(String(20), ForeignKey("permissions.role"), primary_key=True)
    can_edit = Column(Boolean, default=False)
    
    # Relationships
    tag_obj = relationship("Tag", back_populates="permissions")
    permission = relationship("Permission", back_populates="tag_permissions")
