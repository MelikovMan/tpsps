from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Union
from uuid import UUID
from datetime import datetime
class SearchQueryParams(BaseModel):
    """Параметры поискового запроса."""
    q: str = Field(..., min_length=1, description="Поисковый запрос")
    language: Optional[str] = Field(
        "ru",
        pattern="^(ru|en)$",
        description="Язык для полнотекстового поиска (ru или en)"
    )
    fields: str = Field(
        "both",
        pattern="^(title|content|both)$",
        description="Поля для поиска: title, content или both"
    )
    limit: int = Field(20, ge=1, le=100, description="Количество результатов на странице")
    offset: int = Field(0, ge=0, description="Смещение для пагинации")
    hybrid: bool = Field(
        False,
        description="Использовать гибридный поиск (комбинация текстового и семантического)"
    )
    semantic_weight: float = Field(
        0.5,
        ge=0.0,
        le=1.0,
        description="Вес семантической составляющей (0 - только текст, 1 - только семантика)"
    )


class SearchResultItem(BaseModel):
    """Один результат поиска."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    snippet: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    rank_content: Union[float, int, None] = Field(
        None,
        description="Релевантность по содержимому (ts_rank_cd)"
    )
    sim_title: Optional[float] = Field(
        None,
        description="Сходство заголовка (pg_trgm similarity)"
    )


class SearchResponse(BaseModel):
    """Ответ на поисковый запрос."""
    query: str
    language: Optional[str]
    fields: str
    total: int
    results: List[SearchResultItem]