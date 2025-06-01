# app/schemas/article.py
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


class ArticleBase(BaseModel):
    title: str
    status: str = "draft"
    article_type: str = "article"


class ArticleCreate(ArticleBase):
    content: str
    message: str = "Initial commit"


class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    message: str = "Update article"


class ArticleResponse(ArticleBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    current_commit_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime


class ArticleResponseOne(ArticleResponse):
    content: str
    id: UUID
    current_commit_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime


class CommitBase(BaseModel):
    message: str
    content_diff: str
    is_merge: bool = False


class CommitCreate(BaseModel):
    message: str
    content: str  # Полное содержимое для нового коммита
    branch_id: Optional[UUID] = None  # Если не указана, используется main ветка


class CommitCreateInternal(CommitBase):
    article_id: UUID
    author_id: UUID


class CommitResponse(CommitBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    article_id: UUID
    author_id: UUID
    created_at: datetime


class CommitResponseDetailed(CommitResponse):
    """Детальная информация о коммите с содержимым"""
    content: Optional[str] = None
    author_name: Optional[str] = None
    branch_name: Optional[str] = None


class BranchBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    description: str = ""


class BranchCreate(BranchBase):
    article_id: UUID
    head_commit_id: UUID


class BranchCreateFromCommit(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    description: str = ""
    source_commit_id: UUID  # Коммит от которого создается ветка


class BranchResponse(BranchBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    article_id: UUID
    head_commit_id: UUID
    created_at: datetime


class DiffResponse(BaseModel):
    """Схема для отображения различий между коммитами"""
    commit_id: UUID
    parent_commit_id: Optional[UUID]
    diff: str
    added_lines: int
    removed_lines: int