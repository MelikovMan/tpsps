from sqlalchemy import Column, Index, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class Article(Base):
    __tablename__ = "articles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False, index=True)
    current_commit_id = Column(UUID(as_uuid=True), ForeignKey("commits.id"))
    status = Column(String(20), nullable=False, default="draft")
    article_type = Column(String(50), default="article")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    current_commit = relationship("Commit", foreign_keys=[current_commit_id])
    commits = relationship("Commit", back_populates="article", foreign_keys="Commit.article_id")
    branches = relationship("Branch", back_populates="article")
    categories = relationship("ArticleCategory", back_populates="article")
    tags = relationship("Tag", back_populates="article")
    media = relationship("Media", back_populates="article")
    comments = relationship("Comment", back_populates="article")
    user_profile = relationship("UserProfile", back_populates="public_page")

class Commit(Base):
    __tablename__ = "commits"
    
    __table_args__ = (
        Index('ix_commits_article_id', 'article_id'),
        Index('ix_commits_created_at', 'created_at'),
    )
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    article_id = Column(UUID(as_uuid=True), ForeignKey("articles.id"), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    content_diff = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_merge = Column(Boolean, default=False)
    
    # Relationships
    article = relationship("Article", back_populates="commits", foreign_keys=[article_id])
    author = relationship("User", back_populates="commits")
    parents = relationship("CommitParent", back_populates="commit", foreign_keys="CommitParent.commit_id")
    children = relationship("CommitParent", back_populates="parent", foreign_keys="CommitParent.parent_id")
    moderations = relationship("Moderation", back_populates="commit")
    media = relationship("Media", back_populates="commit")
    branches = relationship("Branch", back_populates="head_commit")

class CommitParent(Base):
    __tablename__ = "commit_parents"
    
    commit_id = Column(UUID(as_uuid=True), ForeignKey("commits.id"), primary_key=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("commits.id"), primary_key=True)
    
    # Relationships
    commit = relationship("Commit", back_populates="parents", foreign_keys=[commit_id])
    parent = relationship("Commit", back_populates="children", foreign_keys=[parent_id])

class Branch(Base):
    __tablename__ = "branches"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    article_id = Column(UUID(as_uuid=True), ForeignKey("articles.id"), nullable=False)
    name = Column(String(50), nullable=False)
    description = Column(String(100),default="New branch")
    head_commit_id = Column(UUID(as_uuid=True), ForeignKey("commits.id"), nullable=False)
    #is_protected = Column(Boolean, default=False)  # Защищенная ветка
    #is_private = Column(Boolean, default=False)    # Приватная ветка
    #created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    #created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    article = relationship("Article", back_populates="branches")
    head_commit = relationship("Commit", back_populates="branches")
    #creator = relationship("User", back_populates="created_branches")
    tags = relationship("BranchTag", back_populates="branch")
    user_access = relationship("BranchAccess", back_populates="branch")