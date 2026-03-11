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
        """
        Выполняет поиск статей по запросу q.
        Возвращает (total_count, список результатов).
        """
        if not q:
            return 0, []

        # Определяем конфигурацию для полнотекстового поиска
        config_map = {"ru": "russian", "en": "english"}
        config = config_map.get(language, "simple") if language else "simple"

        params = {
            "q": q,
            "config": config,
            "fields": fields,
            "limit": limit,
            "offset": offset,
        }

        # CTE для получения последнего коммита в main ветке каждой статьи
        base_cte = """
            WITH main_commits AS (
                SELECT DISTINCT ON (b.article_id) b.article_id, b.head_commit_id
                FROM branches b
                WHERE b.name = 'main'
                ORDER BY b.article_id, b.created_at DESC
            )
        """

        # Условия поиска в зависимости от fields
        if fields == "title":
            where_cond = "a.title % :q"
        elif fields == "content":
            where_cond = "to_tsvector(:config, aft.text) @@ plainto_tsquery(:config, :q)"
        else:  # both
            where_cond = "(a.title % :q OR to_tsvector(:config, aft.text) @@ plainto_tsquery(:config, :q))"

        # Подсчёт общего количества результатов
        count_sql = base_cte + """
            SELECT COUNT(*)
            FROM articles a
            JOIN main_commits mc ON a.id = mc.article_id
            JOIN articles_full_text aft ON mc.head_commit_id = aft.commit_id
            WHERE a.status = 'published' AND {}""".format(where_cond)

        total = await self.db.scalar(text(count_sql), params) or 0

        if total == 0:
            return 0, []

        # Основной запрос с подзапросом для использования алиасов в ORDER BY
        main_sql = base_cte + """
            SELECT sub.id, sub.title, sub.created_at, sub.updated_at,
                   sub.snippet, sub.rank_content, sub.sim_title
            FROM (
                SELECT a.id, a.title, a.created_at, a.updated_at,
                       ts_headline(:config, aft.text, plainto_tsquery(:config, :q),
                                   'StartSel=<mark>, StopSel=</mark>, MaxWords=30, MinWords=15') as snippet,
                       ts_rank_cd(to_tsvector(:config, aft.text), plainto_tsquery(:config, :q)) as rank_content,
                       similarity(a.title, :q) as sim_title
                FROM articles a
                JOIN main_commits mc ON a.id = mc.article_id
                JOIN articles_full_text aft ON mc.head_commit_id = aft.commit_id
                WHERE a.status = 'published' AND {} 
            ) sub
            ORDER BY
                CASE
                    WHEN :fields = 'title' THEN sub.sim_title
                    WHEN :fields = 'content' THEN sub.rank_content
                    ELSE (sub.rank_content * 0.5 + sub.sim_title * 1.0)
                END DESC,
                sub.updated_at DESC
            OFFSET :offset LIMIT :limit
        """.format(where_cond)

        result = await self.db.execute(text(main_sql), params)
        rows = result.mappings().all()
        return total, [dict(row) for row in rows]