import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class YandexStorageClient:
    """Client for Yandex Object Storage (S3 compatible)"""
    
    def __init__(self):
        self.client = boto3.client(
            's3',
            endpoint_url=settings.YANDEX_STORAGE_ENDPOINT,
            aws_access_key_id=settings.YANDEX_STORAGE_ACCESS_KEY,
            aws_secret_access_key=settings.YANDEX_STORAGE_SECRET_KEY,
            region_name=settings.YANDEX_STORAGE_REGION
        )
        self.default_bucket = settings.YANDEX_STORAGE_BUCKET
        
    async def ensure_bucket_exists(self, bucket_name: str = None):
        """Ensure bucket exists (Yandex Storage creates buckets differently)"""
        bucket = bucket_name or self.default_bucket
        try:
            self.client.head_bucket(Bucket=bucket)
            logger.info(f"Bucket '{bucket}' exists")
            return True
        except ClientError:
            logger.warning(f"Bucket '{bucket}' does not exist or is not accessible")
            # Note: In Yandex Cloud, buckets are typically created via the console/CLI
            return False
    
    def upload_file(self, bucket_name: str, object_name: str, file_data, 
                   content_type: str):
        """Upload file to Yandex Object Storage"""
        try:
            # If file_data is a file-like object, we need to read it
            if hasattr(file_data, 'read'):
                file_data = file_data.read()
            
            result = self.client.put_object(
                Bucket=bucket_name,
                Key=object_name,
                Body=file_data,
                ContentType=content_type
            )
            return result
        except ClientError as e:
            logger.error(f"Error uploading file to Yandex Storage: {e}")
            raise
    
    def get_presigned_url(self, bucket_name: str, object_name: str, 
                         expires_in_seconds: int = 3600):
        """Get presigned URL for downloading file"""
        try:
            url = self.client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': bucket_name,
                    'Key': object_name
                },
                ExpiresIn=expires_in_seconds
            )
            return url
        except ClientError as e:
            logger.error(f"Error generating presigned URL: {e}")
            raise
    
    def delete_file(self, bucket_name: str, object_name: str):
        """Delete file from Yandex Object Storage"""
        try:
            self.client.delete_object(Bucket=bucket_name, Key=object_name)
            return True
        except ClientError as e:
            logger.error(f"Error deleting file: {e}")
            return False
    
    def file_exists(self, bucket_name: str, object_name: str):
        """Check if file exists"""
        try:
            self.client.head_object(Bucket=bucket_name, Key=object_name)
            return True
        except ClientError:
            return False
    
    def get_public_url(self, bucket_name: str, object_name: str):
        """Get public URL for the file (if bucket is public)"""
        return f"https://{bucket_name}.storage.yandexcloud.net/{object_name}"

# Global instance
yandex_storage = YandexStorageClient()