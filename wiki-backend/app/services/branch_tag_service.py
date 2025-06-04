# app/services/branch_tag_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_, or_
from sqlalchemy.orm import selectinload, joinedload
from typing import List, Optional, Dict, Any
from uuid import UUID

from app.models.branch_tag import BranchTag, BranchTagPermission, BranchAccess
from app.models.article import Branch
from app.models.user import User
from app.models.permission import Permission
from app.schemas.branch_tag import (
    BranchTagCreate, BranchTagPermissionCreate, BranchAccessCreate,
    BranchWithAccessInfo, BranchAccessCheck
)


class BranchTagService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_branch_tag(self, tag_data: BranchTagCreate, user_id: UUID) -> BranchTag:
        """Создать тег для ветки"""
        # Проверяем существование ветки и права доступа
        branch_query = select(Branch).where(Branch.id == tag_data.branch_id)
        branch_result = await self.db.execute(branch_query)
        branch = branch_result.scalar_one_or_none()
        
        if not branch:
            raise ValueError("Branch not found")

        # Проверяем права на добавление тегов
        can_tag = await self._can_user_tag_branch(user_id, tag_data.branch_id)
        if not can_tag:
            raise PermissionError("Insufficient permissions to tag this branch")

        # Проверяем, не существует ли уже такой тег
        existing_tag_query = select(BranchTag).where(
            and_(
                BranchTag.branch_id == tag_data.branch_id,
                BranchTag.tag == tag_data.tag
            )
        )
        existing_result = await self.db.execute(existing_tag_query)
        existing_tag = existing_result.scalar_one_or_none()
        
        if existing_tag:
            return existing_tag

        # Создаем новый тег
        branch_tag = BranchTag(
            branch_id=tag_data.branch_id,
            tag=tag_data.tag,
            created_by=user_id
        )
        
        self.db.add(branch_tag)
        await self.db.commit()
        await self.db.refresh(branch_tag)
        return branch_tag

    async def get_branch_tags(self, branch_id: UUID) -> List[BranchTag]:
        """Получить все теги ветки"""
        query = select(BranchTag).where(BranchTag.branch_id == branch_id)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def delete_branch_tag(self, branch_id: UUID, tag: str, user_id: UUID) -> bool:
        """Удалить тег ветки"""
        # Находим тег
        tag_query = select(BranchTag).where(
            and_(
                BranchTag.branch_id == branch_id,
                BranchTag.tag == tag
            )
        )
        tag_result = await self.db.execute(tag_query)
        branch_tag = tag_result.scalar_one_or_none()
        
        if not branch_tag:
            return False

        # Проверяем права (создатель или админ)
        if branch_tag.created_by != user_id:
            can_delete = await self._can_user_delete_branch_tag(user_id, branch_id, tag)
            if not can_delete:
                raise PermissionError("Insufficient permissions to delete this tag")

        await self.db.delete(branch_tag)
        await self.db.commit()
        return True

    async def create_tag_permission(self, permission_data: BranchTagPermissionCreate) -> BranchTagPermission:
        """Создать разрешение для тега"""
        permission = BranchTagPermission(
            tag=permission_data.tag,
            role=permission_data.role,
            can_read=permission_data.can_read,
            can_write=permission_data.can_write,
            can_merge=permission_data.can_merge,
            can_delete_branch=permission_data.can_delete_branch
        )
        
        self.db.add(permission)
        await self.db.commit()
        await self.db.refresh(permission)
        return permission

    async def get_tag_permissions(self, tag: str) -> List[BranchTagPermission]:
        """Получить разрешения для тега"""
        query = select(BranchTagPermission).where(BranchTagPermission.tag == tag)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def grant_branch_access(self, access_data: BranchAccessCreate, granted_by: UUID) -> BranchAccess:
        """Предоставить доступ пользователю к ветке"""
        # Проверяем, что грантер имеет права на предоставление доступа
        can_grant = await self._can_user_grant_access(granted_by, access_data.branch_id)
        if not can_grant:
            raise PermissionError("Insufficient permissions to grant access")

        # Проверяем существующий доступ
        existing_query = select(BranchAccess).where(
            and_(
                BranchAccess.branch_id == access_data.branch_id,
                BranchAccess.user_id == access_data.user_id
            )
        )
        existing_result = await self.db.execute(existing_query)
        existing_access = existing_result.scalar_one_or_none()

        if existing_access:
            # Обновляем существующий доступ
            existing_access.access_level = access_data.access_level
            existing_access.granted_by = granted_by
            await self.db.commit()
            return existing_access

        # Создаем новый доступ
        branch_access = BranchAccess(
            branch_id=access_data.branch_id,
            user_id=access_data.user_id,
            access_level=access_data.access_level,
            granted_by=granted_by
        )
        
        self.db.add(branch_access)
        await self.db.commit()
        await self.db.refresh(branch_access)
        return branch_access

    async def revoke_branch_access(self, branch_id: UUID, user_id: UUID, revoked_by: UUID) -> bool:
        """Отозвать доступ пользователя к ветке"""
        can_revoke = await self._can_user_grant_access(revoked_by, branch_id)
        if not can_revoke:
            raise PermissionError("Insufficient permissions to revoke access")

        access_query = select(BranchAccess).where(
            and_(
                BranchAccess.branch_id == branch_id,
                BranchAccess.user_id == user_id
            )
        )
        access_result = await self.db.execute(access_query)
        branch_access = access_result.scalar_one_or_none()

        if not branch_access:
            return False

        await self.db.delete(branch_access)
        await self.db.commit()
        return True

    async def check_branch_access(self, user_id: UUID, branch_id: UUID) -> BranchAccessCheck:
        """Проверить доступ пользователя к ветке"""
        # Получаем информацию о ветке
        branch_query = select(Branch).options(
            selectinload(Branch.tags).selectinload(BranchTag.permissions)
        ).where(Branch.id == branch_id)
        branch_result = await self.db.execute(branch_query)
        branch = branch_result.scalar_one_or_none()

        if not branch:
            return BranchAccessCheck(
                has_access=False,
                access_level="none",
                permissions={},
                reason="Branch not found"
            )

        # Проверяем прямой доступ к ветке
        access_query = select(BranchAccess).where(
            and_(
                BranchAccess.branch_id == branch_id,
                BranchAccess.user_id == user_id
            )
        )
        access_result = await self.db.execute(access_query)
        direct_access = access_result.scalar_one_or_none()

        # Получаем роль пользователя
        user_query = select(User).where(User.id == user_id)
        user_result = await self.db.execute(user_query)
        user = user_result.scalar_one_or_none()

        if not user:
            return BranchAccessCheck(
                has_access=False,
                access_level="none",
                permissions={},
                reason="User not found"
            )

        # Проверяем права через теги
        tag_permissions = await self._get_user_tag_permissions(user.role, branch.tags)
        
        # Определяем финальный уровень доступа
        access_level = "none"
        permissions = {
            "can_read": False,
            "can_write": False,
            "can_merge": False,
            "can_delete": False
        }

        # Приоритет: прямой доступ > права по тегам > публичный доступ
        if direct_access:
            access_level = direct_access.access_level
            permissions = self._get_permissions_for_level(access_level)
        elif tag_permissions:
            # Берем максимальные права из всех тегов
            for perm in tag_permissions:
                if perm.can_read:
                    permissions["can_read"] = True
                if perm.can_write:
                    permissions["can_write"] = True
                if perm.can_merge:
                    permissions["can_merge"] = True
                if perm.can_delete_branch:
                    permissions["can_delete"] = True
            
            if any(permissions.values()):
                access_level = "tag-based"
        elif not branch.is_private:
            # Публичная ветка - базовые права на чтение
            access_level = "public"
            permissions["can_read"] = True

        # Создатель ветки всегда имеет полные права
        if branch.created_by == user_id:
            access_level = "owner"
            permissions = {
                "can_read": True,
                "can_write": True,
                "can_merge": True,
                "can_delete": True
            }

        has_access = access_level != "none"
        
        return BranchAccessCheck(
            has_access=has_access,
            access_level=access_level,
            permissions=permissions,
            reason=None if has_access else "No access permissions"
        )

    async def get_user_accessible_branches(self, user_id: UUID, article_id: UUID) -> List[BranchWithAccessInfo]:
        """Получить все ветки статьи, доступные пользователю"""
        # Получаем все ветки статьи с тегами
        branches_query = select(Branch).options(
            selectinload(Branch.tags)
        ).where(Branch.article_id == article_id)
        branches_result = await self.db.execute(branches_query)
        all_branches = list(branches_result.scalars().all())

        accessible_branches = []
        
        for branch in all_branches:
            access_check = await self.check_branch_access(user_id, branch.id)
            
            if access_check.has_access:
                branch_info = BranchWithAccessInfo(
                    id=branch.id,
                    article_id=branch.article_id,
                    name=branch.name,
                    description=branch.description,
                    head_commit_id=branch.head_commit_id,
                    is_protected=branch.is_protected,
                    is_private=branch.is_private,
                    created_by=branch.created_by,
                    created_at=branch.created_at,
                    tags=[],  # Заполним отдельно если нужно
                    user_access_level=access_check.access_level,
                    can_read=access_check.permissions.get("can_read", False),
                    can_write=access_check.permissions.get("can_write", False),
                    can_merge=access_check.permissions.get("can_merge", False),
                    can_delete=access_check.permissions.get("can_delete", False)
                )
                accessible_branches.append(branch_info)

        return accessible_branches

    # Вспомогательные методы
    async def _can_user_tag_branch(self, user_id: UUID, branch_id: UUID) -> bool:
        """Проверить, может ли пользователь добавлять теги к ветке"""
        access_check = await self.check_branch_access(user_id, branch_id)
        return access_check.permissions.get("can_write", False) or access_check.access_level == "owner"

    async def _can_user_delete_branch_tag(self, user_id: UUID, branch_id: UUID, tag: str) -> bool:
        """Проверить, может ли пользователь удалить тег ветки"""
        access_check = await self.check_branch_access(user_id, branch_id)
        return access_check.permissions.get("can_delete", False) or access_check.access_level == "owner"

    async def _can_user_grant_access(self, user_id: UUID, branch_id: UUID) -> bool:
        """Проверить, может ли пользователь предоставлять доступ к ветке"""
        access_check = await self.check_branch_access(user_id, branch_id)
        return access_check.access_level in ["owner", "admin"]

    async def _get_user_tag_permissions(self, user_role: str, branch_tags: List[BranchTag]) -> List[BranchTagPermission]:
        """Получить права пользователя по тегам ветки"""
        if not branch_tags:
            return []

        tag_names = [tag.tag for tag in branch_tags]
        
        permissions_query = select(BranchTagPermission).where(
            and_(
                BranchTagPermission.tag.in_(tag_names),
                BranchTagPermission.role == user_role
            )
        )
        permissions_result = await self.db.execute(permissions_query)
        return list(permissions_result.scalars().all())

    def _get_permissions_for_level(self, access_level: str) -> Dict[str, bool]:
        """Получить права для уровня доступа"""
        permissions_map = {
            "read": {
                "can_read": True,
                "can_write": False,
                "can_merge": False,
                "can_delete": False
            },
            "write": {
                "can_read": True,
                "can_write": True,
                "can_merge": False,
                "can_delete": False
            },
            "admin": {
                "can_read": True,
                "can_write": True,
                "can_merge": True,
                "can_delete": True
            },
            "owner": {
                "can_read": True,
                "can_write": True,
                "can_merge": True,
                "can_delete": True
            }
        }
        
        return permissions_map.get(access_level, {
            "can_read": False,
            "can_write": False,
            "can_merge": False,
            "can_delete": False
        })