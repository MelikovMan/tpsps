Локальное развертывание FastAPI проекта в VS Code
1. Создание структуры проекта
bash
mkdir wiki-backend
cd wiki-backend

# Создание структуры папок
mkdir -p app/{api/v1,core,models,schemas,services,utils}
mkdir -p tests/{api,models,services}
mkdir -p alembic/versions
mkdir scripts
2. Настройка Python окружения
Создание виртуального окружения
bash
# Python 3.9+
python -m venv venv

# Активация (Windows)
venv\Scripts\activate

# Активация (macOS/Linux)
source venv/bin/activate
Установка зависимостей
Создайте requirements.txt:

txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
asyncpg==0.29.0
alembic==1.12.1
pydantic==2.5.0
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
aiofiles==23.2.1
redis==5.0.1
celery==5.3.4
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.2
python-dotenv==1.0.0
bash
pip install -r requirements.txt
3. Настройка VS Code
.vscode/settings.json
json
{
    "python.defaultInterpreterPath": "./venv/bin/python",
    "python.linting.enabled": true,
    "python.linting.flake8Enabled": true,
    "python.formatting.provider": "black",
    "python.formatting.blackArgs": ["--line-length", "88"],
    "python.sortImports.args": ["--profile", "black"],
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.organizeImports": true
    },
    "files.exclude": {
        "**/__pycache__": true,
        "**/*.pyc": true,
        "**/.pytest_cache": true
    },
    "python.testing.pytestEnabled": true,
    "python.testing.pytestArgs": ["tests/"],
    "python.envFile": "${workspaceFolder}/.env"
}
.vscode/launch.json
json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "FastAPI Dev Server",
            "type": "python",
            "request": "launch",
            "program": "${workspaceFolder}/main.py",
            "console": "integratedTerminal",
            "args": [],
            "env": {
                "PYTHONPATH": "${workspaceFolder}",
                "ENVIRONMENT": "development"
            },
            "autoReload": {
                "enable": true
            }
        },
        {
            "name": "FastAPI with Uvicorn",
            "type": "python",
            "request": "launch",
            "module": "uvicorn",
            "args": [
                "app.main:app",
                "--reload",
                "--host", "0.0.0.0",
                "--port", "8000"
            ],
            "console": "integratedTerminal",
            "env": {
                "PYTHONPATH": "${workspaceFolder}"
            }
        }
    ]
}
.vscode/tasks.json
json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Run FastAPI Dev Server",
            "type": "shell",
            "command": "${workspaceFolder}/venv/bin/python",
            "args": ["-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0"],
            "group": {
                "kind": "build",
                "isDefault": true
            },
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared"
            },
            "problemMatcher": []
        },
        {
            "label": "Run Tests",
            "type": "shell",
            "command": "${workspaceFolder}/venv/bin/python",
            "args": ["-m", "pytest", "tests/", "-v"],
            "group": "test",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared"
            }
        },
        {
            "label": "Alembic Migrate",
            "type": "shell",
            "command": "${workspaceFolder}/venv/bin/python",
            "args": ["-m", "alembic", "upgrade", "head"],
            "group": "build"
        }
    ]
}
4. Конфигурация приложения
.env файл
env
# Database
DATABASE_URL=postgresql+asyncpg://wiki_user:wiki_password@localhost:5432/wiki_db
DATABASE_URL_SYNC=postgresql://wiki_user:wiki_password@localhost:5432/wiki_db

# Security
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Redis
REDIS_URL=redis://localhost:6379/0

# Environment
ENVIRONMENT=development
DEBUG=True

# CORS
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# File Storage
UPLOAD_FOLDER=./uploads
MAX_FILE_SIZE=10485760  # 10MB
app/core/config.py
python
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Database
    database_url: str
    database_url_sync: str
    
    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # Environment
    environment: str = "development"
    debug: bool = True
    
    # CORS
    cors_origins: List[str] = ["http://localhost:3000"]
    
    # File Storage
    upload_folder: str = "./uploads"
    max_file_size: int = 10485760
    
    class Config:
        env_file = ".env"

settings = Settings()
5. Docker для локальной разработки
docker-compose.dev.yml
yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: wiki_db
      POSTGRES_USER: wiki_user
      POSTGRES_PASSWORD: wiki_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U wiki_user -d wiki_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  minio_data:
scripts/init.sql
sql
-- Создание расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";

-- Создание индексов для полнотекстового поиска
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
6. Основные файлы приложения
Создание init.py файлов
Сначала создайте пустые __init__.py файлы:

bash
touch app/__init__.py
touch app/api/__init__.py
touch app/api/v1/__init__.py
touch app/core/__init__.py
touch app/models/__init__.py
touch app/schemas/__init__.py
touch app/services/__init__.py
touch app/utils/__init__.py
main.py (в корне проекта)
python
import uvicorn
from app.main import app

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
app/main.py
python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.api.v1.router import api_router

