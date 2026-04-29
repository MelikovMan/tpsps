from fastapi import APIRouter
from app.router import (
    vandalism
)

api_router = APIRouter()

# Include all routers
api_router.include_router(vandalism.router, prefix="/vandalism", tags=["vandalism"])