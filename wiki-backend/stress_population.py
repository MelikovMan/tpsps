#!/usr/bin/env python3
"""
Скрипт для наполнения базы данных тестовыми статьями для нагрузочного тестирования
полнотекстового поиска. Генерирует статьи на русском и английском языках с небольшой
историей коммитов. Общий объём данных регулируется параметрами.
"""

import argparse
import random
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple

import faker
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Добавляем путь к проекту, чтобы импортировать модели и настройки
import sys
from pathlib import Path

# Предполагаем, что скрипт лежит в корне проекта или в отдельной папке
sys.path.append(str(Path(__file__).parent.parent))

from app.core.config import settings
from app.core.database import sync_engine
from app.models.article import Article, Commit, CommitParent, Branch, ArticleFull
from app.models.user import User
from app.models.permission import Permission

# Инициализация Faker для двух языков
fake_en = faker.Faker('en_US')
fake_ru = faker.Faker('ru_RU')

# Константы для оценки размера текста
AVG_CHARS_PER_KB = 1024  # Примерно 1024 символа на килобайт (в utf-8)
DEFAULT_COMMITS_PER_ARTICLE = 5
DEFAULT_KB_PER_COMMIT = 150  # средний размер полного текста одного коммита (КБ)

# Роли и права по умолчанию (как в seed_test_data.py)
DEFAULT_PERMISSIONS = [
    {'role': 'admin', 'can_edit': True, 'can_delete': True, 'can_moderate': True, 'bypass_tag_restrictions': True},
    {'role': 'editor', 'can_edit': True, 'can_delete': False, 'can_moderate': True, 'bypass_tag_restrictions': False},
    {'role': 'author', 'can_edit': True, 'can_delete': False, 'can_moderate': False, 'bypass_tag_restrictions': False},
    {'role': 'user', 'can_edit': True, 'can_delete': False, 'can_moderate': False, 'bypass_tag_restrictions': False},
    {'role': 'reader', 'can_edit': False, 'can_delete': False, 'can_moderate': False, 'bypass_tag_restrictions': False},
]

# Пользователи для генерации
USERS = [
    {'username': 'admin', 'email': 'admin@example.com', 'role': 'admin'},
    {'username': 'editor1', 'email': 'editor1@example.com', 'role': 'editor'},
    {'username': 'editor2', 'email': 'editor2@example.com', 'role': 'editor'},
    {'username': 'author1', 'email': 'author1@example.com', 'role': 'author'},
    {'username': 'author2', 'email': 'author2@example.com', 'role': 'author'},
    {'username': 'author3', 'email': 'author3@example.com', 'role': 'author'},
]


def generate_text(faker_instance, target_kb: int, use_markdown: bool = True) -> str:
    """
    Генерирует текст заданного размера (в килобайтах) с помощью Faker.
    Если use_markdown=True, добавляет Markdown-разметку (заголовки, списки).
    """
    target_chars = target_kb * AVG_CHARS_PER_KB
    paragraphs = []
    current_len = 0

    while current_len < target_chars:
        # Случайное количество предложений в абзаце
        nb_sentences = random.randint(3, 10)
        paragraph = faker_instance.paragraph(nb_sentences=nb_sentences)

        # Иногда добавляем заголовок перед абзацем (Markdown)
        if use_markdown and random.random() < 0.2:
            level = random.choice(['#', '##', '###'])
            title = faker_instance.sentence(nb_words=random.randint(3, 8)).rstrip('.')
            paragraphs.append(f"{level} {title}\n")
            current_len += len(title) + 4  # приблизительно

        paragraphs.append(paragraph)
        current_len += len(paragraph) + 2  # +2 за перевод строки

        # Добавляем пустую строку между абзацами
        if random.random() < 0.8:
            paragraphs.append("")
            current_len += 1

    # Обрезаем до точного размера (приблизительно)
    full_text = "\n\n".join(paragraphs)
    if len(full_text) > target_chars:
        full_text = full_text[:target_chars]
    return full_text


