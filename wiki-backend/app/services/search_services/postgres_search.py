# app/services/postgres_search.py
import hashlib
import json
from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_cache import FastAPICache

from app.services.search_services.base_search import BaseSearchService


class PostgresSearchService(BaseSearchService):
    def __init__(self, db: AsyncSession):
        self.db = db
        self.cache_backend = FastAPICache.get_backend()

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
        if not q:
            return 0, []

        # Проверка кэша
        cache_key = self._generate_cache_key(q, language, fields, limit, offset)
        cached = await self.cache_backend.get(cache_key)
        if cached:
            return json.loads(cached)

        total, results = await self._execute_search(q, language, fields, limit, offset)
        await self.cache_backend.set(
            cache_key,
            json.dumps((total, results), default=self._json_serializer),
            expire=300
        )
        return total, results

    async def _execute_search(
        self,
        q: str,
        language: Optional[str],
        fields: str,
        limit: int,
        offset: int,
    ) -> Tuple[int, List[Dict[str, Any]]]:
        config_map = {"ru": ("russian", "tsv_ru"), "en": ("english", "tsv_en")}
        if language in config_map:
            config, tsv_column = config_map[language]
        else:
            config = "simple"
            tsv_column = None

        params = {
            "q": q,
            "config": config,
            "fields": fields,
            "limit": limit,
            "offset": offset,
        }

        if tsv_column:
            tsv_expr = f"aft.{tsv_column}"
            tsv_query_expr = "plainto_tsquery(:config, :q)"
        else:
            tsv_expr = "to_tsvector(:config, aft.text)"
            tsv_query_expr = "plainto_tsquery(:config, :q)"

        base_cte = """
            WITH main_commits AS (
                SELECT DISTINCT ON (article_id) article_id, head_commit_id
                FROM branches
                WHERE name = 'main'
                ORDER BY article_id, created_at DESC
            )
        """

        if fields == "title":
            where_cond = "a.title % :q"
        elif fields == "content":
            where_cond = f"{tsv_expr} @@ {tsv_query_expr}"
        else:
            where_cond = f"(a.title % :q OR {tsv_expr} @@ {tsv_query_expr})"

        # Подсчёт общего количества
        count_sql = base_cte + f"""
            SELECT COUNT(*)
            FROM articles a
            JOIN main_commits mc ON a.id = mc.article_id
            JOIN articles_full_text aft ON mc.head_commit_id = aft.commit_id
            WHERE a.status = 'published' AND {where_cond}
        """
        total = await self.db.scalar(text(count_sql), params) or 0

        if total == 0:
            return 0, []

        rank_expr = f"ts_rank_cd({tsv_expr}, {tsv_query_expr})"
        sim_expr = "similarity(a.title, :q)"

        if fields == "title":
            order_expr = "sub.sim_title"
        elif fields == "content":
            order_expr = "sub.rank_content"
        else:
            order_expr = "(sub.rank_content * 0.5 + sub.sim_title * 1.0)"

        main_sql = base_cte + f"""
            SELECT sub.id, sub.title, sub.created_at, sub.updated_at,
                   sub.snippet, sub.rank_content, sub.sim_title
            FROM (
                SELECT a.id, a.title, a.created_at, a.updated_at,
                       ts_headline(:config, aft.text, {tsv_query_expr},
                                   'StartSel=<mark>, StopSel=</mark>, MaxWords=30, MinWords=15') as snippet,
                       {rank_expr} as rank_content,
                       {sim_expr} as sim_title
                FROM articles a
                JOIN main_commits mc ON a.id = mc.article_id
                JOIN articles_full_text aft ON mc.head_commit_id = aft.commit_id
                WHERE a.status = 'published' AND {where_cond}
            ) sub
            ORDER BY {order_expr} DESC, sub.updated_at DESC
            OFFSET :offset LIMIT :limit
        """

        result = await self.db.execute(text(main_sql), params)
        rows = result.mappings().all()
        return total, [dict(row) for row in rows]

    def _generate_cache_key(self, q: str, language: Optional[str], fields: str, limit: int, offset: int) -> str:
        key_data = f"{q}:{language}:{fields}:{limit}:{offset}"
        key_hash = hashlib.md5(key_data.encode()).hexdigest()
        return f"search:{key_hash}"

    def _json_serializer(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        raise TypeError(f"Type {type(obj)} not serializable")