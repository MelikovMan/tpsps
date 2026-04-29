# app/api/v1/media.py (обновлённый фрагмент)

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.schemas.media import (
    MediaListResponse,
    MediaResponse,
    MediaUploadResponse,
    MediaInfoResponse
)
from app.services.media_service import MediaService
from app.core.security import get_current_user
from app.models.user import User

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

@router.get("/", response_model=MediaListResponse)
async def get_media_files(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    service = MediaService(db)
    media_list, total = await service.get_all_media_with_count(
        skip=skip,
        limit=limit,
        search=search,
        type_filter=type
    )
    return MediaListResponse(data=media_list, total=total)

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

# ---------- Новые маршруты для attach / detach ----------
@router.post("/{media_id}/attach/article/{article_id}", response_model=MediaResponse)
async def attach_media_to_article(
    media_id: UUID,
    article_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = MediaService(db)
    media = await service.attach_to_article(media_id, article_id)
    return media

@router.post("/{media_id}/attach/commit/{commit_id}", response_model=MediaResponse)
async def attach_media_to_commit(
    media_id: UUID,
    commit_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = MediaService(db)
    media = await service.attach_to_commit(media_id, commit_id)
    return media

@router.delete("/{media_id}/detach/article/{article_id}", response_model=MediaResponse)
async def detach_media_from_article(
    media_id: UUID,
    article_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = MediaService(db)
    media = await service.detach_from_article(media_id, article_id)
    return media