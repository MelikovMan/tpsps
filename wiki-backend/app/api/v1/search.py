# app/api/v1/endpoints/search.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.schemas.search import SearchQueryParams, SearchResponse, SearchResultItem
from app.services.search_services.search_service_factory import SearchServiceFactory

router = APIRouter()

@router.get("/", response_model=SearchResponse)
async def search_articles(
    params: SearchQueryParams = Depends(),
    db: AsyncSession = Depends(get_db)
):
    # Создаём нужный сервис внутри функции
    search_service = SearchServiceFactory.create_service(settings.SEARCH_ENGINE, db)
    total, results = await search_service.search(
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