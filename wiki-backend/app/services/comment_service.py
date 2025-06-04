
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.comment import Comment
from app.schemas.comment import CommentResponse
class CommentService:
    def __init__(self, db: AsyncSession):
        self.db = db
    async def build_comment_tree(self, comments:list[Comment]|None):
        if not comments:
          return []
    
    # Строим дерево комментариев вручную
        comment_map = {comment.id: CommentResponse(
           id=comment.id,
           article_id=comment.article_id,
           user_id=comment.user_id,
           content=comment.content,
           created_at=comment.created_at,
           reply_to_id=comment.reply_to_id,
           replies=[]
       ) for comment in comments}
    
    # Связываем комментарии в дерево
        root_comments = []
        for comment in comments:
            schema = comment_map[comment.id]
            if comment.reply_to_id:
                parent = comment_map.get(comment.reply_to_id)
                if parent:
                    parent.replies.append(schema)
            else:
                root_comments.append(schema)
    
    # Сортируем корневые комментарии и их ответы
        root_comments.sort(key=lambda c: c.created_at)
        for comment in root_comments:
            comment.replies.sort(key=lambda r: r.created_at)
    
        return root_comments

