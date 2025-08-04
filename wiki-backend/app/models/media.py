from sqlalchemy import Column, String, DateTime, Table, Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base
article_media_association = Table(
    'article_media',
    Base.metadata,
    Column('article_id', UUID(as_uuid=True), ForeignKey('articles.id'), primary_key=True),
    Column('media_id', UUID(as_uuid=True), ForeignKey('media.id'), primary_key=True),
    Column('created_at', DateTime(timezone=True), server_default=func.now())
)

commit_media_association = Table(
    'commit_media',
    Base.metadata,
    Column('commit_id', UUID(as_uuid=True), ForeignKey('commits.id'), primary_key=True),
    Column('media_id', UUID(as_uuid=True), ForeignKey('media.id'), primary_key=True),
    Column('created_at', DateTime(timezone=True), server_default=func.now())
)
class Media(Base):
    __tablename__ = "media"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
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
    articles = relationship(
        "Article", 
        secondary=article_media_association,
        back_populates="media"
    )
    
    commits = relationship(
        "Commit",
        secondary=commit_media_association,
        back_populates="media"
    )