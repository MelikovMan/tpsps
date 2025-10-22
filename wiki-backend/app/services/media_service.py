from uuid import UUID, uuid4
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, UploadFile

from app.models.media import Media
from app.models.article import Article, Commit
from app.schemas.media import MediaFileType, MediaResponse, MediaInfoResponse
from app.core.yandex_storage import yandex_storage  # Changed from minio_client
from app.core.config import settings
from app.services.media_filter_strategy import MediaFilterStrategy

class MediaService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def upload_file(
        self, 
        file: UploadFile, 
        article_id: Optional[UUID] = None,
        commit_id: Optional[UUID] = None,
        bucket_name: str|None = None
    ) -> Media:
        # Use default bucket if not specified
        if bucket_name is None:
            bucket_name = settings.YANDEX_STORAGE_BUCKET
            
        article = None
        commit = None
        # Check if article and commit exist
        if article_id:
            article = await self.db.get(Article, article_id)
            if not article:
                raise HTTPException(status_code=404, detail="Article not found")
        if commit_id:
            commit = await self.db.get(Commit, commit_id)
            if not commit:
                raise HTTPException(status_code=404, detail="Commit not found")
        
        # Generate unique object key
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
        object_key = f"uploads/{uuid4()}.{file_extension}"
        
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Upload to Yandex Object Storage
        try:
            yandex_storage.upload_file(
                bucket_name=bucket_name,
                object_name=object_key,
                file_data=file_content,
                content_type=file.content_type or "application/octet-stream"
            )
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to upload file to storage: {str(e)}"
            )
        
        # Create Media object with Yandex Storage URL
        media = Media(
            original_filename=file.filename,
            storage_path=f"{bucket_name}/{object_key}",
            bucket_name=bucket_name,
            object_key=object_key,
            mime_type=file.content_type or "application/octet-stream",
            file_size=file_size,
            # Use Yandex Storage public URL format
            public_url=yandex_storage.get_public_url(bucket_name, object_key),
            uploaded_at=datetime.now(timezone.utc)
        )
        
        # Link to article and commit
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


    async def attach_media_to_article(
        self,
        media_id: UUID,
        article_id: UUID,
        commit_id: Optional[UUID] = None
    ) -> Media:
        """Attach existing media to an article and optionally a commit"""
        media = await self.db.get(
            Media, 
            media_id,
            options=[selectinload(Media.articles), selectinload(Media.commits)]
        )
        if not media:
            raise HTTPException(status_code=404, detail="Media not found")
            
        article = await self.db.get(Article, article_id)
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")
            
        commit = None
        if commit_id:
            commit = await self.db.get(Commit, commit_id)
            if not commit:
                raise HTTPException(status_code=404, detail="Commit not found")
        
        # Attach to article
        if article not in media.articles:
            media.articles.append(article)
            
        # Attach to commit if provided
        if commit and commit not in media.commits:
            media.commits.append(commit)
            
        # Update orphaned status
        media.is_orphaned = not (media.articles or media.commits)
        
        await self.db.commit()
        await self.db.refresh(media)
        return media
    
    async def detach_media_from_article(
        self,
        media_id: UUID,
        article_id: UUID
    ) -> Media:
        """Detach media from an article"""
        media = await self.db.get(
            Media, 
            media_id,
            options=[selectinload(Media.articles), selectinload(Media.commits)]
        )
        if not media:
            raise HTTPException(status_code=404, detail="Media not found")
            
        article = await self.db.get(Article, article_id)
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")
        
        # Remove from article
        if article in media.articles:
            media.articles.remove(article)
            
        # Update orphaned status
        media.is_orphaned = not (media.articles or media.commits)
        
        await self.db.commit()
        await self.db.refresh(media)
        return media
    

    async def get_media_by_id(self, media_id: UUID) -> Optional[Media]:
        return await self.db.get(Media, media_id)

    async def get_all_media(
        self, 
        skip: int = 0, 
        limit: int = 100,
        search: Optional[str] = None,
        file_type: Optional[MediaFileType] = None
    ) -> List[Media]:
        query = select(Media)
        if search:
            query = query.where(Media.original_filename.ilike(f"%{search}%"))
    
    # Apply type filter if provided and not 'all'
        if file_type and file_type != MediaFileType.ALL:
            type_filter = MediaFilterStrategy.get_filter_condition(file_type)
            if type_filter:
                query = query.where(type_filter)
    
        query = query.offset(skip).limit(limit).order_by(Media.uploaded_at.desc())
    
        result = await self.db.execute(query)
        return result.scalars().all()


    async def get_media_count(
        self, 
        search: Optional[str] = None,
        file_type: Optional[MediaFileType] = None
    ) -> int:
        query = select(func.count(Media.id))
    
        if search:
            query = query.where(Media.original_filename.ilike(f"%{search}%"))
    
        if file_type and file_type != MediaFileType.ALL:
            type_filter = MediaFilterStrategy.get_filter_condition(file_type)
            if type_filter:
                query = query.where(type_filter)
    
        result = await self.db.execute(query)
        return result.scalar()
    
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
        """Get presigned download URL from Yandex Storage"""
        media = await self.get_media_by_id(media_id)
        if not media:
            raise HTTPException(status_code=404, detail="Media not found")
        
        try:
            return yandex_storage.get_presigned_url(
                media.bucket_name, 
                media.object_key,
                expires_in_seconds=expires_in
            )
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to generate download URL: {str(e)}"
            )


    async def delete_media(self, media_id: UUID) -> bool:
        media = await self.db.get(Media, media_id)
        if not media:
            return False
        
        # Delete from Yandex Storage
        try:
            yandex_storage.delete_file(media.bucket_name, media.object_key)
        except Exception as e:
            # Log error but continue with database deletion
            logger.error(f"Failed to delete file from storage: {e}")
        
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