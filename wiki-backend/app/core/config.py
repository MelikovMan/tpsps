from pydantic import Field, field_validator
from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Database
    database_url: str = Field(..., alias="DATABASE_URL")
    database_url_sync: str = Field(..., alias="DATABASE_URL_SYNC")
    
    # Security
    secret_key: str = Field(..., alias="SECRET_KEY")
    algorithm: str = Field("HS256", alias="ALGORITHM")
    access_token_expire_minutes: int = Field(30, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # Redis
    redis_url: str = Field("redis://localhost:6379/0", alias="REDIS_URL")
    cache_expire:int = Field(30, alias="CACHE_EXPIRE")
    
    # Environment
    environment: str = Field("development", alias="ENVIRONMENT")
    debug: bool = Field(True, alias="DEBUG")
    
    # CORS
    cors_origins: List[str] = Field(
        ["http://localhost:3000"],
        alias="CORS_ORIGINS",
        json_schema_extra={"format": "json"}  # Указываем, что это JSON-строка
    )

    @field_validator("cors_origins", mode="before")
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return v.split(",")
        return v
    
    # File Storage
    upload_folder: str = Field("./uploads", alias="UPLOAD_FOLDER")
    max_file_size: int = Field(10485760, alias="MAX_FILE_SIZE")

    ## MinIO Configuration
    MINIO_ENDPOINT: str = Field("localhost:9000", alias="MINIO_ENDPOINT")
    MINIO_ACCESS_KEY: str = Field("minioadmin", alias="MINIO_ACCESS_KEY")
    MINIO_SECRET_KEY: str = Field("minioadmin", alias="MINIO_SECRET_KEY")
    MINIO_SECURE: bool = Field(False, alias="MINIO_SECURE")
    MINIO_DEFAULT_BUCKET: str = Field("media-files", alias="MINIO_DEFAULT_BUCKET")


    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        extra = "ignore"


settings = Settings()