def generate_text_sequence(
    faker_instance,
    num_commits: int,
    min_kb: int = 50,
    max_kb: int = 300,
    growth_factor: float = 0.3,
) -> List[str]:
    """
    Генерирует последовательность текстов для коммитов.
    Первый текст имеет размер от min_kb до max_kb.
    Каждый следующий текст увеличивается на случайный процент (growth_factor)
    или изменяется незначительно (добавление/удаление).
    Возвращает список строк (полные тексты для каждого коммита).
    """
    texts = []
    current_size_kb = random.randint(min_kb, max_kb)
    current_text = generate_text(faker_instance, current_size_kb)

    for i in range(num_commits):
        if i == 0:
            texts.append(current_text)
        else:
            # С вероятностью 70% просто добавляем новый контент в конец
            if random.random() < 0.7:
                extra_kb = int(current_size_kb * growth_factor * random.uniform(0.5, 1.5))
                extra_text = generate_text(faker_instance, extra_kb, use_markdown=False)
                current_text = current_text + "\n\n" + extra_text
                current_size_kb += extra_kb
            # Иначе имитируем правку: заменяем случайный кусок
            else:
                # Вырезаем случайный блок и вставляем новый
                words = current_text.split()
                if len(words) > 50:
                    start = random.randint(0, len(words) - 50)
                    end = random.randint(start + 10, min(start + 200, len(words)))
                    new_block = generate_text(faker_instance, (end - start) // 10, use_markdown=False)
                    words[start:end] = new_block.split()
                    current_text = " ".join(words)
                    # Размер может немного измениться, пересчитывать не будем
            texts.append(current_text)
    return texts


def create_permissions(session):
    """Создаёт записи прав доступа, если их нет."""
    existing = session.execute(text("SELECT role FROM permissions")).fetchall()
    existing_roles = {row[0] for row in existing}
    for perm in DEFAULT_PERMISSIONS:
        if perm['role'] not in existing_roles:
            session.execute(
                text("""
                    INSERT INTO permissions (role, can_edit, can_delete, can_moderate, bypass_tag_restrictions)
                    VALUES (:role, :can_edit, :can_delete, :can_moderate, :bypass_tag_restrictions)
                """),
                perm
            )
    session.commit()


def create_users(session):
    """Создаёт тестовых пользователей, если их нет."""
    existing = session.execute(text("SELECT username FROM users")).fetchall()
    existing_users = {row[0] for row in existing}
    now = datetime.now(timezone.utc)
    password_hash = "$2b$12$dummyhashforloadtesting"  # не валидный, но для теста не важно
    for user in USERS:
        if user['username'] not in existing_users:
            user_id = uuid.uuid4()
            session.execute(
                text("""
                    INSERT INTO users (id, username, email, password_hash, role, created_at, last_login)
                    VALUES (:id, :username, :email, :password_hash, :role, :created_at, :last_login)
                """),
                {
                    'id': user_id,
                    'username': user['username'],
                    'email': user['email'],
                    'password_hash': password_hash,
                    'role': user['role'],
                    'created_at': now,
                    'last_login': now,
                }
            )
    session.commit()


def get_user_ids(session) -> List[uuid.UUID]:
    """Возвращает список UUID всех пользователей."""
    result = session.execute(text("SELECT id FROM users"))
    return [row[0] for row in result]


def estimate_articles_count(total_size_gb: float, commits_per_article: int, kb_per_commit: int) -> int:
    """
    Оценивает количество статей для достижения целевого объёма.
    Учитывает только полный текст статей (ArticleFull). Остальные таблицы дают небольшой оверхед.
    """
    total_kb = total_size_gb * 1024 * 1024
    kb_per_article = commits_per_article * kb_per_commit
    return int(total_kb // kb_per_article)


def main():
    parser = argparse.ArgumentParser(description="Наполнение БД тестовыми статьями для нагрузочного тестирования")
    parser.add_argument('--total-size-gb', type=float, default=2.0,
                        help='Целевой объём данных в ГБ (приблизительно). Используется, если не указано --articles')
    parser.add_argument('--articles', type=int, default=None,
                        help='Точное количество статей. Если не указано, вычисляется из total-size-gb')
    parser.add_argument('--commits-per-article', type=int, default=DEFAULT_COMMITS_PER_ARTICLE,
                        help='Среднее количество коммитов на статью')
    parser.add_argument('--lang-ratio', type=float, default=0.5,
                        help='Доля статей на русском языке (0-1)')
    parser.add_argument('--batch-size', type=int, default=100,
                        help='Размер пачки статей для коммита транзакции')
    parser.add_argument('--truncate', action='store_true',
                        help='Очистить существующие данные перед заполнением')
    parser.add_argument('--min-text-kb', type=int, default=50,
                        help='Минимальный размер текста первого коммита (КБ)')
    parser.add_argument('--max-text-kb', type=int, default=300,
                        help='Максимальный размер текста первого коммита (КБ)')
    args = parser.parse_args()

    # Оценка количества статей
    if args.articles is None:
        articles_count = estimate_articles_count(
            args.total_size_gb,
            args.commits_per_article,
            (args.min_text_kb + args.max_text_kb) // 2
        )
        print(f"Целевой объём: {args.total_size_gb} ГБ, оценочное количество статей: {articles_count}")
    else:
        articles_count = args.articles
        print(f"Задано точное количество статей: {articles_count}")

    # Подключение к БД
    Session = sessionmaker(bind=sync_engine)
    session = Session()

    try:
        if args.truncate:
            print("Очистка существующих данных...")
            # Отключаем проверку внешних ключей для ускорения (PostgreSQL)
            session.execute(text("SET session_replication_role = 'replica';"))
            tables = [
                'articles_full_text',
                'commit_parents',
                'branches',
                'commits',
                'articles',
                'users',
                'permissions',
            ]
            for table in tables:
                session.execute(text(f"TRUNCATE TABLE {table} CASCADE;"))
            session.execute(text("SET session_replication_role = 'origin';"))
            session.commit()
            print("Очистка завершена.")
            create_permissions(session)
            create_users(session)


        # Создаём справочные данные


        user_ids = get_user_ids(session)
        if not user_ids:
            print("Нет пользователей! Прерывание.")
            return
        print(f"Доступно пользователей: {len(user_ids)}")

        # Подготовка статистики
        total_commits = 0
        total_articles_done = 0
        batch_objects = []

        # Основной цикл генерации статей
        from tqdm import tqdm

        pbar = tqdm(total=articles_count, desc="Генерация статей")
        for article_idx in range(1, articles_count + 1):
            # Определяем язык статьи
            use_russian = random.random() < args.lang_ratio
            faker_inst = fake_ru if use_russian else fake_en

            # Генерируем заголовок
            title = faker_inst.sentence(nb_words=random.randint(4, 10)).rstrip('.')

            # Создаём статью
            article_id = uuid.uuid4()
            now = datetime.now(timezone.utc)
            article = Article(
                id=article_id,
                title=title,
                status=random.choice(['draft', 'published', 'review']),
                article_type=random.choice(['article', 'tutorial', 'guide']),
                created_at=now,
                updated_at=now,
            )
            batch_objects.append(article)

            # Генерируем тексты для коммитов
            num_commits = args.commits_per_article
            texts = generate_text_sequence(
                faker_inst,
                num_commits,
                min_kb=args.min_text_kb,
                max_kb=args.max_text_kb
            )

            # Автор для коммитов (случайный пользователь)
            author_id = random.choice(user_ids)

            # Создаём главную ветку
            branch_id = uuid.uuid4()
            # head_commit_id заполним позже
            branch = Branch(
                id=branch_id,
                article_id=article_id,
                name="main",
                description="Main branch",
                head_commit_id=None,  # временно
                is_protected=True,
                is_private=False,
                created_by=author_id,
                created_at=now,
                updated_at=now,
            )
            batch_objects.append(branch)

            prev_commit_id = None
            for commit_idx, full_text in enumerate(texts):
                commit_id = uuid.uuid4()
                # Для первого коммита content_diff = полный текст
                if commit_idx == 0:
                    content_diff = full_text
                else:
                    # Генерируем diff между предыдущим и текущим текстом
                    prev_text = texts[commit_idx - 1]
                    # Используем difflib для создания unified diff
                    import difflib
                    diff = difflib.unified_diff(
                        prev_text.splitlines(keepends=True),
                        full_text.splitlines(keepends=True),
                        fromfile=f"commit_{prev_commit_id}",
                        tofile=f"commit_{commit_id}",
                        lineterm=""
                    )
                    content_diff = "".join(diff)

                commit = Commit(
                    id=commit_id,
                    article_id=article_id,
                    author_id=author_id,
                    message=f"Commit {commit_idx+1}: {faker_inst.sentence()}",
                    content_diff=content_diff,
                    created_at=now,
                    is_merge=False,
                )
                batch_objects.append(commit)

                # Связь с родителем
                if prev_commit_id is not None:
                    parent = CommitParent(
                        commit_id=commit_id,
                        parent_id=prev_commit_id
                    )
                    batch_objects.append(parent)

                # Полный текст для быстрого доступа
                full_entry = ArticleFull(
                    article_id=article_id,
                    commit_id=commit_id,
                    text=full_text
                )
                batch_objects.append(full_entry)

                prev_commit_id = commit_id
                total_commits += 1

            # Обновляем head_commit_id ветки
            branch.head_commit_id = prev_commit_id

            # Обновляем current_commit_id статьи
            article.current_commit_id = prev_commit_id

            # Каждые batch_size статей сбрасываем в БД
            if article_idx % args.batch_size == 0 or article_idx == articles_count:
                try:
                    session.add_all(batch_objects)
                    session.commit()
                    # Очищаем память
                    batch_objects.clear()
                    session.expunge_all()
                except Exception as e:
                    session.rollback()
                    print(f"\nОшибка вставки на статье {article_idx}: {e}")
                    raise

            total_articles_done = article_idx
            pbar.update(1)

        pbar.close()

        print(f"\nГенерация завершена. Создано статей: {total_articles_done}, коммитов: {total_commits}")

        # Подсчёт реального объёма данных
        result = session.execute(text("""
            SELECT pg_total_relation_size('articles') +
                   pg_total_relation_size('commits') +
                   pg_total_relation_size('branches') +
                   pg_total_relation_size('articles_full_text') +
                   pg_total_relation_size('commit_parents') AS total_bytes
        """))
        total_bytes = result.scalar()
        print(f"Общий объём данных в указанных таблицах: {total_bytes / (1024**3):.2f} ГБ")

    finally:
        session.close()


if __name__ == "__main__":
    main()