# app/api/v1/endpoints/branch_tags.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.services.branch_tag_service import BranchTagService
from app.schemas.branch_tag import (
    BranchTagCreate, BranchTagResponse, 
    BranchTagPermissionCreate, BranchTagPermissionResponse,
    BranchAccessCreate, BranchAccessResponse,
    BranchWithAccessInfo, BranchAccessCheck
)

router = APIRouter()

# ============ BRANCH TAGS ENDPOINTS ============

@router.post("/branches/{branch_id}/tags", response_model=BranchTagResponse)
async def create_branch_tag(
    branch_id: UUID,
    tag_data: BranchTagCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Создать тег для ветки"""
    tag_data.branch_id = branch_id
    service = BranchTagService(db)
    
    try:
        tag = await service.create_branch_tag(tag_data, current_user.id)
        return tag
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/branches/{branch_id}/tags", response_model=List[BranchTagResponse])
async def get_branch_tags(
    branch_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Получить все теги ветки"""
    service = BranchTagService(db)
    
    # Проверяем доступ к ветке
    access_check = await service.check_branch_access(current_user.id, branch_id)
    if not access_check.has_access:
        raise HTTPException(status_code=403, detail="Access denied to this branch")
    
    try:
        tags = await service.get_branch_tags(branch_id)
        return tags
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/branches/{branch_id}/tags/{tag}")
async def delete_branch_tag(
    branch_id: UUID,
    tag: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Удалить тег ветки"""
    service = BranchTagService(db)
    
    try:
        deleted = await service.delete_branch_tag(branch_id, tag, current_user.id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Tag not found")
        return {"message": "Tag deleted successfully"}
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


# ============ TAG PERMISSIONS ENDPOINTS ============

@router.post("/tags/{tag}/permissions", response_model=BranchTagPermissionResponse)
async def create_tag_permission(
    tag: str,
    permission_data: BranchTagPermissionCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Создать разрешение для тега (только для администраторов)"""
    # Проверяем права администратора
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin rights required")
    
    permission_data.tag = tag
    service = BranchTagService(db)
    
    try:
        permission = await service.create_tag_permission(permission_data)
        return permission
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/tags/{tag}/permissions", response_model=List[BranchTagPermissionResponse])
async def get_tag_permissions(
    tag: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Получить разрешения для тега"""
    # Проверяем права администратора или модератора
    if current_user.role not in ["admin", "super_admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    service = BranchTagService(db)
    
    try:
        permissions = await service.get_tag_permissions(tag)
        return permissions
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============ BRANCH ACCESS ENDPOINTS ============

@router.post("/branches/{branch_id}/access", response_model=BranchAccessResponse)
async def grant_branch_access(
    branch_id: UUID,
    access_data: BranchAccessCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Предоставить доступ пользователю к ветке"""
    access_data.branch_id = branch_id
    service = BranchTagService(db)
    
    try:
        access = await service.grant_branch_access(access_data, current_user.id)
        return access
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.delete("/branches/{branch_id}/access/{user_id}")
async def revoke_branch_access(
    branch_id: UUID,
    user_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Отозвать доступ пользователя к ветке"""
    service = BranchTagService(db)
    
    try:
        revoked = await service.revoke_branch_access(branch_id, user_id, current_user.id)
        if not revoked:
            raise HTTPException(status_code=404, detail="Access record not found")
        return {"message": "Access revoked successfully"}
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/branches/{branch_id}/access", response_model=BranchAccessCheck)
async def check_branch_access(
    branch_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Проверить доступ текущего пользователя к ветке"""
    service = BranchTagService(db)
    
    try:
        access_check = await service.check_branch_access(current_user.id, branch_id)
        return access_check
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/branches/{branch_id}/access/{user_id}", response_model=BranchAccessCheck)
async def check_user_branch_access(
    branch_id: UUID,
    user_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Проверить доступ определенного пользователя к ветке (для администраторов)"""
    # Проверяем права на просмотр доступа других пользователей
    if current_user.role not in ["admin", "super_admin"]:
        # Проверяем, является ли текущий пользователь владельцем ветки
        service = BranchTagService(db)
        owner_check = await service.check_branch_access(current_user.id, branch_id)
        if owner_check.access_level != "owner":
            raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    service = BranchTagService(db)
    
    try:
        access_check = await service.check_branch_access(user_id, branch_id)
        return access_check
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============ USER ACCESSIBLE BRANCHES ============

@router.get("/articles/{article_id}/branches/accessible", response_model=List[BranchWithAccessInfo])
async def get_user_accessible_branches(
    article_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Получить все ветки статьи, доступные текущему пользователю"""
    service = BranchTagService(db)
    
    try:
        accessible_branches = await service.get_user_accessible_branches(current_user.id, article_id)
        return accessible_branches
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/users/{user_id}/articles/{article_id}/branches/accessible", response_model=List[BranchWithAccessInfo])
async def get_specific_user_accessible_branches(
    user_id: UUID,
    article_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Получить все ветки статьи, доступные определенному пользователю (для администраторов)"""
    # Проверяем права администратора
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin rights required")
    
    service = BranchTagService(db)
    
    try:
        accessible_branches = await service.get_user_accessible_branches(user_id, article_id)
        return accessible_branches
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============ BULK OPERATIONS ============

@router.post("/branches/{branch_id}/tags/bulk")
async def create_multiple_branch_tags(
    branch_id: UUID,
    tags: List[str],
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Создать несколько тегов для ветки одновременно"""
    service = BranchTagService(db)
    created_tags = []
    errors = []
    
    for tag_name in tags:
        try:
            tag_data = BranchTagCreate(branch_id=branch_id, tag=tag_name)
            tag = await service.create_branch_tag(tag_data, current_user.id)
            created_tags.append(tag)
        except (ValueError, PermissionError) as e:
            errors.append({"tag": tag_name, "error": str(e)})
    
    if errors and not created_tags:
        # Если все теги не удалось создать
        raise HTTPException(status_code=400, detail={"errors": errors})
    
    return {
        "created_tags": created_tags,
        "errors": errors,
        "success_count": len(created_tags),
        "error_count": len(errors)
    }


@router.delete("/branches/{branch_id}/tags/bulk")
async def delete_multiple_branch_tags(
    branch_id: UUID,
    tags: List[str],
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Удалить несколько тегов ветки одновременно"""
    service = BranchTagService(db)
    deleted_tags = []
    errors = []
    
    for tag_name in tags:
        try:
            deleted = await service.delete_branch_tag(branch_id, tag_name, current_user.id)
            if deleted:
                deleted_tags.append(tag_name)
            else:
                errors.append({"tag": tag_name, "error": "Tag not found"})
        except PermissionError as e:
            errors.append({"tag": tag_name, "error": str(e)})
    
    return {
        "deleted_tags": deleted_tags,
        "errors": errors,
        "success_count": len(deleted_tags),
        "error_count": len(errors)
    }