from pydantic import Field, field_validator, Json
from pydantic_settings import BaseSettings
from typing import List
import os
import json

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
    cors_origins: Json[List[str]] = Field(
      ["http://localhost:3000"],
        alias="CORS_ORIGINS",
    )
    
    # File Storage
    upload_folder: str = Field("./uploads", alias="UPLOAD_FOLDER")
    max_file_size: int = Field(10485760, alias="MAX_FILE_SIZE")

    ## Ya_storage_config
    YANDEX_STORAGE_ENDPOINT: str = Field("https://storage.yandexcloud.net", alias="YANDEX_STORAGE_ENDPOINT")
    YANDEX_STORAGE_ACCESS_KEY: str = Field(..., alias="YANDEX_STORAGE_ACCESS_KEY")
    YANDEX_STORAGE_SECRET_KEY: str = Field(..., alias="YANDEX_STORAGE_SECRET_KEY")
    YANDEX_STORAGE_BUCKET: str = Field("media-files", alias="YANDEX_STORAGE_BUCKET")
    YANDEX_STORAGE_REGION: str = Field("ru-central1-d", alias="YANDEX_STORAGE_REGION")


    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        extra = "ignore"


settings = Settings()