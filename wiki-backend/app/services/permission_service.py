# app/services/permission_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.models.permission import Permission
from app.schemas.permission import PermissionCreate, PermissionUpdate


class PermissionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_permissions(self) -> List[Permission]:
        """Get all role permissions"""
        query = select(Permission)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def create_permission(self, permission_data: PermissionCreate) -> Permission:
        """Create a new role permission"""
        permission = Permission(
            role=permission_data.role,
            can_create=permission_data.can_create,
            can_edit=permission_data.can_edit,
            can_delete=permission_data.can_delete,
            can_moderate=permission_data.can_moderate,
            can_admin=permission_data.can_admin
        )
        
        self.db.add(permission)
        await self.db.commit()
        await self.db.refresh(permission)
        return permission

    async def get_permission(self, role: str) -> Optional[Permission]:
        """Get permissions for a specific role"""
        query = select(Permission).where(Permission.role == role)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def update_permission(self, role: str, permission_data: PermissionUpdate) -> Optional[Permission]:
        """Update role permissions"""
        query = select(Permission).where(Permission.role == role)
        result = await self.db.execute(query)
        permission = result.scalar_one_or_none()
        
        if not permission:
            return None
        
        update_data = permission_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(permission, field, value)
        
        await self.db.commit()
        await self.db.refresh(permission)
        return permission

    async def delete_permission(self, role: str) -> bool:
        """Delete a role permission"""
        query = select(Permission).where(Permission.role == role)
        result = await self.db.execute(query)
        permission = result.scalar_one_or_none()
        
        if not permission:
            return False
        
        await self.db.delete(permission)
        await self.db.commit()
        return True

