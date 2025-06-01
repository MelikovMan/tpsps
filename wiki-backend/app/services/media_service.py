# app/services/media_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from fastapi import UploadFile, HTTPException
from typing import List, Optional
from uuid import UUID, uuid4
import os
import mimetypes
from datetime import datetime

from app.models.media import Media
from app.schemas.media import MediaCreate, MediaResponse, MediaUploadResponse
from app.core.minio_client import minio_client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class MediaService:
    def __init__(self, db: AsyncSession):
        self.db = db
        
    async def upload_file(
        self, 
        file: UploadFile, 
        article_id: UUID, 
        commit_id: UUID
    ) -> MediaUploadResponse:
        """Загружает файл в MinIO и сохраняет информацию в БД"""
        
        # Проверяем размер файла
        file_content = await file.read()
        file_size = len(file_content)
        
        if file_size > settings.max_file_size:
            raise HTTPException(
                status_code=413, 
                detail=f"File too large. Maximum size: {settings.max_file_size} bytes"
            )
        
        # Определяем MIME тип
        mime_type = file.content_type or mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
        
        # Генерируем уникальное имя файла
        file_extension = os.path.splitext(file.filename)[1]
        object_key = f"{article_id}/{commit_id}/{uuid4()}{file_extension}"
        bucket_name = settings.MINIO_DEFAULT_BUCKET
        
        try:
            # Убеждаемся что bucket существует
            await minio_client.ensure_bucket_exists(bucket_name)
            
            # Загружаем файл в MinIO
            await file.seek(0)  # Сбрасываем позицию
            minio_client.upload_file(
                bucket_name=bucket_name,
                object_name=object_key,
                file_data=file_content,
                file_size=file_size,
                content_type=mime_type
            )
            
            # Создаем запись в БД
            media_data = MediaCreate(
                article_id=article_id,
                commit_id=commit_id,
                original_filename=file.filename,
                storage_path=f"{bucket_name}/{object_key}",
                bucket_name=bucket_name,
                object_key=object_key,
                mime_type=mime_type,
                file_size=file_size
            )
            
            media = await self.create_media_record(media_data)
            
            # Получаем временную ссылку для скачивания
            download_url = minio_client.get_presigned_url(bucket_name, object_key)
            
            return MediaUploadResponse(
                media=MediaResponse.model_validate(media),
                download_url=download_url
            )
            
        except Exception as e:
            logger.error(f"Error uploading file: {e}")
            # Если произошла ошибка, пытаемся удалить файл из MinIO
            minio_client.delete_file(bucket_name, object_key)
            raise HTTPException(status_code=500, detail="Failed to upload file")
    
    async def create_media_record(self, media_data: MediaCreate) -> Media:
        """Создает запись о медиафайле в БД"""
        media = Media(**media_data.model_dump())
        self.db.add(media)
        await self.db.commit()
        await self.db.refresh(media)
        return media
    
    async def get_media_by_id(self, media_id: UUID) -> Optional[Media]:
        """Получает медиафайл по ID"""
        result = await self.db.execute(
            select(Media).where(Media.id == media_id)
        )
        return result.scalar_one_or_none()
    
    async def get_article_media(self, article_id: UUID) -> List[Media]:
        """Получает все медиафайлы статьи"""
        result = await self.db.execute(
            select(Media).where(Media.article_id == article_id)
        )
        return result.scalars().all()
    
    async def get_all_media(self, skip: int = 0, limit: int = 100) -> List[Media]:
        """Получает все медиафайлы с пагинацией"""
        result = await self.db.execute(
            select(Media).offset(skip).limit(limit)
        )
        return result.scalars().all()
    
    async def get_download_url(self, media_id: UUID, expires_in: int = 3600) -> str:
        """Получает временную ссылку для скачивания файла"""
        media = await self.get_media_by_id(media_id)
        if not media:
            raise HTTPException(status_code=404, detail="Media not found")
        
        try:
            url = minio_client.get_presigned_url(
                media.bucket_name, 
                media.object_key, 
                expires_in
            )
            return url
        except Exception as e:
            logger.error(f"Error generating download URL: {e}")
            raise HTTPException(status_code=500, detail="Failed to generate download URL")
    
    async def delete_media(self, media_id: UUID) -> bool:
        """Удаляет медиафайл из MinIO и БД"""
        media = await self.get_media_by_id(media_id)
        if not media:
            raise HTTPException(status_code=404, detail="Media not found")
        
        try:
            # Удаляем файл из MinIO
            success = minio_client.delete_file(media.bucket_name, media.object_key)
            
            if success:
                # Удаляем запись из БД
                await self.db.execute(
                    delete(Media).where(Media.id == media_id)
                )
                await self.db.commit()
                return True
            else:
                raise HTTPException(status_code=500, detail="Failed to delete file from storage")
                
        except Exception as e:
            logger.error(f"Error deleting media: {e}")
            raise HTTPException(status_code=500, detail="Failed to delete media")
    
    async def get_file_info(self, media_id: UUID) -> dict:
        """Получает информацию о файле"""
        media = await self.get_media_by_id(media_id)
        if not media:
            raise HTTPException(status_code=404, detail="Media not found")
        
        # Проверяем существование файла в MinIO
        exists = minio_client.file_exists(media.bucket_name, media.object_key)
        
        return {
            "id": media.id,
            "filename": media.original_filename,
            "mime_type": media.mime_type,
            "file_size": media.file_size,
            "uploaded_at": media.uploaded_at,
            "exists_in_storage": exists,
            "storage_path": media.storage_path
        }