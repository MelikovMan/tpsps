# app/models/moderation.py
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

class Moderation(Base):
    __tablename__ = "moderation"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    commit_id = Column(UUID(as_uuid=True), ForeignKey("commits.id"), nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    moderator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    comment = Column(Text)
    resolved_at = Column(DateTime(timezone=True))
    
    # Relationships
    commit = relationship("Commit", back_populates="moderations")
    moderator = relationship("User", back_populates="moderations")
