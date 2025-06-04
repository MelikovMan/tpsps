import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# Добавляем путь к проекту
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.core.database import Base
from app.core.config import settings

# Импортируем все модели для автогенерации
from app.models.user import User, UserProfile, ProfileVersion
from app.models.article import Article, Commit, CommitParent, Branch
from app.models.category import Category, ArticleCategory
from app.models.tag import Tag, TagPermission
from app.models.moderation import Moderation
from app.models.comment import Comment
from app.models.media import Media
from app.models.template import Template
from app.models.permission import Permission
from app.core.database import sync_engine

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.
def render_item(type_, obj, autogen_context):
    """Apply custom rendering for selected items."""

    if type_ == "type" and obj.__class__.__module__.startswith("sqlalchemy_utils."):
        autogen_context.imports.add(f"import {obj.__class__.__module__}")
        if hasattr(obj, "choices"):
            return f"{obj.__class__.__module__}.{obj.__class__.__name__}(choices={obj.choices})"
        else:
            return f"{obj.__class__.__module__}.{obj.__class__.__name__}()"

        # default rendering for other objects
    return False
def get_url():
    """Получаем URL базы данных из настроек или переменной окружения"""
    url = None
    
    # Сначала пробуем получить из переменной окружения
    url = os.getenv('DATABASE_URL_SYNC')
    
    # Потом пробуем получить из settings
    if not url:
        try:
            if hasattr(settings, 'database_url_sync') and settings.database_url_sync:
                url = settings.database_url_sync
        except Exception:
            pass
    
    # Если не получилось, берем из конфига
    if not url:
        url = config.get_main_option("sqlalchemy.url")
    
    # Убеждаемся, что URL правильно закодирован
    if url and isinstance(url, bytes):
        url = url.decode('utf-8', errors='replace')
    
    return url


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        render_item=render_item,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    url = get_url()
    
    if not url:
        raise ValueError("Не удалось получить URL базы данных")
    
    print(f"Подключение к базе данных: {url}")
    
    # Получаем конфигурацию для синхронного движка
    configuration = config.get_section(config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = url
    
    # Создаем синхронный движок
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    try:
        with sync_engine.connect() as connection:
            context.configure(
                connection=connection,
                target_metadata=target_metadata,
                render_item=render_item,
                compare_type=True,
                compare_server_default=True,
                # Включаем сравнение индексов
                compare_index_names=True,
                # Дополнительные опции для более точного сравнения
                render_as_batch=True,
            )

            with context.begin_transaction():
                context.run_migrations()
    except Exception as e:
        print(f"Ошибка при подключении к базе данных: {e}")
        print(f"URL: {url}")
        raise


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()