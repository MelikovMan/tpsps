from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

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
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.on_event("startup")
async def startup_event():
    await init_redis_cache()
    
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