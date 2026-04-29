# app/core/typesense.py
import typesense
from typesense import AsyncClient
from app.core.config import settings


class TypesenseClient:
    def __init__(self):
        self.client: AsyncClient | None = None

    async def initialize(self):
        """Создаёт асинхронный клиент Typesense."""
        self.client = typesense.AsyncClient({
            'nodes': [{
                'host': settings.TYPESENSE_HOST,
                'port': settings.TYPESENSE_PORT,
                'protocol': 'http',
            }],
            'api_key': settings.TYPESENSE_API_KEY,
            'connection_timeout_seconds': 5
        })
        # Проверим соединение (опционально)

    async def close(self):
        """Закрывает клиент."""
        if self.client:
            await self.client.api_call.aclose()

    def get_client(self) -> AsyncClient:
        """Возвращает клиент (предполагается, что уже инициализирован)."""
        if not self.client:
            raise RuntimeError("Typesense client not initialized")
        return self.client

# Глобальный экземпляр
typesense_client = TypesenseClient()

# Зависимость для FastAPI
async def get_typesense_client() -> AsyncClient:
    return typesense_client.get_client()

EMBEDDING_MODEL = settings.TYPESENSE_EMBEDDING_MODEL
async def ensure_typesense_collection():
    """Создаёт коллекцию с поддержкой семантического поиска."""
    schema = {
        'name': 'articles',
        'fields': [
            {'name': 'id', 'type': 'string'},
            {'name': 'title', 'type': 'string'},
            {'name': 'content', 'type': 'string'},
            {'name': 'language', 'type': 'string', 'facet': True},
            {'name': 'created_at', 'type': 'int64'},
            {'name': 'updated_at', 'type': 'int64'},
            {
                'name': 'embedding',
                'type': 'float[]',
                'embed': {
                    'from': ['title', 'content'],          # поля для генерации эмбеддинга
                    'model_config': {
                        'model_name': EMBEDDING_MODEL
                    }
                }
            }
        ],
        'default_sorting_field': 'updated_at'
    }
    typesense_client = await get_typesense_client()
    try:
        
        await typesense_client.collections.create(schema)
    except typesense.exceptions.ObjectAlreadyExists:
        # Если коллекция существует, можно либо обновить её (удалив и создав заново),
        # либо использовать миграцию (но Typesense не поддерживает изменение схемы на лету,
        # поэтому проще пересоздать коллекцию с новыми данными).
        await typesense_client.collections['articles'].delete()
        await typesense_client.collections.create(schema)