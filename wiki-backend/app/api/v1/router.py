# Update app/api/v1/router.py to include new endpoints
# app/api/v1/router.py
from fastapi import APIRouter
from app.api.v1 import (
    articles, auth, users, comments,
    tags, media, templates, moderation, permissions,
    branches, commits
)

api_router = APIRouter()

# Include all routers
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(articles.router, prefix="/articles", tags=["articles"])
#api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(comments.router, prefix="/comments", tags=["comments"])
api_router.include_router(tags.router, prefix="/tags", tags=["tags"])
api_router.include_router(media.router, prefix="/media", tags=["media"])
api_router.include_router(templates.router, prefix="/templates", tags=["templates"])
api_router.include_router(moderation.router, prefix="/moderation", tags=["moderation"])
api_router.include_router(permissions.router, prefix="/permissions", tags=["permissions"])
api_router.include_router(branches.router, prefix="/branches", tags=["branches"])
api_router.include_router(commits.router, prefix="/commits", tags=["commits"])

