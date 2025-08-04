"""seed_media_data

Revision ID: 5d9c8a7b4e3f
Revises: 262b971a83ed
Create Date: 2025-06-27 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from sqlalchemy.dialects import postgresql
import uuid
from datetime import datetime, timezone

# revision identifiers
revision = '5d9c8a7b4e3f'
down_revision = '262b971a83ed'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Определяем таблицы
    media_table = table('media',
        column('id', sa.UUID),
        column('article_id', sa.UUID),
        column('commit_id', sa.UUID),
        column('original_filename', sa.String),
        column('storage_path', sa.Text),
        column('bucket_name', sa.String),
        column('object_key', sa.Text),
        column('mime_type', sa.String),
        column('file_size', sa.Integer),
        column('public_url', sa.Text),
        column('uploaded_at', sa.DateTime),
        column('updated_at', sa.DateTime)
    )
    
    user_profiles_table = table('user_profiles',
        column('user_id', sa.UUID),
        column('avatar_url', sa.Text)
    )
    
    # Получаем существующие ID из предыдущих миграций
    article1_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440001')  # FastAPI tutorial
    article2_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440002')  # PostgreSQL guide
    article3_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440003')  # ML basics
    
    commit1_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440011')  # FastAPI initial
    commit3_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440013')  # PostgreSQL initial
    commit4_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440014')  # ML initial
    commit5_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440015')  # FastAPI testing
    
    # IDs пользователей
    admin_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440101')  # admin
    editor_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440102')  # editor
    author_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440103')  # author
    
    now = datetime.now(timezone.utc)
    
    # Добавляем медиафайлы для статей
    op.bulk_insert(media_table, [
        # Изображения для статьи 1 (FastAPI tutorial)
        {
            'id': uuid.uuid4(),
            'article_id': article1_id,
            'commit_id': commit5_id,
            'original_filename': 'fastapi-logo.png',
            'storage_path': 'media/fastapi-logo.png',
            'bucket_name': 'media-files',
            'object_key': 'articles/fastapi-logo.png',
            'mime_type': 'image/png',
            'file_size': 10240,
            'public_url': 'http://minio:9000/media-files/articles/fastapi-logo.png',
            'uploaded_at': now,
            'updated_at': now
        },
        {
            'id': uuid.uuid4(),
            'article_id': article1_id,
            'commit_id': commit5_id,
            'original_filename': 'fastapi-code-example.png',
            'storage_path': 'media/fastapi-code-example.png',
            'bucket_name': 'media-files',
            'object_key': 'articles/fastapi-code-example.png',
            'mime_type': 'image/png',
            'file_size': 20480,
            'public_url': 'http://minio:9000/media-files/articles/fastapi-code-example.png',
            'uploaded_at': now,
            'updated_at': now
        },
        
        # Изображения для статьи 2 (PostgreSQL guide)
        {
            'id': uuid.uuid4(),
            'article_id': article2_id,
            'commit_id': commit3_id,
            'original_filename': 'postgres-window-functions.png',
            'storage_path': 'media/postgres-window-functions.png',
            'bucket_name': 'media-files',
            'object_key': 'articles/postgres-window-functions.png',
            'mime_type': 'image/png',
            'file_size': 15360,
            'public_url': 'http://minio:9000/media-files/articles/postgres-window-functions.png',
            'uploaded_at': now,
            'updated_at': now
        },
        {
            'id': uuid.uuid4(),
            'article_id': article2_id,
            'commit_id': commit4_id,
            'original_filename': 'postgres-cte-example.png',
            'storage_path': 'media/postgres-cte-example.png',
            'bucket_name': 'media-files',
            'object_key': 'articles/postgres-cte-example.png',
            'mime_type': 'image/png',
            'file_size': 17890,
            'public_url': 'http://minio:9000/media-files/articles/postgres-cte-example.png',
            'uploaded_at': now,
            'updated_at': now
        },
        
        # Изображения для статьи 3 (ML basics)
        {
            'id': uuid.uuid4(),
            'article_id': article3_id,
            'commit_id': commit1_id,
            'original_filename': 'ml-types-diagram.png',
            'storage_path': 'media/ml-types-diagram.png',
            'bucket_name': 'media-files',
            'object_key': 'articles/ml-types-diagram.png',
            'mime_type': 'image/png',
            'file_size': 25600,
            'public_url': 'http://minio:9000/media-files/articles/ml-types-diagram.png',
            'uploaded_at': now,
            'updated_at': now
        },
        {
            'id': uuid.uuid4(),
            'article_id': article3_id,
            'commit_id': commit1_id,
            'original_filename': 'ml-workflow.png',
            'storage_path': 'media/ml-workflow.png',
            'bucket_name': 'media-files',
            'object_key': 'articles/ml-workflow.png',
            'mime_type': 'image/png',
            'file_size': 19800,
            'public_url': 'http://minio:9000/media-files/articles/ml-workflow.png',
            'uploaded_at': now,
            'updated_at': now
        }
    ])
    
    # Обновляем аватары пользователей
    op.execute(
        user_profiles_table.update()
        .where(user_profiles_table.c.user_id == admin_id)
        .values(avatar_url='http://minio:9000/media-files/avatars/admin_avatar.png')
    )
    
    op.execute(
        user_profiles_table.update()
        .where(user_profiles_table.c.user_id == editor_id)
        .values(avatar_url='http://minio:9000/media-files/avatars/editor_avatar.png')
    )
    
    op.execute(
        user_profiles_table.update()
        .where(user_profiles_table.c.user_id == author_id)
        .values(avatar_url='http://minio:9000/media-files/avatars/author_avatar.png')
    )
    


def downgrade() -> None:
    # Удаляем все добавленные медиафайлы
    op.execute("DELETE FROM media WHERE public_url LIKE 'http://minio:9000/media-files/%'")
    
    # Восстанавливаем исходные аватары пользователей
    user_profiles_table = table('user_profiles',
        column('user_id', sa.UUID),
        column('avatar_url', sa.Text)
    )
    
    admin_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440101')  # admin
    editor_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440102')  # editor
    author_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440103')  # author
    
    op.execute(
        user_profiles_table.update()
        .where(user_profiles_table.c.user_id == admin_id)
        .values(avatar_url='https://example.com/avatars/admin.jpg')
    )
    
    op.execute(
        user_profiles_table.update()
        .where(user_profiles_table.c.user_id == editor_id)
        .values(avatar_url='https://example.com/avatars/editor.jpg')
    )
    
    op.execute(
        user_profiles_table.update()
        .where(user_profiles_table.c.user_id == author_id)
        .values(avatar_url='https://example.com/avatars/john.jpg')
    )