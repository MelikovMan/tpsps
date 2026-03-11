from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.search import SearchQueryParams, SearchResponse, SearchResultItem
from app.services.search_service import SearchService

router = APIRouter()

@router.get("/", response_model=SearchResponse)
async def search_articles(
    params: SearchQueryParams = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """
    Полнотекстовый поиск по статьям с учётом языка.
    Использует pg_trgm для нечёткого поиска по заголовку и tsvector для содержания.
    """
    service = SearchService(db)
    total, results = await service.search(
        q=params.q,
        language=params.language,
        fields=params.fields,
        limit=params.limit,
        offset=params.offset
    )

    return SearchResponse(
        query=params.q,
        language=params.language,
        fields=params.fields,
        total=total,
        results=[SearchResultItem.model_validate(r) for r in results]
    )