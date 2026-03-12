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