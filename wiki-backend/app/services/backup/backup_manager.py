# app/services/backup/backup_manager.py
import os
import tarfile
import datetime
import shutil
from typing import List, Dict

from app.core.config import settings
from app.core.minio_client import minio_client
from app.core.maintenance import set_maintenance_mode
from app.services.backup.postgres_backup import PostgresBackup
from app.services.backup.minio_backup import MinioBackup
from app.services.typesense_sync_worker import worker_instance, TypesenseSyncWorker
from fastapi_cache import FastAPICache


# app/api/deps.py
from typing import AsyncGenerator
from fastapi import Depends
from app.tasks.worker import worker
from streaq import Worker

async def get_worker() -> AsyncGenerator[Worker, None]:
    async with worker:
        yield worker


class BackupManager:
    TEMP_DIR = settings.BACKUP_TEMP_DIR
    BACKUP_BUCKET = settings.BACKUP_BUCKET

    @classmethod
    async def create_backup(cls) -> str:
        """Создаёт полную резервную копию и загружает в MinIO."""
        timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        backup_id = f"backup_{timestamp}"
        work_dir = os.path.join(cls.TEMP_DIR, backup_id)
        os.makedirs(work_dir, exist_ok=True)

        try:
            dump_file = os.path.join(work_dir, "database.dump")
            await PostgresBackup.create_dump(dump_file)

            buckets_to_backup = [settings.MINIO_DEFAULT_BUCKET]
            for bucket in buckets_to_backup:
                bucket_dir = os.path.join(work_dir, "minio", bucket)
                await MinioBackup.backup_bucket(bucket, bucket_dir)

            archive_name = f"{backup_id}.tar.gz"
            archive_path = os.path.join(cls.TEMP_DIR, archive_name)
            with tarfile.open(archive_path, "w:gz") as tar:
                tar.add(work_dir, arcname=backup_id)

            await minio_client.ensure_bucket_exists(cls.BACKUP_BUCKET)
            minio_client.client.fput_object(cls.BACKUP_BUCKET, archive_name, archive_path)

            shutil.rmtree(work_dir)
            os.remove(archive_path)

            await cls._cleanup_old_backups()
            return archive_name
        except Exception as e:
            if os.path.exists(work_dir):
                shutil.rmtree(work_dir)
            raise e

    @classmethod
    async def restore_backup(cls, backup_id: str):
        """
        Восстанавливает систему из резервной копии.
        Во время восстановления включает maintenance mode, чтобы заблокировать изменения.
        """
        # Включаем режим обслуживания
        set_maintenance_mode(True)
        try:
            archive_name = f"{backup_id}.tar.gz"
            local_archive = os.path.join(cls.TEMP_DIR, archive_name)

            # Скачиваем архив
            minio_client.client.fget_object(cls.BACKUP_BUCKET, archive_name, local_archive)

            # Распаковываем
            extract_dir = os.path.join(cls.TEMP_DIR, f"restore_{backup_id}")
            with tarfile.open(local_archive, "r:gz") as tar:
                tar.extractall(extract_dir)

            # Восстанавливаем БД
            dump_file = os.path.join(extract_dir, backup_id, "database.dump")
            await PostgresBackup.restore_dump(dump_file)

            # Восстанавливаем MinIO бакеты
            minio_backup_dir = os.path.join(extract_dir, backup_id, "minio")
            if os.path.exists(minio_backup_dir):
                for bucket in os.listdir(minio_backup_dir):
                    bucket_path = os.path.join(minio_backup_dir, bucket)
                    await MinioBackup.restore_bucket(bucket, bucket_path)

            # Очистка временных файлов
            shutil.rmtree(extract_dir)
            os.remove(local_archive)

            # --- Восстановление поискового индекса и кэша ---
            # 1. Полная переиндексация Typesense
            if worker_instance:
                await worker_instance.reindex_all()
            else:
                # fallback – создаём временный воркер
                temp_worker = TypesenseSyncWorker()
                await temp_worker.reindex_all()

            # 2. Очистка Redis кэша
            from app.core.cache import init_redis_cache
            await init_redis_cache()
            await FastAPICache.clear()

            # Выключаем режим обслуживания
            set_maintenance_mode(False)

        except Exception as e:
            set_maintenance_mode(False)
            raise e

    @classmethod
    async def list_backups(cls) -> List[Dict]:
        backups = []
        try:
            objects = minio_client.client.list_objects(cls.BACKUP_BUCKET, recursive=False)
            for obj in objects:
                backups.append({
                    "backup_id": obj.object_name.replace(".tar.gz", ""),
                    "filename": obj.object_name,
                    "size": obj.size,
                    "last_modified": obj.last_modified.isoformat()
                })
            backups.sort(key=lambda x: x["last_modified"], reverse=True)
        except Exception:
            pass
        return backups

    @classmethod
    async def _cleanup_old_backups(cls):
        cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=settings.BACKUP_RETENTION_DAYS)
        objects = minio_client.client.list_objects(cls.BACKUP_BUCKET, recursive=False)
        for obj in objects:
            if obj.last_modified.replace(tzinfo=None) < cutoff:
                minio_client.client.remove_object(cls.BACKUP_BUCKET, obj.object_name)