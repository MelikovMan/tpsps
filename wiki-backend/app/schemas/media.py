# app/schemas/media.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional

class MediaBase(BaseModel):
    original_filename: str
    mime_type: str
    file_size: int

class MediaCreate(MediaBase):
    article_id: UUID
    commit_id: UUID
    storage_path: str
    bucket_name: str = "media-files"
    object_key: str
    public_url: Optional[str] = None

class MediaUpdate(BaseModel):
    original_filename: Optional[str] = None
    public_url: Optional[str] = None

class MediaResponse(MediaBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    article_id: UUID
    commit_id: UUID
    storage_path: str
    bucket_name: str
    object_key: str
    public_url: Optional[str]
    uploaded_at: datetime
    updated_at: Optional[datetime]

class MediaUploadResponse(BaseModel):
    """Ответ при загрузке файла"""
    media: MediaResponse
    download_url: str  # Временная ссылка для скачивания