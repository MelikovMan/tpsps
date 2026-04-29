# app/services/base_search.py
from abc import ABC, abstractmethod
from typing import List, Optional, Tuple, Dict, Any

class BaseSearchService(ABC):
    """
    Абстрактный базовый класс для всех поисковых сервисов.
    Определяет единый интерфейс для выполнения поиска.
    """

    @abstractmethod
    async def search(
        self,
        q: str,
        language: Optional[str] = None,
        fields: str = "both",
        limit: int = 20,
        offset: int = 0,
        hybrid: bool = False,
        semantic_weight: float = 0.5,
    ) -> Tuple[int, List[Dict[str, Any]]]:
        """
        Выполняет поиск по запросу q.

        Параметры:
            q: поисковый запрос
            language: язык для полнотекстового поиска ('ru', 'en' или None)
            fields: поля для поиска ('title', 'content', 'both')
            limit: количество результатов на странице
            offset: смещение для пагинации

        Возвращает:
            Кортеж (общее количество результатов, список словарей с полями:
                id, title, snippet, created_at, updated_at,
                rank_content (опционально), sim_title (опционально))
        """
        pass