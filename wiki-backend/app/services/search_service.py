from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any, Tuple

class SearchService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def search(
        self,
        q: str,
        language: Optional[str] = None,
        fields: str = "both",
        limit: int = 20,
        offset: int = 0,
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

        count_sql = base_cte + f"""
            SELECT COUNT(*)
            FROM articles a
            JOIN main_commits mc ON a.id = mc.article_id
            JOIN articles_full_text aft ON mc.head_commit_id = aft.commit_id
            WHERE {where_cond}
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
                WHERE {where_cond}
            ) sub
            ORDER BY {order_expr} DESC, sub.updated_at DESC
            OFFSET :offset LIMIT :limit
        """

        result = await self.db.execute(text(main_sql), params)
        rows = result.mappings().all()
        return total, [dict(row) for row in rows]