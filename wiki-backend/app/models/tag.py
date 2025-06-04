from sqlalchemy import Column, ForeignKeyConstraint, String, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base

class Tag(Base):
    __tablename__ = "tags"
    
    article_id = Column(UUID(as_uuid=True), ForeignKey("articles.id"), primary_key=True)
    tag = Column(String(50), primary_key=True, index=True)
    
    # Упрощенные отношения
    article = relationship("Article", back_populates="tags")
    permissions = relationship("TagPermission", back_populates="tag_obj")

class TagPermission(Base):
    __tablename__ = "tag_permissions"
    
    article_id = Column(UUID(as_uuid=True), primary_key=True)
    tag = Column(String(50), primary_key=True)
    role = Column(String(20), ForeignKey("permissions.role"), primary_key=True)
    can_edit = Column(Boolean, default=False)
    
    __table_args__ = (
        ForeignKeyConstraint(
            ['article_id', 'tag'], 
            ['tags.article_id', 'tags.tag']
        ),
    )
    
    # Упрощенные отношения
    tag_obj = relationship("Tag", back_populates="permissions")
    permission = relationship("Permission")