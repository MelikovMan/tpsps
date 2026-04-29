import asyncio
from uuid import UUID, uuid4
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import func
from fastapi import HTTPException, UploadFile
import logging


from app.models.media import Media
from app.models.article import Article, Commit
from app.schemas.media import MediaResponse, MediaInfoResponse
from app.core.minio_client import minio_client
from app.core.config import settings

logger = logging.getLogger(__name__)


class MediaService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def upload_file(
        self,
        file: UploadFile,
        article_id: Optional[UUID] = None,
        commit_id: Optional[UUID] = None,
        bucket_name: str = "media-files"
    ) -> Media:
    # Проверка существования статьи и коммита, если они указаны
        article = None
        commit = None

        if article_id:
            article = await self.db.get(Article, article_id)
            if not article:
                raise HTTPException(status_code=404, detail="Article not found")

        if commit_id:
            commit = await self.db.get(Commit, commit_id)
            if not commit:
                raise HTTPException(status_code=404, detail="Commit not found")

    # Если передан только один из пары, можно либо требовать оба, либо нет.
    # Здесь оставлено как есть – привязываем только то, что передано.

    # Убедимся, что бакет существует и имеет публичную политику (без изменений)
        bucket_ready = await minio_client.ensure_bucket_exists(bucket_name)
        if not bucket_ready:
            raise HTTPException(status_code=500, detail=f"Failed to ensure bucket '{bucket_name}' exists")
        await minio_client.ensure_public_policy(bucket_name)

    # Генерация ключа и загрузка в MinIO (без изменений)
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
        object_key = f"uploads/{uuid4()}.{file_extension}"
        file_data = await file.read()
        file_size = len(file_data)
        content_type = file.content_type or "application/octet-stream"

        try:
            await asyncio.to_thread(
                minio_client.upload_file,
                bucket_name=bucket_name,
                object_name=object_key,
                file_data=file_data,
                file_size=file_size,
                content_type=content_type
            )
        except Exception as e:
            logger.error(f"MinIO upload failed: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to upload file to storage {e}")

        protocol = "https" if settings.MINIO_SECURE else "http"
        public_url = f"{protocol}://{settings.MINIO_ENDPOINT}/{bucket_name}/{object_key}"

        media = Media(
            original_filename=file.filename,
            storage_path=f"{bucket_name}/{object_key}",
            bucket_name=bucket_name,
            object_key=object_key,
            mime_type=content_type,
            file_size=file_size,
            public_url=public_url,
            uploaded_at=datetime.now(timezone.utc)
        )

    # Привязка к статье и/или коммиту, если они переданы
        if article:
            media.articles.append(article)
        if commit:
            media.commits.append(commit)

        self.db.add(media)
        await self.db.commit()
        await self.db.refresh(media)
        return media

    async def get_article_media(self, article_id: UUID) -> List[Media]:
        result = await self.db.execute(
            select(Media)
            .join(Media.articles)
            .where(Article.id == article_id)
        )
        return result.scalars().all()

    async def get_media_by_id(self, media_id: UUID) -> Optional[Media]:
        return await self.db.get(Media, media_id)

    async def get_all_media(
        self,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        type: Optional[str] = None
    ) -> List[Media]:
        # Базовый запрос без фильтрации search/type; при необходимости доработайте
        result = await self.db.execute(
            select(Media).offset(skip).limit(limit)
        )
        return list(result.scalars().all())
    

    async def get_all_media_with_count(
        self,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        type_filter: Optional[str] = None
    ) -> Tuple[List[Media], int]:
        # Базовый запрос – пока без фильтрации
        query = select(Media)
        # Здесь можно добавить фильтры search/type_filter, если потребуется
        
        # Получаем общее количество (до пагинации)
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Пагинация
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        media_list = list(result.scalars().all())
        
        return media_list, total

    async def get_file_info(self, media_id: UUID) -> MediaInfoResponse:
        media = await self.db.get(
            Media,
            media_id,
            options=[
                selectinload(Media.articles),
                selectinload(Media.commits)
            ]
        )

        if not media:
            raise HTTPException(status_code=404, detail="Media not found")

        return MediaInfoResponse(
            id=media.id,
            original_filename=media.original_filename,
            storage_path=media.storage_path,
            bucket_name=media.bucket_name,
            object_key=media.object_key,
            mime_type=media.mime_type,
            file_size=media.file_size,
            public_url=media.public_url,
            uploaded_at=media.uploaded_at,
            articles=[{"id": a.id, "title": a.title} for a in media.articles],
            commits=[{"id": c.id, "message": c.message} for c in media.commits],
            is_orphaned=not (media.articles or media.commits)
        )

    async def get_download_url(
        self,
        media_id: UUID,
        expires_in: int = 3600
    ) -> str:
        media = await self.get_media_by_id(media_id)
        if not media:
            raise HTTPException(status_code=404, detail="Media not found")

        # Генерация временной ссылки через синхронный клиент в потоке
        try:
            url = await asyncio.to_thread(
                minio_client.get_presigned_url,
                bucket_name=media.bucket_name,
                object_name=media.object_key,
                expires_in_seconds=expires_in
            )
            return url
        except Exception as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            raise HTTPException(
                status_code=500,
                detail="Failed to generate download URL"
            )

    async def delete_media(self, media_id: UUID) -> bool:
        media = await self.db.get(Media, media_id)
        if not media:
            return False

        # Удаление файла из MinIO
        try:
            await asyncio.to_thread(
                minio_client.delete_file,
                bucket_name=media.bucket_name,
                object_name=media.object_key
            )
        except Exception as e:
            logger.error(f"MinIO deletion failed: {e}")
            raise HTTPException(
                status_code=500,
                detail="Failed to delete file from storage"
            )

        await self.db.delete(media)
        await self.db.commit()
        return True

    async def cleanup_orphaned_files(
        self,
        dry_run: bool = True
    ) -> List[dict]:
        # Метод может быть реализован позже
        pass
    async def attach_to_article(self, media_id: UUID, article_id: UUID) -> Media:
        # Загружаем медиа с уже подгруженными статьями
        media = await self.db.get(
            Media,
            media_id,
            options=[selectinload(Media.articles)]
        )
        if not media:
            raise HTTPException(status_code=404, detail="Media not found")

        article = await self.db.get(Article, article_id)
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")

        if article in media.articles:
            raise HTTPException(status_code=409, detail="Media already attached to this article")

        media.articles.append(article)
        await self.db.commit()
        await self.db.refresh(media)
        return media

    async def attach_to_commit(self, media_id: UUID, commit_id: UUID) -> Media:
        # Загружаем медиа с уже подгруженными коммитами
        media = await self.db.get(
            Media,
            media_id,
            options=[selectinload(Media.commits)]
        )
        if not media:
            raise HTTPException(status_code=404, detail="Media not found")

        commit = await self.db.get(Commit, commit_id)
        if not commit:
            raise HTTPException(status_code=404, detail="Commit not found")

        if commit in media.commits:
            raise HTTPException(status_code=409, detail="Media already attached to this commit")

        media.commits.append(commit)
        await self.db.commit()
        await self.db.refresh(media)
        return media
    async def detach_from_article(self, media_id: UUID, article_id: UUID) -> Media:
        media = await self.db.get(Media, media_id, options=[selectinload(Media.articles)])
        if not media:
            raise HTTPException(status_code=404, detail="Media not found")
        article = await self.db.get(Article, article_id)
        if not article:
           raise HTTPException(status_code=404, detail="Article not found")
        if article not in media.articles:
           raise HTTPException(status_code=404, detail="Article not attached to this media")
        media.articles.remove(article)
        await self.db.commit()
        await self.db.refresh(media)
        return media