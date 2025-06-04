from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

async_engine = create_async_engine(
    settings.database_url,
    pool_pre_ping=True,  # Должен быть в формате: postgresql+asyncpg://user:pass@host/db
    echo=settings.debug,
    future=True,
    
)

sync_engine = create_engine(
    settings.database_url_sync,  # Должен быть в формате: postgresql://user:pass@host/db
    echo=settings.debug,
    client_encoding='utf8'
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            #await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()