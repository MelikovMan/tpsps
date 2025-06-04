# app/schemas/__init__.py

# User schemas
from .user import (
    UserCreate, UserUpdate, UserResponse, 
    UserProfileCreate, UserProfileUpdate, UserProfileResponse,
    ProfileVersionResponse
)

# Auth schemas
from .auth import (
    LoginRequest, TokenData, LoginResponse, RegisterRequest
)

# Article schemas
from .article import (
    ArticleBase, ArticleCreate, ArticleUpdate, ArticleResponse, ArticleResponseOne,
    CommitBase, CommitCreate, CommitCreateInternal, CommitResponse, CommitResponseDetailed,
    BranchCreate, BranchCreateFromCommit, BranchUpdate, BranchResponse, BranchWithCommitCount,
    DiffResponse
)

# Branch tag schemas
from .branch_tag import (
    BranchTagBase, BranchTagCreate, BranchTagResponse,
    BranchTagPermissionBase, BranchTagPermissionCreate, BranchTagPermissionResponse,
    BranchAccessBase, BranchAccessCreate, BranchAccessResponse,
    BranchWithAccessInfo, BranchAccessCheck
)

# Category schemas
from .category import (
    CategoryBase, CategoryCreate, CategoryUpdate, CategoryResponse
)

# Comment schemas
from .comment import (
    CommentBase, CommentCreate, CommentUpdate, CommentResponse
)

# Media schemas
from .media import (
    MediaBase, MediaCreate, MediaUpdate, MediaResponse, MediaUploadResponse
)

# Moderation schemas
from .moderation import (
    ModerationBase, ModerationCreate, ModerationUpdate, ModerationResponse
)

# Permission schemas
from .permission import (
    PermissionBase, UserPermissionsResponse, PermissionCreate, 
    PermissionUpdate, PermissionResponse
)

# Tag schemas
from .tag import (
    TagBase, TagCreate, TagResponse,
    TagPermissionBase, TagPermissionCreate, TagPermissionResponse
)

# Template schemas
from .template import (
    TemplateBase, TemplateCreate, TemplateUpdate, TemplateResponse
)

__all__ = [
    # User schemas
    "UserCreate", "UserUpdate", "UserResponse", 
    "UserProfileCreate", "UserProfileUpdate", "UserProfileResponse",
    "ProfileVersionResponse",
    
    # Auth schemas
    "LoginRequest", "TokenData", "LoginResponse", "RegisterRequest",
    
    # Article schemas
    "ArticleBase", "ArticleCreate", "ArticleUpdate", "ArticleResponse", "ArticleResponseOne",
    "CommitBase", "CommitCreate", "CommitCreateInternal", "CommitResponse", "CommitResponseDetailed",
    "BranchCreate", "BranchCreateFromCommit", "BranchUpdate", "BranchResponse", "BranchWithCommitCount",
    "DiffResponse",
    
    # Branch tag schemas
    "BranchTagBase", "BranchTagCreate", "BranchTagResponse",
    "BranchTagPermissionBase", "BranchTagPermissionCreate", "BranchTagPermissionResponse",
    "BranchAccessBase", "BranchAccessCreate", "BranchAccessResponse",
    "BranchWithAccessInfo", "BranchAccessCheck",
    
    # Category schemas
    "CategoryBase", "CategoryCreate", "CategoryUpdate", "CategoryResponse",
    
    # Comment schemas
    "CommentBase", "CommentCreate", "CommentUpdate", "CommentResponse",
    
    # Media schemas
    "MediaBase", "MediaCreate", "MediaUpdate", "MediaResponse", "MediaUploadResponse",
    
    # Moderation schemas
    "ModerationBase", "ModerationCreate", "ModerationUpdate", "ModerationResponse",
    
    # Permission schemas
    "PermissionBase", "UserPermissionsResponse", "PermissionCreate", 
    "PermissionUpdate", "PermissionResponse",
    
    # Tag schemas
    "TagBase", "TagCreate", "TagResponse",
    "TagPermissionBase", "TagPermissionCreate", "TagPermissionResponse",
    
    # Template schemas
    "TemplateBase", "TemplateCreate", "TemplateUpdate", "TemplateResponse",
]