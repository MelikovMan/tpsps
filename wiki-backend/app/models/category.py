from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID 
from sqlalchemy_utils.types.ltree import LtreeType
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, index=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"))
    path = Column(LtreeType, nullable=False, index=True)
    
    # Relationships
    parent = relationship("Category", remote_side=[id], back_populates="children")
    children = relationship("Category", back_populates="parent")
    articles = relationship("ArticleCategory", back_populates="category")

class ArticleCategory(Base):
    __tablename__ = "article_categories"
    
    article_id = Column(UUID(as_uuid=True), ForeignKey("articles.id"), primary_key=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), primary_key=True)
    
    # Relationships
    article = relationship("Article", back_populates="categories")
    category = relationship("Category", back_populates="articles")
