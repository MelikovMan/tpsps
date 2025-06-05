"""seed_test_data

Revision ID: a1b2c3d4e5f6
Revises: 0093482a82f5
Create Date: 2025-06-04 14:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from sqlalchemy.dialects import postgresql
import uuid
from datetime import datetime, timezone
import bcrypt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")



# revision identifiers
revision = 'a1b2c3d4e5f6'
down_revision = '0093482a82f5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Определяем таблицы для вставки данных
    permissions_table = table('permissions',
        column('role', sa.String),
        column('can_edit', sa.Boolean),
        column('can_delete', sa.Boolean),
        column('can_moderate', sa.Boolean),
        column('bypass_tag_restrictions', sa.Boolean)
    )
    
    users_table = table('users',
        column('id', sa.UUID),
        column('username', sa.String),
        column('email', sa.String),
        column('password_hash', sa.String),
        column('role', sa.String),
        column('created_at', sa.DateTime),
        column('last_login', sa.DateTime)
    )
    
    categories_table = table('categories',
        column('id', sa.UUID),
        column('name', sa.String),
        column('parent_id', sa.UUID),
        column('path', sa.String)
    )
    
    articles_table = table('articles',
        column('id', sa.UUID),
        column('title', sa.String),
        column('current_commit_id', sa.UUID),
        column('status', sa.String),
        column('article_type', sa.String),
        column('created_at', sa.DateTime),
        column('updated_at', sa.DateTime)
    )
    
    commits_table = table('commits',
        column('id', sa.UUID),
        column('article_id', sa.UUID),
        column('author_id', sa.UUID),
        column('message', sa.Text),
        column('content_diff', sa.Text),
        column('created_at', sa.DateTime),
        column('is_merge', sa.Boolean)
    )
    
    branches_table = table('branches',
        column('id', sa.UUID),
        column('article_id', sa.UUID),
        column('name', sa.String),
        column('description', sa.String),
        column('head_commit_id', sa.UUID),
        column('is_protected', sa.Boolean),
        column('is_private', sa.Boolean),
        column('created_by', sa.UUID),
        column('created_at', sa.DateTime),
        column('updated_at', sa.DateTime)
    )
    
    tags_table = table('tags',
        column('article_id', sa.UUID),
        column('tag', sa.String)
    )
    
    templates_table = table('templates',
        column('id', sa.UUID),
        column('name', sa.String),
        column('content', sa.Text),
        column('variables', postgresql.JSONB),
        column('created_at', sa.DateTime)
    )
    
    user_profiles_table = table('user_profiles',
        column('user_id', sa.UUID),
        column('bio', sa.Text),
        column('avatar_url', sa.Text),
        column('social_links', postgresql.JSONB)
    )
    
    comments_table = table('comments',
        column('id', sa.UUID),
        column('article_id', sa.UUID),
        column('user_id', sa.UUID),
        column('content', sa.Text),
        column('created_at', sa.DateTime),
        column('reply_to_id', sa.UUID)
    )
    
    article_categories_table = table('article_categories',
        column('article_id', sa.UUID),
        column('category_id', sa.UUID)
    )
    
    # Генерируем UUID для тестовых данных
    now = datetime.now(timezone.utc)
    
    # IDs для пользователей
    admin_id = uuid.uuid4()
    editor_id = uuid.uuid4()
    author_id = uuid.uuid4()
    reader_id = uuid.uuid4()
    
    # IDs для категорий
    tech_cat_id = uuid.uuid4()
    python_subcat_id = uuid.uuid4()
    web_subcat_id = uuid.uuid4()
    science_cat_id = uuid.uuid4()
    
    article1_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440001')  # FastAPI tutorial
    article2_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440002')  # PostgreSQL guide
    article3_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440003')  # ML basics
    
    # IDs коммитов (из seed_test_data.py)
    commit1_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440011')  # FastAPI initial
    commit2_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440012')  # FastAPI installation
    commit3_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440013')  # PostgreSQL initial
    commit4_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440014')  # ML initial
    commit5_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440015')  # FastAPI testing
    
    # IDs для веток
    main_branch1_id = uuid.uuid4()
    feature_branch1_id = uuid.uuid4()
    main_branch2_id = uuid.uuid4()
    main_branch3_id = uuid.uuid4()
    
    # IDs для шаблонов
    template1_id = uuid.uuid4()
    template2_id = uuid.uuid4()
    
    # IDs для комментариев
    comment1_id = uuid.uuid4()
    comment2_id = uuid.uuid4()
    comment3_id = uuid.uuid4()
    
    # 1. Вставляем роли и права доступа
    op.bulk_insert(permissions_table, [
        {
            'role': 'admin',
            'can_edit': True,
            'can_delete': True,
            'can_moderate': True,
            'bypass_tag_restrictions': True
        },
        {
            'role': 'editor',
            'can_edit': True,
            'can_delete': False,
            'can_moderate': True,
            'bypass_tag_restrictions': False
        },
        {
            'role': 'author',
            'can_edit': True,
            'can_delete': False,
            'can_moderate': False,
            'bypass_tag_restrictions': False
        },
        {
            'role': 'user',
            'can_edit': True,
            'can_delete': False,
            'can_moderate': False,
            'bypass_tag_restrictions': False
        },
        {
            'role': 'reader',
            'can_edit': False,
            'can_delete': False,
            'can_moderate': False,
            'bypass_tag_restrictions': False
        }
    ])
    
    # 2. Вставляем пользователей
    op.bulk_insert(users_table, [
        {
            'id': admin_id,
            'username': 'admin',
            'email': 'admin@example.com',
            'password_hash': get_password_hash("admin123"),
            'role': 'admin',
            'created_at': now,
            'last_login': now
        },
        {
            'id': editor_id,
            'username': 'editor',
            'email': 'editor@example.com',
            'password_hash': get_password_hash("editor123"),
            'role': 'editor',
            'created_at': now,
            'last_login': now
        },
        {
            'id': author_id,
            'username': 'john_author',
            'email': 'john@example.com',
            'password_hash': get_password_hash("author123"),  # password: author123
            'role': 'author',
            'created_at': now,
            'last_login': now
        },
        {
            'id': reader_id,
            'username': 'reader_user',
            'email': 'reader@example.com',
            'password_hash': get_password_hash("reader123"),  # password: reader123
            'role': 'reader',
            'created_at': now,
            'last_login': now
        }
    ])
    
    # 3. Вставляем профили пользователей
    op.bulk_insert(user_profiles_table, [
        {
            'user_id': admin_id,
            'bio': 'System administrator with expertise in content management and user access control.',
            'avatar_url': 'https://example.com/avatars/admin.jpg',
            'social_links': '{"github": "https://github.com/admin", "twitter": "@admin_user"}'
        },
        {
            'user_id': author_id,
            'bio': 'Technical writer specializing in Python and web development tutorials.',
            'avatar_url': 'https://example.com/avatars/john.jpg',
            'social_links': '{"github": "https://github.com/johnauthor", "linkedin": "https://linkedin.com/in/johnauthor"}'
        },
        {
            'user_id': editor_id,
            'bio': 'Content editor with 5+ years experience in technical documentation.',
            'avatar_url': 'https://example.com/avatars/editor.jpg',
            'social_links': '{"website": "https://editor-blog.com"}'
        }
    ])
    
    # 4. Вставляем категории
    op.bulk_insert(categories_table, [
        {
            'id': tech_cat_id,
            'name': 'Technology',
            'parent_id': None,
            'path': 'technology'
        },
        {
            'id': python_subcat_id,
            'name': 'Python',
            'parent_id': tech_cat_id,
            'path': 'technology.python'
        },
        {
            'id': web_subcat_id,
            'name': 'Web Development',
            'parent_id': tech_cat_id,
            'path': 'technology.web_development'
        },
        {
            'id': science_cat_id,
            'name': 'Science',
            'parent_id': None,
            'path': 'science'
        }
    ])
    
    # 5. Вставляем шаблоны
    op.bulk_insert(templates_table, [
        {
            'id': template1_id,
            'name': 'Tutorial Template',
            'content': '''# {{title}}

## Overview
{{overview}}

## Prerequisites
{{prerequisites}}

## Step-by-step Guide
{{content}}

## Conclusion
{{conclusion}}

## Resources
{{resources}}''',
            'variables': '{"title": "string", "overview": "text", "prerequisites": "text", "content": "text", "conclusion": "text", "resources": "text"}',
            'created_at': now
        },
        {
            'id': template2_id,
            'name': 'API Documentation',
            'content': '''# {{api_name}} API Documentation

## Authentication
{{auth_info}}

## Endpoints

### {{endpoint_name}}
- **URL**: {{endpoint_url}}
- **Method**: {{method}}
- **Parameters**: {{parameters}}
- **Response**: {{response_format}}

## Examples
{{examples}}''',
            'variables': '{"api_name": "string", "auth_info": "text", "endpoint_name": "string", "endpoint_url": "string", "method": "string", "parameters": "text", "response_format": "text", "examples": "text"}',
            'created_at': now
        }
    ])
    
    # 6. Вставляем статьи (сначала без current_commit_id)
    op.bulk_insert(articles_table, [
        {
            'id': article1_id,
            'title': 'Introduction to Python FastAPI',
            'current_commit_id': None,  # Установим позже
            'status': 'published',
            'article_type': 'tutorial',
            'created_at': now,
            'updated_at': now
        },
        {
            'id': article2_id,
            'title': 'Advanced PostgreSQL Queries',
            'current_commit_id': None,  # Установим позже
            'status': 'draft',
            'article_type': 'guide',
            'created_at': now,
            'updated_at': now
        },
        {
            'id': article3_id,
            'title': 'Machine Learning Basics',
            'current_commit_id': None,  # Установим позже
            'status': 'review',
            'article_type': 'article',
            'created_at': now,
            'updated_at': now
        }
    ])
    
    # 7. Вставляем коммиты
    op.bulk_insert(commits_table, [
        {
            'id': commit1_id,
            'article_id': article1_id,
            'author_id': author_id,
            'message': 'Initial commit: Create FastAPI tutorial structure',
            'content_diff': '''# Introduction to Python FastAPI

FastAPI is a modern, fast (high-performance), web framework for building APIs with Python 3.7+ based on standard Python type hints.

## Key Features
- Fast: Very high performance, on par with NodeJS and Go
- Fast to code: Increase the speed to develop features by about 200% to 300%
- Fewer bugs: Reduce about 40% of human (developer) induced errors
- Intuitive: Great editor support with autocompletion everywhere
- Easy: Designed to be easy to use and learn
- Short: Minimize code duplication
- Robust: Get production-ready code with automatic interactive documentation''',
            'created_at': now,
            'is_merge': False
        },
                {
            'id': commit2_id,
            'article_id': article1_id,
            'author_id': author_id,
            'message': 'Add installation and basic example sections',
            'content_diff': '''--- previous
+++ current
@@ -11,3 +11,21 @@ FastAPI is a modern, fast (high-performance), web framework for building APIs w
 - Short: Minimize code duplication
 - Robust: Get production-ready code with automatic interactive documentation
 
+## Installation
+
+```bash
+pip install fastapi
+pip install "uvicorn[standard]"
+```
+
+## Basic Example
+
+```python
+from fastapi import FastAPI
+
+app = FastAPI()
+
+@app.get("/")
+def read_root():
+    return {"Hello": "World"}
+
+@app.get("/items/{item_id}")
+def read_item(item_id: int, q: str = None):
+    return {"item_id": item_id, "q": q}
+```''',
            'created_at': now,
            'is_merge': False
        },

        {
            'id': commit3_id,
            'article_id': article2_id,
            'author_id': editor_id,
            'message': 'Initial commit: PostgreSQL advanced queries draft',
            'content_diff': '''# Advanced PostgreSQL Queries

This article covers advanced PostgreSQL query techniques including window functions, CTEs, and complex joins.

## Window Functions
Window functions perform calculations across a set of table rows that are somehow related to the current row.

## Common Table Expressions (CTEs)
CTEs provide a way to write auxiliary statements for use in a larger query.''',
            'created_at': now,
            'is_merge': False
        },
        {
            'id': commit4_id,
            'article_id': article3_id,
            'author_id': author_id,
            'message': 'Initial commit: ML basics outline',
            'content_diff': '''# Machine Learning Basics

An introduction to fundamental machine learning concepts and algorithms.

## What is Machine Learning?
Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed.

## Types of Machine Learning
1. Supervised Learning
2. Unsupervised Learning  
3. Reinforcement Learning''',
            'created_at': now,
            'is_merge': False
        },
        {
            'id': commit5_id,
            'article_id': article1_id,
            'author_id': editor_id,
            'message': 'Review and improvements to FastAPI tutorial',
            'content_diff': '''--- previous
+++ current
@@ -31,3 +31,11 @@ app = FastAPI()
 @app.get("/items/{item_id}")
 def read_item(item_id: int, q: str = None):
     return {"item_id": item_id, "q": q}
+```
+
+## Testing Your API
+
+To test your FastAPI application:
+
+```bash
+uvicorn main:app --reload
 ```
+
+Visit http://127.0.0.1:8000 to see your API in action.
+Visit http://127.0.0.1:8000/docs for interactive API documentation.''',
            'created_at': now,
            'is_merge': False
        }
    ])
    
    # 8. Вставляем ветки
    op.bulk_insert(branches_table, [
        {
            'id': main_branch1_id,
            'article_id': article1_id,
            'name': 'main',
            'description': 'Main branch for FastAPI tutorial',
            'head_commit_id': commit5_id,
            'is_protected': True,
            'is_private': False,
            'created_by': author_id,
            'created_at': now,
            'updated_at': now
        },
        {
            'id': feature_branch1_id,
            'article_id': article1_id,
            'name': 'feature/advanced-examples',
            'description': 'Branch for adding advanced FastAPI examples',
            'head_commit_id': commit2_id,
            'is_protected': False,
            'is_private': False,
            'created_by': author_id,
            'created_at': now,
            'updated_at': now
        },
        {
            'id': main_branch2_id,
            'article_id': article2_id,
            'name': 'main',
            'description': 'Main branch for PostgreSQL guide',
            'head_commit_id': commit3_id,
            'is_protected': True,
            'is_private': False,
            'created_by': editor_id,
            'created_at': now,
            'updated_at': now
        },
        {
            'id': main_branch3_id,
            'article_id': article3_id,
            'name': 'main',
            'description': 'Main branch for ML basics',
            'head_commit_id': commit4_id,
            'is_protected': True,
            'is_private': False,
            'created_by': author_id,
            'created_at': now,
            'updated_at': now
        }
    ])
    
    # 9. Обновляем current_commit_id в статьях
    op.execute(
        articles_table.update()
        .where(articles_table.c.id == article1_id)
        .values(current_commit_id=commit5_id)
    )
    
    op.execute(
        articles_table.update()
        .where(articles_table.c.id == article2_id)
        .values(current_commit_id=commit3_id)
    )
    
    op.execute(
        articles_table.update()
        .where(articles_table.c.id == article3_id)
        .values(current_commit_id=commit4_id)
    )
    
    # 10. Вставляем теги
    op.bulk_insert(tags_table, [
        {'article_id': article1_id, 'tag': 'python'},
        {'article_id': article1_id, 'tag': 'fastapi'},
        {'article_id': article1_id, 'tag': 'api'},
        {'article_id': article1_id, 'tag': 'tutorial'},
        {'article_id': article2_id, 'tag': 'postgresql'},
        {'article_id': article2_id, 'tag': 'database'},
        {'article_id': article2_id, 'tag': 'sql'},
        {'article_id': article3_id, 'tag': 'machine-learning'},
        {'article_id': article3_id, 'tag': 'ai'},
        {'article_id': article3_id, 'tag': 'data-science'}
    ])
    
    # 11. Связываем статьи с категориями
    op.bulk_insert(article_categories_table, [
        {'article_id': article1_id, 'category_id': python_subcat_id},
        {'article_id': article1_id, 'category_id': web_subcat_id},
        {'article_id': article2_id, 'category_id': tech_cat_id},
        {'article_id': article3_id, 'category_id': science_cat_id}
    ])
    
    # 12. Вставляем комментарии
    op.bulk_insert(comments_table, [
        {
            'id': comment1_id,
            'article_id': article1_id,
            'user_id': reader_id,
            'content': 'Great tutorial! Very clear explanation of FastAPI basics. Looking forward to more advanced topics.',
            'created_at': now,
            'reply_to_id': None
        },
        {
            'id': comment2_id,
            'article_id': article1_id,
            'user_id': author_id,
            'content': 'Thank you! I\'m planning to add more advanced examples in the next update.',
            'created_at': now,
            'reply_to_id': comment1_id
        },
        {
            'id': comment3_id,
            'article_id': article2_id,
            'user_id': admin_id,
            'content': 'This article needs more practical examples. Please add some real-world use cases.',
            'created_at': now,
            'reply_to_id': None
        }
    ])


def downgrade() -> None:
    # Удаляем тестовые данные в обратном порядке
    op.execute("DELETE FROM comments")
    op.execute("DELETE FROM article_categories")
    op.execute("DELETE FROM tags")
    op.execute("DELETE FROM branches")
    op.execute("DELETE FROM commits")
    op.execute("DELETE FROM articles")
    op.execute("DELETE FROM templates")
    op.execute("DELETE FROM categories")
    op.execute("DELETE FROM user_profiles")
    op.execute("DELETE FROM users")
    op.execute("DELETE FROM permissions")