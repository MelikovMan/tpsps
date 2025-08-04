from uuid import UUID, uuid4
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, UploadFile

from app.models.media import Media
from app.models.article import Article, Commit
from app.schemas.media import MediaResponse, MediaInfoResponse

class MediaService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def upload_file(
        self, 
        file: UploadFile, 
        article_id: UUID, 
        commit_id: UUID,
        bucket_name: str = "media-files"
    ) -> Media:
        # Проверка существования статьи и коммита
        article = await self.db.get(Article, article_id)
        commit = await self.db.get(Commit, commit_id)
        
        if not article or not commit:
            raise HTTPException(
                status_code=404, 
                detail="Article or Commit not found"
            )

        # Генерация уникального ключа
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
        object_key = f"uploads/{uuid4()}.{file_extension}"
        
        # Заглушка для загрузки в MinIO
        # Реальная реализация:
        # await storage_service.upload_file(file, bucket_name, object_key)
        
        # Создание объекта Media
        media = Media(
            original_filename=file.filename,
            storage_path=f"{bucket_name}/{object_key}",
            bucket_name=bucket_name,
            object_key=object_key,
            mime_type=file.content_type,
            file_size=0,  # Заменить на реальный размер после загрузки
            public_url=f"http://minio:9000/{bucket_name}/{object_key}",
            uploaded_at=datetime.now(timezone.utc)
        )
        
        # Привязка к статье и коммиту
        media.articles.append(article)
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
        limit: int = 100
    ) -> List[Media]:
        result = await self.db.execute(
            select(Media)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

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
        # Заглушка для генерации URL в MinIO
        # Реальная реализация:
        # return storage_service.get_presigned_url(
        #   media.bucket_name, 
        #   media.object_key,
        #   expires_in=expires_in
        # )
        media = await self.get_media_by_id(media_id)
        if not media:
            raise HTTPException(status_code=404, detail="Media not found")
        return f"{media.public_url}?token=temp_{expires_in}"

    async def delete_media(self, media_id: UUID) -> bool:
        media = await self.db.get(Media, media_id)
        if not media:
            return False
        
        # Заглушка для удаления из MinIO
        # Реальная реализация:
        # await storage_service.delete_file(
        #   media.bucket_name, 
        #   media.object_key
        # )
        
        await self.db.delete(media)
        await self.db.commit()
        return True

    async def cleanup_orphaned_files(
        self, 
        dry_run: bool = True
    ) -> List[dict]:
        # Реализация очистки orphaned-файлов
        # (аналогично синхронной версии, но с асинхронными вызовами)
        pass