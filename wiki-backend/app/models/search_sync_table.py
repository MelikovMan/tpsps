# app/models/typesense_queue.py
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Index, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class SearchSyncQueue(Base):
    __tablename__ = "search_sync_queue"
    __table_args__ = (
        Index('ix_typesense_sync_queue_article_id', 'article_id'),
        Index('ix_typesense_sync_queue_created_at', 'created_at'),
    )

    id = Column(Integer, primary_key=True)
    article_id = Column(UUID(as_uuid=True), ForeignKey("articles.id"), nullable=False)
    operation = Column(String(10), nullable=False)  # 'upsert' or 'delete'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    article = relationship("Article", back_populates="sync_queue_items")
    # Можно добавить поле processed, но проще удалять после обработки