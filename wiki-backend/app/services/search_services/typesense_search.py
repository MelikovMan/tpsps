# app/services/typesense_search.py
from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime

from app.core.typesense_client import typesense_client
from app.services.search_services.base_search import BaseSearchService


class TypesenseSearchService(BaseSearchService):
    def __init__(self):
        # Клиент уже сконфигурирован глобально
        self.client = typesense_client

    async def search(
        self,
        q: str,
        language: Optional[str] = None,
        fields: str = "both",
        limit: int = 20,
        offset: int = 0,
    ) -> Tuple[int, List[Dict[str, Any]]]:
        if not q:
            return 0, []

        # Определяем поля для поиска
        query_by = "title,content" if fields == "both" else fields

        # Подготовка параметров поиска
        search_params = {
            'q': q,
            'query_by': query_by,
            'per_page': limit,
            'page': (offset // limit) + 1,  # Typesense использует номера страниц
            'highlight_fields': 'title,content',
            'highlight_start_tag': '<mark>',
            'highlight_end_tag': '</mark>',
        }

        # Фильтр по языку, если указан
        if language:
            search_params['filter_by'] = f'language:={language}'
            search_params['language'] = language  # для корректной стемминги

        try:
            response = self.client.collections['articles'].documents.search(search_params)
        except Exception as e:
            # Логирование ошибки
            return 0, []

        total = response.get('found', 0)
        hits = response.get('hits', [])

        results = []
        for hit in hits:
            doc = hit['document']
            # Извлекаем подсвеченный фрагмент (snippet)
            snippet = None
            highlights = hit.get('highlights', [])
            if highlights:
                # Выбираем подсветку из контента, если есть, иначе из заголовка
                for h in highlights:
                    if h.get('field') == 'content' and h.get('snippet'):
                        snippet = h['snippet']
                        break
                if not snippet:
                    for h in highlights:
                        if h.get('field') == 'title' and h.get('snippet'):
                            snippet = h['snippet']
                            break

            # Преобразование временных меток (Typesense хранит int64 timestamp)
            created_at = doc.get('created_at', 0)
            updated_at = doc.get('updated_at', 0)
            if created_at:
                created_at = datetime.fromtimestamp(created_at)
            if updated_at:
                updated_at = datetime.fromtimestamp(updated_at)

            results.append({
                'id': doc['id'],
                'title': doc['title'],
                'snippet': snippet,
                'created_at': created_at,
                'updated_at': updated_at,
                'rank_content': hit.get('_ranking_score'),  # опционально
                'sim_title': None,  # Typesense не предоставляет отдельно similarity
            })

        return total, results