# app/services/typesense_sync_worker.py
import asyncio
from typing import Dict, List
from uuid import UUID

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from typesense import AsyncClient

from app.core.database import AsyncSessionLocal
from app.core.typesense_client import typesense_client 
from app.models.search_sync_table import SearchSyncQueue
from app.services.commit_service import CommitService  # для получения контента статьи

class TypesenseSyncWorker:
    def __init__(self, interval_seconds: int = 60):
        self.interval = interval_seconds
        self.running = True

    async def run(self):
        while self.running:
            try:
                await self.sync_batch()
            except Exception as e:
                print(f"Error in Typesense sync: {e}")
            await asyncio.sleep(self.interval)

    async def sync_batch(self, batch_size: int = 100):
        async with AsyncSessionLocal() as db:
            # Получаем непроцессенные записи, сгруппированные по article_id с последней операцией
            # Используем подзапрос для получения последней записи для каждой статьи
            subq = (
                select(
                    SearchSyncQueue.article_id,
                    SearchSyncQueue.operation,
                    SearchSyncQueue.created_at
                )
                .order_by(SearchSyncQueue.created_at.desc())
                .distinct(SearchSyncQueue.article_id)
                .limit(batch_size)
                .subquery()
            )
            stmt = select(subq).order_by(subq.c.created_at)
            result = await db.execute(stmt)
            rows = result.fetchall()

            if not rows:
                return

            # Группируем по операции
            to_upsert = []
            to_delete = []
            for row in rows:
                if row.operation == 'delete':
                    to_delete.append(row.article_id)
                else:
                    to_upsert.append(row.article_id)

            # Получаем клиент Typesense
            client = typesense_client.get_client()

            # Обрабатываем удаления
            if to_delete:
                try:
                    await client.collections['articles'].documents.delete({
                        'filter_by': f'article_id: {[str(id) for id in to_delete]}'
                    })
                except Exception as e:
                    print(f"Typesense bulk delete error: {e}")

            # Обрабатываем upsert
            if to_upsert:
                documents = []
                for article_id in to_upsert:
                    # Получить полные данные статьи (последний коммит в main)
                    doc = await self._get_article_document(db, article_id)
                    if doc:
                        documents.append(doc)
                if documents:
                    try:
                        await client.collections['articles'].documents.import_(documents, {'action': 'upsert'})
                    except Exception as e:
                        print(f"Typesense bulk upsert error: {e}")

            # Удаляем обработанные записи из очереди (можно удалить все записи для этих article_id)
            if rows:
                article_ids = [r.article_id for r in rows]
                await db.execute(
                    delete(SearchSyncQueue).where(SearchSyncQueue.article_id.in_(article_ids))
                )
                await db.commit()

    async def _get_article_document(self, db: AsyncSession, article_id: UUID) -> dict | None:
        # Получаем статью и её содержимое
        from app.models.article import Article, Branch, ArticleFull
        from sqlalchemy import select, and_

        # Получить последний коммит в main ветке
        branch_stmt = select(Branch).where(
            and_(Branch.article_id == article_id, Branch.name == 'main')
        ).order_by(Branch.created_at.desc()).limit(1)
        branch = await db.execute(branch_stmt)
        branch = branch.scalar_one_or_none()
        if not branch:
            return None

        commit_id = branch.head_commit_id
        # Получить полный текст
        full_stmt = select(ArticleFull.text).where(
            and_(ArticleFull.article_id == article_id, ArticleFull.commit_id == commit_id)
        )
        content = await db.scalar(full_stmt)
        if not content:
            # Возможно, нет в ArticleFull, тогда нужно пересобрать через CommitService
            commit_service = CommitService(db)
            content = await commit_service.rebuild_content_at_commit(commit_id)
            if not content:
                return None

        # Получить статью
        article_stmt = select(Article).where(Article.id == article_id)
        article = await db.execute(article_stmt)
        article = article.scalar_one()

        # Определить язык
        sample = (article.title + " " + content)[:1000]
        from langdetect import detect
        try:
            lang = detect(sample)
            if lang in ('ru', 'uk', 'be'):
                language = 'ru'
            else:
                language = 'en'
        except:
            language = 'en'

        return {
            'id': str(article_id),
            'title': article.title,
            'content': content,
            'language': language,
            'created_at': int(article.created_at.timestamp()) if article.created_at else 0,
            'updated_at': int(article.updated_at.timestamp()) if article.updated_at else 0,
        }