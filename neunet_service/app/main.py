from fastapi import FastAPI, logger, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.router.router import api_router
from app.config.config import settings

app = FastAPI(
    title="Wiki API Neunets",
    description="FastAPI Wiki Neunet sService",
    version="1.0.0",
    debug=settings.debug
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://127.0.0.1:8000"],
    allow_credentials=False,
    allow_methods=["POST"],
    allow_headers=["*"],
)


# API Router
app.include_router(api_router, prefix="/models")
router = APIRouter()
@app.get("/health")
async def health_check():
    return JSONResponse(content={"status": "healthy"})