from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from fastapi_cache.decorator import cache
from app.core.config import settings


from app.core.database import get_db
from app.schemas.media import (
    MediaFileType,
    MediaListResponse,
    MediaResponse,
    MediaUploadResponse,
    MediaInfoResponse
)
from app.services.media_service import MediaService
from app.core.security import get_current_user
from app.models.user import User
from app.services.media_filter_strategy import MediaFilterStrategy 

router = APIRouter()

@router.post("/upload", response_model=MediaUploadResponse)
async def upload_media_file(
    article_id: Optional[UUID] = Query(None),
    commit_id: Optional[UUID] = Query(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = MediaService(db)
    media = await service.upload_file(file, article_id, commit_id)
    return MediaUploadResponse(
        **media.__dict__,
        message="File uploaded successfully"
    )



@router.post("/{media_id}/attach")
async def attach_media_to_article(
    media_id: UUID,
    article_id: UUID = Query(...),
    commit_id: Optional[UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Attach existing media to an article and optionally a commit"""
    service = MediaService(db)
    media = await service.attach_media_to_article(media_id, article_id, commit_id)
    return {
        "message": "Media attached successfully",
        "media_id": media.id,
        "article_id": article_id,
        "commit_id": commit_id
    }

@router.post("/{media_id}/detach")
async def detach_media_from_article(
    media_id: UUID,
    article_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Detach media from an article"""
    service = MediaService(db)
    media = await service.detach_media_from_article(media_id, article_id)
    return {
        "message": "Media detached successfully",
        "media_id": media.id,
        "article_id": article_id
    }

@router.get("/", response_model=List[MediaListResponse])
@cache(expire=settings.cache_expire)
async def get_media_files(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
        type: MediaFileType = Query(MediaFileType.ALL, description=f"Filter by file type. Available types: {MediaFilterStrategy.get_available_types()}"),
    db: AsyncSession = Depends(get_db),

):
    service = MediaService(db)
    media_files = await service.get_all_media(skip, limit, search, type)
    total_count = await service.get_media_count(search, type)
    
    return MediaListResponse(
        data=media_files,
        total=total_count
    )
@router.get("/article/{article_id}", response_model=List[MediaResponse])
async def get_article_media(
    article_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    service = MediaService(db)
    media_files = await service.get_article_media(article_id)
    return media_files

@router.get("/{media_id}", response_model=MediaResponse)
async def get_media_by_id(
    media_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    service = MediaService(db)
    media = await service.get_media_by_id(media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    return media

@router.get("/{media_id}/download")
async def download_media_file(
    media_id: UUID,
    expires_in: int = Query(3600, ge=300, le=86400),
    db: AsyncSession = Depends(get_db)
):
    service = MediaService(db)
    download_url = await service.get_download_url(media_id, expires_in)
    return RedirectResponse(url=download_url)

@router.get("/{media_id}/url")
async def get_media_download_url(
    media_id: UUID,
    expires_in: int = Query(3600, ge=300, le=86400),
    db: AsyncSession = Depends(get_db)
):
    service = MediaService(db)
    download_url = await service.get_download_url(media_id, expires_in)
    return {"download_url": download_url, "expires_in": expires_in}

@router.get("/{media_id}/info", response_model=MediaInfoResponse)
async def get_media_info(
    media_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    service = MediaService(db)
    return await service.get_file_info(media_id)

@router.delete("/{media_id}")
async def delete_media_file(
    media_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = MediaService(db)
    success = await service.delete_media(media_id)
    if success:
        return {"message": "Media file deleted successfully"}
    raise HTTPException(status_code=404, detail="Media not found")