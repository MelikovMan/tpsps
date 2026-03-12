from uuid import UUID
from app.core.typesense_client import typesense_client
from app.models.article import Article, ArticleFull, Commit, Branch
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime

class TypesenseIndexer:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def index_article(self, article_id: UUID):
        """Индексирует последнюю версию статьи (голову main ветки)."""
        # Находим последний коммит в main ветке
        branch_query = select(Branch).where(
            and_(Branch.article_id == article_id, Branch.name == 'main')
        ).order_by(Branch.created_at.desc())
        branch_result = await self.db.execute(branch_query)
        branch = branch_result.scalar_one_or_none()
        if not branch:
            return

        commit_id = branch.head_commit_id
        # Получаем полный текст
        full_query = select(ArticleFull.text).where(
            and_(ArticleFull.article_id == article_id, ArticleFull.commit_id == commit_id)
        )
        full_result = await self.db.execute(full_query)
        content = full_result.scalar_one_or_none()
        if not content:
            # Если нет в ArticleFull, пересобрать через CommitService
            from app.services.commit_service import CommitService
            commit_service = CommitService(self.db)
            content = await commit_service.rebuild_content_at_commit(commit_id)
            if not content:
                return

        # Получаем статью
        article_query = select(Article).where(Article.id == article_id)
        article_result = await self.db.execute(article_query)
        article = article_result.scalar_one()

        # Определяем язык статьи (можно брать из поля article.language или определять по контенту)
        # Для простоты будем считать, что статья имеет поле language (ru/en). Если нет, можно определять автоматически.
        language = getattr(article, 'language', 'ru')  # предположим, есть поле language

        # Подготавливаем документ
        document = {
            'id': str(article_id),
            'title': article.title,
            'content': content,
            'language': language,
            'created_at': int(article.created_at.timestamp()),
            'updated_at': int(article.updated_at.timestamp()),
        }

        # Индексируем (upsert)
        typesense_client.collections['articles'].documents.upsert(document)

    async def remove_article(self, article_id: UUID):
        """Удаляет документ из индекса (при удалении статьи)."""
        try:
            typesense_client.collections['articles'].documents[str(article_id)].delete()
        except typesense.exceptions.ObjectNotFound:
            pass