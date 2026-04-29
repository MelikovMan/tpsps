from pydantic import Field, field_validator
from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Database
    vandalism_model_path: str = Field("final_model_best_deberta", alias="VANDALISM_MODEL_PATH")
    vandalism_repo_path: str = Field("MeLiRom/deberta-model-wiki-vandalism", alias = "VANDALISM_REPO_PATH")
    maxlen: int = Field(512,alias="MAXLEN")
    debug: bool = Field(True,alias = "DEBUG")
    


    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        extra = "ignore"


settings = Settings()