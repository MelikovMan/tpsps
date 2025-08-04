from sqlalchemy import Column, Index, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base
from app.models.media import article_media_association, commit_media_association
class Article(Base):
    __tablename__ = "articles"
    __table_args__ = (
        Index('ix_articles_article_id', 'id'),
        Index('ix_articles_title', 'title'),
        Index('ix_articles_status', 'status'),
        Index('ix_articles_current_commit_id', 'current_commit_id'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False, index=True)
    current_commit_id = Column(UUID(as_uuid=True))
    status = Column(String(20), nullable=False, default="draft")
    article_type = Column(String(50), default="article")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Убраны циклические зависимости
    branches = relationship("Branch", back_populates="article")
    categories = relationship("ArticleCategory", back_populates="article")
    tags = relationship("Tag", back_populates="article")
    media = relationship(
        "Media", 
        secondary=article_media_association,
        back_populates="articles"
    )
    comments = relationship("Comment", back_populates="article")

class Commit(Base):
    __tablename__ = "commits"
    
    __table_args__ = (
        Index('ix_commits_article_id', 'article_id'),
        Index('ix_commits_author_id', 'author_id'),
        Index('ix_commits_created_at', 'created_at'),
        Index('ix_commits_is_merge', 'is_merge'),
    )
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    article_id = Column(UUID(as_uuid=True), ForeignKey("articles.id"), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    content_diff = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_merge = Column(Boolean, default=False)
    
    # Упрощенные отношения
    author = relationship("User")
    parents = relationship("CommitParent", 
                          primaryjoin="Commit.id == CommitParent.commit_id",
                          back_populates="commit")
    moderations = relationship("Moderation", back_populates="commit")
    media = relationship(
        "Media", 
        secondary=commit_media_association,
        back_populates="commits"
    )
    branches = relationship("Branch", back_populates="head_commit")
    text = relationship("ArticleFull",back_populates="commit_fulls")

class CommitParent(Base):
    __tablename__ = "commit_parents"
    
    __table_args__ = (
        Index('ix_commit_parents_commit_id', 'commit_id'),
        Index('ix_commit_parents_parent_id', 'parent_id'),
    )

    commit_id = Column(UUID(as_uuid=True), ForeignKey("commits.id"), primary_key=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("commits.id"), primary_key=True)
    
    # Исправленные отношения
    commit = relationship("Commit", foreign_keys=[commit_id], back_populates="parents")
    parent = relationship("Commit", foreign_keys=[parent_id])

class Branch(Base):
    __tablename__ = "branches"
    
    __table_args__ = (
        Index('ix_branches_article_id', 'article_id'),
        Index('ix_branches_name_article', 'article_id', 'name', unique=True),
        Index('ix_branches_created_by', 'created_by'),
        Index('ix_branches_head_commit_id', 'head_commit_id'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    article_id = Column(UUID(as_uuid=True), ForeignKey("articles.id"), nullable=False)
    name = Column(String(50), nullable=False)
    description = Column(String(100),default="New branch")
    head_commit_id = Column(UUID(as_uuid=True), ForeignKey("commits.id"), nullable=False)
    is_protected = Column(Boolean, default=False)
    is_private = Column(Boolean, default=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Упрощенные отношения
    article = relationship("Article", back_populates="branches")
    head_commit = relationship("Commit")
    creator = relationship("User")
    tags = relationship("BranchTag", back_populates="branch")
    user_access = relationship("BranchAccess", back_populates="branch")

class ArticleFull(Base):
    __tablename__ = "articles_full_text"
    __table_args__ = (
        Index('ix_articles_full_article_id', 'article_id'),
        Index('ix_articles_full_commit_id', 'commit_id'),
    )

    article_id = Column(UUID(as_uuid=True), ForeignKey("articles.id"), primary_key=True)
    commit_id = Column(UUID(as_uuid=True), ForeignKey("commits.id"), primary_key=True)
    text = Column(Text, nullable=False)
    
    # Убраны циклические зависимости
    article = relationship("Article")
    commit_fulls = relationship("Commit", back_populates="text")