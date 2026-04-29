from sqlalchemy.ext.asyncio import AsyncSession
from app.models.comment import Comment
from app.schemas.category import CategoryResponse

class CategoryService:
    def __init__(self, db: AsyncSession):
        self.db = db
    def category_to_response(self, category:CategoryResponse):
      """Превращает ORM-объект Category в словарь, преобразуя Ltree path в str."""
      cat_dict = {
        "id": category.id,
        "name": category.name,
        "parent_id": category.parent_id,
        "path": str(category.path),  # явное преобразование
        "children": [str(child.id) for child in category.children] if category.children  else None
       }
      return CategoryResponse.model_validate(cat_dict)


