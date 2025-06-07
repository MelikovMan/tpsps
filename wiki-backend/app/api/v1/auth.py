from datetime import timedelta
import uuid
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.models.user import User, UserProfile
from app.schemas.auth import LoginRequest, LoginResponse, RegisterRequest
from app.schemas.user import RegisterResponse, UserResponse
from app.core.config import settings


router = APIRouter()

@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.username == request.username))
    user = result.scalar_one_or_none()
    

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return LoginResponse(
        access_token=access_token,
        username=user.username
    )

@router.post("/register", response_model=RegisterResponse)
async def register(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    # Check if user already exists
    result = await db.execute(
        select(User).where(
            (User.username == request.username) | (User.email == request.email)
        )
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(request.password)
    new_id = uuid.uuid4()
    new_user = User(
        id=new_id,
        username=request.username,
        email=request.email,
        password_hash=hashed_password
    )
    
    db.add(new_user)
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": new_user.username}, expires_delta=access_token_expires
    )
    await db.commit()
    await db.refresh(new_user)
    new_profile = UserProfile (
        user_id=new_id,
        bio="Hello, " + request.username +", this is your profile."
    )
    db.add(new_profile)
    await db.commit()
    new_user_response = RegisterResponse(
        id=new_id, 
        username=request.username,
        email=request.email,
        access_token=access_token
    )
    
    return new_user_response

@router.post("/logout")
async def logout():
    return {"message": "Successfully logged out"}