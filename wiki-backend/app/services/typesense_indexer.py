from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert, delete
from app.models.search_sync_table import SearchSyncQueue  # новая модель

class TypesenseIndexer:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def mark_for_sync(self, article_id: UUID, operation: str = 'upsert'):
        # Можно использовать merge/on conflict для обновления, но для простоты будем вставлять новую запись
        # Позже при обработке мы возьмём последнюю по времени для каждой статьи.
        stmt = insert(SearchSyncQueue).values(
            article_id=article_id,
            operation=operation
        )
        await self.db.execute(stmt)
        await self.db.commit()