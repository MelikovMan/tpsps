# app/services/search_factory.py
from typing import Dict, Type, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import SearchEngineType
from app.core.config import settings
from app.services.search_services.base_search import BaseSearchService
from app.services.search_services.postgres_search import PostgresSearchService
from app.services.search_services.typesense_search import TypesenseSearchService


class SearchServiceFactory:
    """Фабрика для создания поисковых сервисов с регистрацией классов."""

    _services: Dict[SearchEngineType, Type[BaseSearchService]] = {
        SearchEngineType.POSTGRES: PostgresSearchService,
        SearchEngineType.TYPESENSE: TypesenseSearchService,
    }

    @classmethod
    def register_service(cls, engine_type: SearchEngineType, service_class: Type[BaseSearchService]):
        """Регистрирует новый класс поискового сервиса для указанного типа."""
        cls._services[engine_type] = service_class

    @classmethod
    def create_service(cls, engine_type: SearchEngineType, db: Optional[AsyncSession] = None) -> BaseSearchService:
        """Создаёт экземпляр поискового сервиса для указанного типа."""
        service_class = cls._services.get(engine_type)
        if not service_class:
            raise ValueError(f"Нет зарегистрированного поискового сервиса для типа {engine_type}")

        # POSTGRES требует сессию БД, остальные могут не требовать
        if engine_type == SearchEngineType.POSTGRES:
            if db is None:
                raise ValueError("Для PostgresSearchService требуется сессия базы данных")
            return service_class(db)
        else:
            return service_class()


# FastAPI зависимость
async def get_search_service(db: AsyncSession) -> BaseSearchService:
    """Возвращает экземпляр поискового сервиса в соответствии с настройками."""
    return SearchServiceFactory.create_service(settings.SEARCH_ENGINE, db)