app = FastAPI(
    title="Wiki API",
    description="FastAPI Wiki Backend",
    version="1.0.0",
    debug=settings.debug
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create static directory if it doesn't exist
if not os.path.exists("static"):
    os.makedirs("static")

# Static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# API Router
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Wiki API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
app/api/v1/router.py
python
from fastapi import APIRouter
from app.api.v1 import articles, auth, users

api_router = APIRouter()

# Include sub-routers
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(articles.router, prefix="/articles", tags=["articles"])
app/api/v1/auth.py
python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    # TODO: Implement actual authentication
    if request.username == "admin" and request.password == "admin":
        return LoginResponse(access_token="fake-token")
    raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/logout")
async def logout():
    return {"message": "Logged out successfully"}
app/api/v1/users.py
python
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from uuid import UUID, uuid4

router = APIRouter()

class User(BaseModel):
    id: UUID
    username: str
    email: str
    role: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

@router.get("/", response_model=List[User])
async def get_users():
    # TODO: Implement actual user fetching
    return [
        User(id=uuid4(), username="admin", email="admin@example.com", role="admin"),
        User(id=uuid4(), username="user", email="user@example.com", role="user")
    ]

@router.post("/", response_model=User)
async def create_user(user: UserCreate):
    # TODO: Implement actual user creation
    return User(
        id=uuid4(),
        username=user.username,
        email=user.email,
        role="user"
    )

@router.get("/{user_id}", response_model=User)
async def get_user(user_id: UUID):
    # TODO: Implement actual user fetching
    return User(
        id=user_id,
        username="example_user",
        email="user@example.com",
        role="user"
    )
app/api/v1/articles.py
python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime

router = APIRouter()

class Article(BaseModel):
    id: UUID
    title: str
    content: str
    status: str
    created_at: datetime
    updated_at: datetime

class ArticleCreate(BaseModel):
    title: str
    content: str

class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

@router.get("/", response_model=List[Article])
async def get_articles():
    # TODO: Implement actual article fetching
    return [
        Article(
            id=uuid4(),
            title="Welcome to Wiki",
            content="This is the main page of our wiki.",
            status="published",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    ]

@router.post("/", response_model=Article)
async def create_article(article: ArticleCreate):
    # TODO: Implement actual article creation
    now = datetime.now()
    return Article(
        id=uuid4(),
        title=article.title,
        content=article.content,
        status="draft",
        created_at=now,
        updated_at=now
    )

@router.get("/{article_id}", response_model=Article)
async def get_article(article_id: UUID):
    # TODO: Implement actual article fetching
    return Article(
        id=article_id,
        title="Sample Article",
        content="This is a sample article content.",
        status="published",
        created_at=datetime.now(),
        updated_at=datetime.now()
    )

@router.put("/{article_id}", response_model=Article)
async def update_article(article_id: UUID, article: ArticleUpdate):
    # TODO: Implement actual article updating
    return Article(
        id=article_id,
        title=article.title or "Updated Article",
        content=article.content or "Updated content",
        status="published",
        created_at=datetime.now(),
        updated_at=datetime.now()
    )

@router.delete("/{article_id}")
async def delete_article(article_id: UUID):
    # TODO: Implement actual article deletion
    return {"message": f"Article {article_id} deleted successfully"}
7. Команды для запуска
Makefile
makefile
.PHONY: install dev test clean docker-up docker-down migrate

install:
	pip install -r requirements.txt

dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

test:
	pytest tests/ -v

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

docker-up:
	docker-compose -f docker-compose.dev.yml up -d

docker-down:
	docker-compose -f docker-compose.dev.yml down

migrate:
	alembic upgrade head

create-migration:
	alembic revision --autogenerate -m "$(name)"

format:
	black app/ tests/
	isort app/ tests/

lint:
	flake8 app/ tests/
	mypy app/
8. Запуск проекта
Пошаговый запуск:
Запуск Docker сервисов:
bash
make docker-up
# или
docker-compose -f docker-compose.dev.yml up -d
Применение миграций:
bash
make migrate
# или
alembic upgrade head
Запуск FastAPI сервера:
bash
make dev
# или
uvicorn app.main:app --reload
В VS Code: Нажмите F5 или используйте конфигурацию "FastAPI Dev Server"
Доступные URL:
API: http://localhost:8000
Swagger UI: http://localhost:8000/docs
ReDoc: http://localhost:8000/redoc
PostgreSQL: localhost:5432
Redis: localhost:6379
MinIO: http://localhost:9001
9. Полезные VS Code команды
Ctrl+Shift+P → "Python: Select Interpreter" → выберите venv
Ctrl+Shift+P → "Tasks: Run Task" → "Run FastAPI Dev Server"
Ctrl+Shift+P → "Python: Run Tests"
F5 → Запуск с отладкой
10. Файлы для игнорирования
.gitignore
gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
env.bak/
venv.bak/

# IDE
.vscode/
.idea/

# Environment variables
.env

# Database
*.db
*.sqlite3

# Logs
*.log

# Uploads
uploads/
static/uploads/

# Tests
.pytest_cache/
.coverage
htmlcov/
Теперь у вас есть полная настройка для локальной разработки FastAPI проекта в VS Code!

