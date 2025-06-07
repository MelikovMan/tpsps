from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select, delete
from sqlalchemy.orm import selectinload
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_active_user, get_password_hash, require_permission
from app.models.user import User, UserProfile, ProfileVersion
from app.schemas.user import (
    UserResponse, UserCreate, UserUpdate,
    UserProfileResponse, UserProfileCreate, UserProfileUpdate,
    ProfileVersionResponse
)

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("moderate"))
):
    result = await db.execute(
        select(User).offset(skip).limit(limit)
    )
    users = result.scalars().all()
    return [UserResponse.model_validate(user) for user in users]

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    return UserResponse.model_validate(current_user)

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse.model_validate(user)

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    update_data = user_update.model_dump(exclude_unset=True)
    
    if "password" in update_data:
        update_data["password_hash"] = get_password_hash(update_data.pop("password"))
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    await db.commit()
    await db.refresh(current_user)
    
    return UserResponse.model_validate(current_user)

@router.delete("/me")
async def delete_current_user(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Удаление текущего пользователя и всех связанных данных"""
    # Удаляем профиль пользователя (если существует)
    await db.execute(
        delete(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    
    # Удаляем версии профиля
    await db.execute(
        delete(ProfileVersion).where(ProfileVersion.user_id == current_user.id)
    )
    
    # Удаляем самого пользователя
    await db.delete(current_user)
    await db.commit()
    
    return {"message": "User deleted successfully"}

@router.delete("/{user_id}")
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("moderate"))
):
    """Удаление пользователя модератором"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Удаляем профиль пользователя (если существует)
    await db.execute(
        delete(UserProfile).where(UserProfile.user_id == user_id)
    )
    
    # Удаляем версии профиля
    await db.execute(
        delete(ProfileVersion).where(ProfileVersion.user_id == user_id)
    )
    
    # Удаляем самого пользователя
    await db.delete(user)
    await db.commit()
    
    return {"message": f"User {user.username} deleted successfully"}

# Эндпоинты для работы с профилем
@router.get("/{user_id}/profile", response_model=UserProfileResponse)
async def get_user_profile(
    user_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(UserProfile).options(selectinload(UserProfile.user))
        .where(UserProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    return UserProfileResponse.model_validate(profile)

@router.get("/me/profile", response_model=UserProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение профиля текущего пользователя"""
    result = await db.execute(
        select(UserProfile).options(selectinload(UserProfile.user))
        .where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    return UserProfileResponse.model_validate(profile)

@router.post("/me/profile", response_model=UserProfileResponse)
async def create_user_profile(
    profile_data: UserProfileCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Создание профиля пользователя"""
    # Проверяем, существует ли уже профиль
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    existing_profile = result.scalar_one_or_none()
    
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User profile already exists"
        )
    
    profile = UserProfile(
        user_id=current_user.id,
        **profile_data.model_dump()
    )
    
    db.add(profile)
    
    # Создаем версию профиля для истории изменений
    profile_version = ProfileVersion(
        user_id=current_user.id,
        content=profile_data.model_dump()
    )
    db.add(profile_version)
    
    await db.commit()
    await db.refresh(profile)
    
    return UserProfileResponse.model_validate(profile)

@router.put("/me/profile", response_model=UserProfileResponse)
async def update_user_profile(
    profile_update: UserProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновление профиля пользователя"""
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    update_data = profile_update.model_dump(exclude_unset=True)
    
    # Сохраняем версию профиля перед обновлением
    current_profile_data = {
        "bio": profile.bio,
        "avatar_url": profile.avatar_url,
        "social_links": profile.social_links
    }
    
    profile_version = ProfileVersion(
        user_id=current_user.id,
        content=current_profile_data
    )
    db.add(profile_version)
    
    # Обновляем профиль
    for field, value in update_data.items():
        setattr(profile, field, value)
    
    await db.commit()
    await db.refresh(profile)
    
    return UserProfileResponse.model_validate(profile)

@router.delete("/me/profile")
async def delete_user_profile(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Удаление профиля пользователя"""
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    # Удаляем версии профиля
    await db.execute(
        delete(ProfileVersion).where(ProfileVersion.user_id == current_user.id)
    )
    
    # Удаляем профиль
    await db.delete(profile)
    await db.commit()
    
    return {"message": "User profile deleted successfully"}

@router.put("/{user_id}/profile", response_model=UserProfileResponse)
async def update_user_profile_by_moderator(
    user_id: UUID,
    profile_update: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("moderate"))
):
    """Обновление профиля пользователя модератором"""
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    update_data = profile_update.model_dump(exclude_unset=True)
    
    # Сохраняем версию профиля перед обновлением
    current_profile_data = {
        "bio": profile.bio,
        "avatar_url": profile.avatar_url,
        "social_links": profile.social_links
    }
    
    profile_version = ProfileVersion(
        user_id=user_id,
        content=current_profile_data
    )
    db.add(profile_version)
    
    # Обновляем профиль
    for field, value in update_data.items():
        setattr(profile, field, value)
    
    await db.commit()
    await db.refresh(profile)
    
    return UserProfileResponse.model_validate(profile)

@router.delete("/{user_id}/profile")
async def delete_user_profile_by_moderator(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("moderate"))
):
    """Удаление профиля пользователя модератором"""
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    # Удаляем версии профиля
    await db.execute(
        delete(ProfileVersion).where(ProfileVersion.user_id == user_id)
    )
    
    # Удаляем профиль
    await db.delete(profile)
    await db.commit()
    
    return {"message": "User profile deleted successfully"}

# Эндпоинты для работы с версиями профиля
@router.get("/me/profile/versions", response_model=List[ProfileVersionResponse])
async def get_my_profile_versions(
    skip: int = 0,
    limit: int = 10,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение истории изменений профиля текущего пользователя"""
    result = await db.execute(
        select(ProfileVersion)
        .where(ProfileVersion.user_id == current_user.id)
        .order_by(ProfileVersion.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    versions = result.scalars().all()
    
    return [ProfileVersionResponse.model_validate(version) for version in versions]

@router.get("/{user_id}/profile/versions", response_model=List[ProfileVersionResponse])
async def get_user_profile_versions(
    user_id: UUID,
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("moderate"))
):
    """Получение истории изменений профиля пользователя (для модераторов)"""
    result = await db.execute(
        select(ProfileVersion)
        .where(ProfileVersion.user_id == user_id)
        .order_by(ProfileVersion.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    versions = result.scalars().all()
    
    return [ProfileVersionResponse.model_validate(version) for version in versions]

# Эндпоинт для получения разрешений пользователя
from app.schemas.permission import PermissionResponse
from app.models.permission import Permission

@router.get("/me/permissions", response_model=PermissionResponse)
async def get_my_permissions(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение разрешений текущего пользователя"""
    result = await db.execute(
        select(Permission).where(Permission.role == current_user.role)
    )
    permission = result.scalar_one_or_none()
    
    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permissions for your role not found"
        )
    
    return PermissionResponse.model_validate(permission)
@router.post("/", response_model=UserResponse)
async def create_user_by_admin(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("delete"))  # Только админы могут создавать пользователей
):
    """Создание пользователя администратором"""
    # Проверяем, не существует ли уже пользователь с таким email или username
    result = await db.execute(
        select(User).where(
            (User.email == user_data.email) | (User.username == user_data.username)
        )
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        if existing_user.email == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this username already exists"
            )
    
    # Создаем нового пользователя
    user = User(
        username=user_data.username,
        email=user_data.email,
        role=user_data.role,
        password_hash=get_password_hash(user_data.password)
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return UserResponse.model_validate(user)

@router.put("/{user_id}", response_model=UserResponse)
async def update_user_by_admin(
    user_id: UUID,
    user_update: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("delete"))  # Только админы могут обновлять любых пользователей
):
    """Обновление пользователя администратором"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    update_data = user_update.model_dump(exclude_unset=True)
    
    # Проверяем уникальность email и username при обновлении
    if "email" in update_data:
        result = await db.execute(
            select(User).where(User.email == update_data["email"], User.id != user_id)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
    
    if "username" in update_data:
        result = await db.execute(
            select(User).where(User.username == update_data["username"], User.id != user_id)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this username already exists"
            )
    
    if "password" in update_data:
        update_data["password_hash"] = get_password_hash(update_data.pop("password"))
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    await db.commit()
    await db.refresh(user)
    
    return UserResponse.model_validate(user)

# Также добавить эндпоинт для поиска пользователей
@router.get("/search", response_model=List[UserResponse])
async def search_users(
    q: Optional[str] = None,
    role: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("moderate"))
):
    """Поиск пользователей с фильтрами"""
    query = select(User)
    
    if q:
        query = query.where(
            (User.username.ilike(f"%{q}%")) | 
            (User.email.ilike(f"%{q}%"))
        )
    
    if role:
        query = query.where(User.role == role)
    
    query = query.offset(skip).limit(limit).order_by(User.created_at.desc())
    
    result = await db.execute(query)
    users = result.scalars().all()
    
    return [UserResponse.model_validate(user) for user in users]

# Эндпоинт для получения статистики пользователей
@router.get("/stats")
async def get_users_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("moderate"))
):
    """Получение статистики пользователей"""
    # Общее количество пользователей
    total_result = await db.execute(select(func.count(User.id)))
    total_users = total_result.scalar()
    
    # Количество по ролям
    roles_result = await db.execute(
        select(User.role, func.count(User.id))
        .group_by(User.role)
    )
    roles_stats = {role: count for role, count in roles_result.all()}
    
    # Пользователи, зарегистрированные за последние 30 дней
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_result = await db.execute(
        select(func.count(User.id))
        .where(User.created_at >= thirty_days_ago)
    )
    recent_users = recent_result.scalar()
    
    return {
        "total_users": total_users,
        "roles_stats": roles_stats,
        "recent_users": recent_users
    }