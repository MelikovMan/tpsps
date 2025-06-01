from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from uuid import UUID

from app.models.template import Template
from app.schemas.template import TemplateCreate, TemplateUpdate


class TemplateService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_templates(self, skip: int = 0, limit: int = 100) -> List[Template]:
        """Get all templates with pagination"""
        query = select(Template).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def create_template(self, template_data: TemplateCreate) -> Template:
        """Create a new template"""
        template = Template(
            name=template_data.name,
            content=template_data.content,
            description=template_data.description
        )
        
        self.db.add(template)
        await self.db.commit()
        await self.db.refresh(template)
        return template

    async def get_template(self, template_id: UUID) -> Optional[Template]:
        """Get a specific template by ID"""
        query = select(Template).where(Template.id == template_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_template_by_name(self, template_name: str) -> Optional[Template]:
        """Get a template by name"""
        query = select(Template).where(Template.name == template_name)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def update_template(self, template_id: UUID, template_data: TemplateUpdate) -> Optional[Template]:
        """Update a template"""
        query = select(Template).where(Template.id == template_id)
        result = await self.db.execute(query)
        template = result.scalar_one_or_none()
        
        if not template:
            return None
        
        update_data = template_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(template, field, value)
        
        await self.db.commit()
        await self.db.refresh(template)
        return template

    async def delete_template(self, template_id: UUID) -> bool:
        """Delete a template"""
        query = select(Template).where(Template.id == template_id)
        result = await self.db.execute(query)
        template = result.scalar_one_or_none()
        
        if not template:
            return False
        
        await self.db.delete(template)
        await self.db.commit()
        return True
