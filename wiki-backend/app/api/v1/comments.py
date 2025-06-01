from typing import List
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_active_user, require_permission
from app.models.user import User
from app.models.comment import Comment
from app.schemas.comment import CommentResponse, CommentCreate, CommentUpdate

router = APIRouter()

@router.get("/article/{article_id}", response_model=List[CommentResponse])
async def get_article_comments(
    article_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.replies))
        .where(Comment.article_id == article_id, Comment.reply_to_id.is_(None))
        .order_by(Comment.created_at)
    )
    comments = result.scalars().all()
    
    return [CommentResponse.model_validate(comment) for comment in comments]

@router.post("/", response_model=CommentResponse)
async def create_comment(
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    comment = Comment(
        article_id=comment_data.article_id,
        user_id=current_user.id,
        content=comment_data.content,
        reply_to_id=comment_data.reply_to_id
    )
    
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    
    return CommentResponse.model_validate(comment)

@router.put("/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: UUID,
    comment_update: CommentUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.one_or_none()
    
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Check if user owns the comment or has moderation rights
    if comment.user_id != current_user.id:
        # Check moderation permission
        await require_permission("moderate")(current_user, db)
    
    update_data = comment_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(comment, field, value)
    
    await db.commit()
    await db.refresh(comment)
    
    return CommentResponse.model_validate(comment)

@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.one_or_none()
    
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Check if user owns the comment or has moderation rights
    if comment.user_id != current_user.id:
        await require_permission("moderate")(current_user, db)
    
    await db.delete(comment)
    await db.commit()
    
    return {"message": f"Comment {comment_id} deleted successfully"}
