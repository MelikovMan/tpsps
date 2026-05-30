# app/tasks/worker.py
from contextlib import asynccontextmanager
from typing import AsyncIterator
from streaq import Worker
from app.tasks.context import TaskContext
from app.core.database import AsyncSessionLocal
from app.core.typesense_client import typesense_client
from app.core.minio_client import minio_client
import httpx
from app.core.config import settings

@asynccontextmanager
async def lifespan() -> AsyncIterator[TaskContext]:
    """
    Контекстный менеджер для инициализации зависимостей воркера.
    Выполняется при старте и завершении работы воркера.
    """
    # Здесь можно выполнить подготовительные операции (например, очистку очереди)
    await typesense_client.initialize()
    async with AsyncSessionLocal() as db_session:
        async with httpx.AsyncClient() as http_client:
            ts_client = typesense_client.get_client()
            yield TaskContext(
                db_session=db_session,
                typesense_client=ts_client,
                minio_client=minio_client,
                http_client=http_client
            )
    # После завершения воркера можно выполнить очистку

# Создаём глобальный экземпляр воркера
worker = Worker(
    redis_url=settings.redis_url,
    lifespan=lifespan,
    concurrency=5,          # Максимум одновременных задач
    sync_concurrency=2,     # Для синхронных операций
    queue_name="backup_queue"
)