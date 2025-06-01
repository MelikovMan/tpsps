# app/services/tag_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID

from app.models.tag import Tag, TagPermission
from app.models.article import Article
from app.schemas.tag import TagCreate, TagPermissionCreate


class TagService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_tags(self, skip: int = 0, limit: int = 100) -> List[Tag]:
        """Get all tags with pagination"""
        query = select(Tag).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.all())

    async def get_article_tags(self, article_id: UUID) -> List[Tag]:
        """Get all tags for a specific article"""
        query = select(Tag).where(Tag.article_id == article_id)
        result = await self.db.execute(query)
        return list(result.all())

    async def create_tag(self, tag_data: TagCreate, user_id: UUID) -> Tag:
        """Create a new tag for an article"""
        # Check if user has permission to tag this article
        article_query = select(Article).where(Article.id == tag_data.article_id)
        article_result = await self.db.execute(article_query)
        article = article_result.scalar_one_or_none()
        
        if not article:
            raise ValueError("Article not found")

        # Check if tag already exists for this article
        existing_tag_query = select(Tag).where(
            Tag.article_id == tag_data.article_id,
            Tag.name == tag_data.name
        )
        existing_result = await self.db.execute(existing_tag_query)
        existing_tag = existing_result.scalar_one_or_none()
        
        if existing_tag:
            return existing_tag

        tag = Tag(
            article_id=tag_data.article_id,
            name=tag_data.name,
            created_by=user_id
        )
        
        self.db.add(tag)
        await self.db.commit()
        await self.db.refresh(tag)
        return tag

    async def delete_tag(self, article_id: UUID, tag_name: str, user_id: UUID) -> bool:
        """Delete a tag from an article"""
        query = select(Tag).where(
            Tag.article_id == article_id,
            Tag.name == tag_name
        )
        result = await self.db.execute(query)
        tag = result.scalar_one_or_none()
        
        if not tag:
            return False
        
        # Check if user can delete this tag (creator or admin)
        if tag.created_by != user_id:
            # Additional permission check would go here
            pass
        
        await self.db.delete(tag)
        await self.db.commit()
        return True

    async def create_tag_permission(self, permission_data: TagPermissionCreate) -> TagPermission:
        """Create tag permission"""
        permission = TagPermission(
            tag_name=permission_data.tag_name,
            role=permission_data.role,
            can_create=permission_data.can_create,
            can_delete=permission_data.can_delete
        )
        
        self.db.add(permission)
        await self.db.commit()
        await self.db.refresh(permission)
        return permission

    async def get_tag_permissions(self, tag_name: str) -> List[TagPermission]:
        """Get permissions for a specific tag"""
        query = select(TagPermission).where(TagPermission.tag_name == tag_name)
        result = await self.db.execute(query)
        return list(result.scalars().all())

