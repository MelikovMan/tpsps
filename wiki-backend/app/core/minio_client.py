from minio import Minio
from minio.error import S3Error
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class MinIOClient:
    """Клиент для работы с MinIO"""
    
    def __init__(self):
        self.client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )
        
    async def ensure_bucket_exists(self, bucket_name: str):
        """Создает bucket если он не существует"""
        try:
            if not self.client.bucket_exists(bucket_name):
                self.client.make_bucket(bucket_name)
                logger.info(f"Bucket '{bucket_name}' created successfully")
            return True
        except S3Error as e:
            logger.error(f"Error creating bucket '{bucket_name}': {e}")
            return False
    
    def upload_file(self, bucket_name: str, object_name: str, file_data, 
                   file_size: int, content_type: str):
        """Загружает файл в MinIO"""
        try:
            result = self.client.put_object(
                bucket_name=bucket_name,
                object_name=object_name,
                data=file_data,
                length=file_size,
                content_type=content_type
            )
            return result
        except S3Error as e:
            logger.error(f"Error uploading file: {e}")
            raise
    
    def get_presigned_url(self, bucket_name: str, object_name: str, 
                         expires_in_seconds: int = 3600):
        """Получает временную ссылку для скачивания файла"""
        try:
            from datetime import timedelta
            url = self.client.presigned_get_object(
                bucket_name, 
                object_name, 
                expires=timedelta(seconds=expires_in_seconds)
            )
            return url
        except S3Error as e:
            logger.error(f"Error generating presigned URL: {e}")
            raise
    
    def delete_file(self, bucket_name: str, object_name: str):
        """Удаляет файл из MinIO"""
        try:
            self.client.remove_object(bucket_name, object_name)
            return True
        except S3Error as e:
            logger.error(f"Error deleting file: {e}")
            return False
    
    def file_exists(self, bucket_name: str, object_name: str):
        """Проверяет существование файла"""
        try:
            self.client.stat_object(bucket_name, object_name)
            return True
        except S3Error:
            return False

# Глобальный экземпляр клиента
minio_client = MinIOClient()