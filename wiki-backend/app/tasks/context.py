# app/tasks/context.py
from dataclasses import dataclass
from sqlalchemy.ext.asyncio import AsyncSession
from typesense import AsyncClient
from app.core.minio_client import MinIOClient
import httpx

@dataclass
class TaskContext:
    """Типобезопасные зависимости для задач streaq."""
    db_session: AsyncSession
    typesense_client: AsyncClient
    minio_client: MinIOClient
    http_client: httpx.AsyncClient