from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import List, Optional
from enum import Enum

class MediaFileType(str, Enum):
    ALL = "all"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    PDF = "pdf"
    TEXT = "text"

class MediaBase(BaseModel):
    original_filename: str
    bucket_name: str
    object_key: str
    mime_type: str
    file_size: int

class MediaCreate(MediaBase):
    public_url: Optional[str] = None

class MediaResponse(MediaBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    storage_path: str
    public_url: str
    uploaded_at: datetime

class MediaListResponse(BaseModel):
    data: List[MediaResponse]
    total: int


class MediaInfoResponse(MediaResponse):
    articles: List[dict] = []
    commits: List[dict] = []
    is_orphaned: bool

class MediaUploadResponse(MediaResponse):
    message: str = "File uploaded successfully"

class ArticleReference(BaseModel):
    id: UUID
    title: str

class CommitReference(BaseModel):
    id: UUID
    message: str