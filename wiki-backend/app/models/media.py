from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

class Media(Base):
    __tablename__ = "media"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    article_id = Column(UUID(as_uuid=True), ForeignKey("articles.id"), nullable=False)
    commit_id = Column(UUID(as_uuid=True), ForeignKey("commits.id"), nullable=False)
    
    # Оригинальное имя файла
    original_filename = Column(String(255), nullable=False)
    
    # Путь к файлу в MinIO (bucket/object_key)
    storage_path = Column(Text, nullable=False)
    
    # Bucket в MinIO
    bucket_name = Column(String(100), nullable=False, default="media-files")
    
    # Уникальный ключ объекта в MinIO
    object_key = Column(Text, nullable=False)
    
    # MIME тип файла
    mime_type = Column(String(100), nullable=False)
    
    # Размер файла в байтах
    file_size = Column(Integer, nullable=False)
    
    # Публичный URL для доступа к файлу (если нужен)
    public_url = Column(Text, nullable=True)
    
    # Метаданные
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    article = relationship("Article", back_populates="media")
    commit = relationship("Commit", back_populates="media")