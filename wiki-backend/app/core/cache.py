from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis import asyncio as aioredis
from app.core.config import settings

async def init_redis_cache():
    """
    Инициализирует подключение к Redis и настраивает кэширование
    """
    redis = aioredis.from_url(
        settings.redis_url,
        encoding="utf8",
        decode_responses=True,
        socket_timeout=5,
        retry_on_timeout=True,
        max_connections=100
    )
    
    if not await redis.ping():
        raise ConnectionError("Failed to connect to Redis")
    
    FastAPICache.init(
        RedisBackend(redis),
        prefix="wiki-cache",
        expire=settings.cache_expire,
        key_builder=custom_key_builder
    )

def custom_key_builder(
    func,
    namespace: str = "",
    *args,
    **kwargs
) -> str:
    """
    Кастомный билдер ключей для кэша
    Формат: namespace:module:function:args:kwargs
    """
    return f"{namespace}:{func.__module__}:{func.__name__}:{args}:{kwargs}"