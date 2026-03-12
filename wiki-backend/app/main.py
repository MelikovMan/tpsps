from fastapi import FastAPI, logger
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from app.core.database import AsyncSessionLocal

from app.core.typesense_client import typesense_client
import typesense.exceptions

def ensure_typesense_collection():
    schema = {
        'name': 'articles',
        'fields': [
            {'name': 'id', 'type': 'string'},
            {'name': 'title', 'type': 'string'},
            {'name': 'content', 'type': 'string'},
            {'name': 'language', 'type': 'string', 'facet': True},
            {'name': 'created_at', 'type': 'int64'},
            {'name': 'updated_at', 'type': 'int64'},
        ],
        'default_sorting_field': 'updated_at'
    }

    try:
        typesense_client.collections.create(schema)
    except typesense.exceptions.ObjectAlreadyExists:
        # коллекция уже существует
        pass
async def check_database_connection():
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
            print("Database connection successful")
            return True
    except Exception as e:
        print(f"Database connection failed: {e}")
        return False
from app.core.config import settings
from app.core.cache import init_redis_cache
from app.api.v1.router import api_router
import os
app = FastAPI(
    title="Wiki API",
    description="FastAPI Wiki Backend",
    version="1.0.0",
    debug=settings.debug
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.on_event("startup")
async def startup_event():
    await init_redis_cache()
    success = await check_database_connection()
    print(f"Search engine is:{settings.SEARCH_ENGINE}")
    ensure_typesense_collection()
    if not success:
        raise Exception("Failed to connect to database")
    
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