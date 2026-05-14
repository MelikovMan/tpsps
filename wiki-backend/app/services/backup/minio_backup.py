import os
import shutil
from app.core.minio_client import minio_client
from app.core.config import settings

class MinioBackup:
    @staticmethod
    async def backup_bucket(bucket_name: str, local_dir: str) -> str:
        """Скачивает все объекты из бакета в локальную папку."""
        os.makedirs(local_dir, exist_ok=True)
        objects = minio_client.client.list_objects(bucket_name, recursive=True)
        count = 0
        for obj in objects:
            object_path = os.path.join(local_dir, obj.object_name)
            os.makedirs(os.path.dirname(object_path), exist_ok=True)
            minio_client.client.fget_object(bucket_name, obj.object_name, object_path)
            count += 1
        return local_dir

    @staticmethod
    async def restore_bucket(bucket_name: str, local_dir: str):
        """Восстанавливает бакет из локальной папки (сначала удаляет всё)."""
        # Удаляем все существующие объекты
        objects = minio_client.client.list_objects(bucket_name, recursive=True)
        for obj in objects:
            minio_client.client.remove_object(bucket_name, obj.object_name)
        # Загружаем новые
        for root, _, files in os.walk(local_dir):
            for file in files:
                local_path = os.path.join(root, file)
                object_name = os.path.relpath(local_path, local_dir)
                minio_client.client.fput_object(bucket_name, object_name, local_path)