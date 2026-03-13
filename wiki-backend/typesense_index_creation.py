import sys
import os
import time
from typing import Optional

# Добавляем путь к проекту для импорта настроек и моделей
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, select, and_
from sqlalchemy.orm import Session
import typesense
import typesense.exceptions
from langdetect import detect, LangDetectException

# Импортируем модели и настройки проекта
from app.core.config import settings
from app.models.article import Article, Branch, ArticleFull, Commit
from app.services.commit_service import CommitService

# Конфигурация Typesense из настроек (можно задать в .env)
TYPESENSE_HOST = getattr(settings, 'TYPESENSE_HOST', 'localhost')
TYPESENSE_PORT = getattr(settings, 'TYPESENSE_PORT', 8108)
TYPESENSE_API_KEY = getattr(settings, 'TYPESENSE_API_KEY', 'xyz123')
COLLECTION_NAME = 'articles'

# Инициализация клиента Typesense
typesense_client = typesense.Client({
    'nodes': [{
        'host': TYPESENSE_HOST,
        'port': TYPESENSE_PORT,
        'protocol': 'http',
    }],
    'api_key': TYPESENSE_API_KEY,
    'connection_timeout_seconds': 10
})

def ensure_collection():
    """Создаёт коллекцию в Typesense, если она ещё не существует."""
    schema = {
        'name': 'articles',
        'fields': [
            {'name': 'id', 'type': 'string'},
            {'name': 'title', 'type': 'string'},
            {'name': 'content', 'type': 'string'},
            {'name': 'language', 'type': 'string', 'facet': True},
            {'name': 'created_at', 'type': 'int64'},
            {'name': 'updated_at', 'type': 'int64'},
            {
                'name': 'embedding',
                'type': 'float[]',
                'embed': {
                    'from': ['title', 'content'],          # поля для генерации эмбеддинга
                    'model_config': {
                        'model_name': settings.TYPESENSE_EMBEDDING_MODEL
                    }
                }
            }
        ],
        'default_sorting_field': 'updated_at'
    }
    try:
        typesense_client.collections.create(schema)
        print(f"Коллекция '{COLLECTION_NAME}' создана.")
    except typesense.exceptions.ObjectAlreadyExists:
        print(f"Коллекция '{COLLECTION_NAME}' уже существует. Пересоздания")
        typesense_client.collections['articles'].delete()
        typesense_client.collections.create(schema)
    except Exception as e:
        print(f"Ошибка создания коллекции: {e}")
        sys.exit(1)

def detect_language(text: str) -> str:
    """Определяет язык текста (ru/en). Возвращает 'ru' или 'en', по умолчанию 'en'."""
    if not text:
        return 'en'
    try:
        lang = detect(text)
        if lang in ('ru', 'uk', 'be'):  # поддерживаем русский и близкие
            return 'ru'
        else:
            return 'en'
    except LangDetectException:
        return 'en'

def get_article_content(session: Session, article_id, commit_id) -> Optional[str]:
    """Получает полный текст статьи для указанного коммита."""
    # Сначала пробуем взять из articles_full_text
    full = session.execute(
        select(ArticleFull.text).where(
            and_(ArticleFull.article_id == article_id, ArticleFull.commit_id == commit_id)
        )
    ).scalar_one_or_none()
    if full:
        return full

    # Если нет, пересобираем через CommitService (синхронно)
    # Для этого нужен асинхронный сервис, поэтому проще сделать прямой запрос
    # Но CommitService использует async, поэтому мы не можем его вызвать здесь.
    # Вместо этого можно собрать цепочку коммитов вручную.
    # Для простоты пропускаем такие статьи (маловероятно, если база целостна)
    print(f"Предупреждение: полный текст для коммита {commit_id} не найден в articles_full_text")
    return None

def main():
    print("Начало индексации статей в Typesense...")
    ensure_collection()

    # Подключение к базе данных (синхронное)
    engine = create_engine(settings.database_url_sync, echo=False)
    with Session(engine) as session:
        # Получаем все статьи (или только опубликованные, по желанию)
        articles = session.execute(select(Article)).scalars().all()
        total = len(articles)
        print(f"Найдено статей: {total}")

        indexed = 0
        for article in articles:
            # Находим последний коммит в main ветке
            branch = session.execute(
                select(Branch).where(
                    and_(Branch.article_id == article.id, Branch.name == 'main')
                ).order_by(Branch.created_at.desc())
            ).scalar_one_or_none()
            if not branch:
                print(f"Статья {article.id} ({article.title}) не имеет main ветки, пропуск")
                continue

            commit_id = branch.head_commit_id
            content = get_article_content(session, article.id, commit_id)
            if content is None:
                # Пробуем пересобрать вручную (упрощённо)
                # Получаем все коммиты в порядке от первого к последнему
                # Это сложно делать здесь, поэтому лучше гарантировать наличие ArticleFull
                # Если нет, пропускаем
                print(f"Статья {article.id} ({article.title}) – нет полного текста, пропуск")
                continue

            # Определяем язык
            # Берём первые 1000 символов для определения (для скорости)
            sample = (article.title + " " + content)[:1000]
            language = detect_language(sample)

            # Подготавливаем документ
            document = {
                'id': str(article.id),
                'title': article.title,
                'content': content,
                'language': language,
                'created_at': int(article.created_at.timestamp()) if article.created_at else 0,
                'updated_at': int(article.updated_at.timestamp()) if article.updated_at else 0,
            }

            # Отправляем в Typesense (upsert)
            try:
                typesense_client.collections[COLLECTION_NAME].documents.upsert(document)
                indexed += 1
            except Exception as e:
                print(f"Ошибка индексации статьи {article.id}: {e}")

            if indexed % 10 == 0:
                print(f"Проиндексировано {indexed}/{total}")

        print(f"Индексация завершена. Проиндексировано статей: {indexed}")

if __name__ == "__main__":
    start = time.time()
    main()
    elapsed = time.time() - start
    print(f"Время выполнения: {elapsed:.2f} сек.")