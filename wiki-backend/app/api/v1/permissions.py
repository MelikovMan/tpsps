# app/api/v1/permissions.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.schemas.permission import PermissionCreate, PermissionUpdate, PermissionResponse
from app.services.permission_service import PermissionService
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[PermissionResponse])
async def get_permissions(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all role permissions (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    permission_service = PermissionService(db)
    return await permission_service.get_all_permissions()

@router.post("/", response_model=PermissionResponse)
async def create_permission(
    permission: PermissionCreate,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new role permission (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    permission_service = PermissionService(db)
    return await permission_service.create_permission(permission)

@router.get("/{role}", response_model=PermissionResponse)
async def get_permission(
    role: str,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get permissions for a specific role"""
    if current_user.role != "admin" and current_user.role != role:
        raise HTTPException(status_code=403, detail="Access denied")
    
    permission_service = PermissionService(db)
    permission = await permission_service.get_permission(role)
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    return permission

@router.put("/{role}", response_model=PermissionResponse)
async def update_permission(
    role: str,
    permission: PermissionUpdate,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update role permissions (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    permission_service = PermissionService(db)
    updated_permission = await permission_service.update_permission(role, permission)
    if not updated_permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    return updated_permission

@router.delete("/{role}")
async def delete_permission(
    role: str,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a role permission (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    permission_service = PermissionService(db)
    success = await permission_service.delete_permission(role)
    if not success:
        raise HTTPException(status_code=404, detail="Permission not found")
    return {"message": "Permission deleted successfully"}
