import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from uuid import UUID

from app.models.template import Template
from app.schemas.template import TemplateCreate
from app.schemas.template import TemplateUpdate

import re
from html import escape
from app.utils.md_to_html import md_to_html


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
    async def render_template(self, name: str, params: dict) -> Optional[str]:
        """Подставляет параметры в шаблон и возвращает готовый HTML"""
        template = await self.get_template_by_name(name)
        if not template:
            return None

        content = template.content
        # Замена плейсхолдеров {{param}} на экранированные значения
        for key, val in params.items():
            content = content.replace(f"{{{{{{{key}}}}}}}", escape(val))

        # Конвертация Markdown → HTML (функция md_to_html уже существует)
        from app.utils.md_to_html import md_to_html
        html = await md_to_html(content)
        return html
    
    async def render_template_html(self, name: str, params: dict) -> str:
        """Возвращает HTML для вставки на страницу."""
        template = await self.get_template_by_name(name)
        if not template:
            return self._render_error_placeholder(name)

        content = template.content
        for key, val in params.items():
            # Экранируем значение и заменяем плейсхолдер {{key}}
            content = content.replace(f"{{{{{key}}}}}", escape(val))
        # Преобразуем Markdown шаблона в HTML (с учётом вложенных шаблонов их тоже можно обработать)
        html = await md_to_html(content)
        return f'<div class="template-rendered" data-template-name="{name}">{html}</div>'

    def _render_error_placeholder(self, name: str) -> str:
        return f'<div class="template-error">Шаблон «{name}» не найден</div>'
    
    async def render_article_with_templates(self, markdown_text: str) -> str:
        """Заменяет шаблоны в Markdown на готовый HTML и возвращает итоговый HTML."""
        pattern = re.compile(r'\{\{([^|]+?)(\|(.*?))?\}\}')
        placeholders = {}  # словарь {плейсхолдер: html}

        def replace_with_placeholder(match):
            name = match.group(1).strip()
            param_str = match.group(3) or ''
            params = {}
            if param_str:
                for pair in param_str.split('|'):
                    if '=' in pair:
                        k, v = pair.split('=', 1)
                        params[k.strip()] = v.strip()
            # Создаём уникальный плейсхолдер
            pid = f"TPLID_{uuid.uuid4().hex}"
            placeholders[pid] = (name, params)
            return pid

        # Шаг 1: замена на плейсхолдеры
        text_with_placeholders = pattern.sub(replace_with_placeholder, markdown_text)

        # Шаг 2: преобразование оставшегося Markdown в HTML
        html_with_placeholders = await md_to_html(text_with_placeholders)

        # Шаг 3: замена плейсхолдеров на реальный HTML шаблонов
        for pid, (name, params) in placeholders.items():
            template_html = await self.render_template_html(name, params)
            html_with_placeholders = html_with_placeholders.replace(pid, template_html)

        return html_with_placeholders
