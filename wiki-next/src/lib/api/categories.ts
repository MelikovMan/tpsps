import { api } from './client';
import { ArticleResponse } from './types/article';
import { CategoryCreate, CategoryResponse, CategoryUpdate } from './types/categories';

export const categoriesApi = {
  // Получить корневые категории или дочерние для указанного parentId
  getList: (parentId?: string) =>
    api.get<CategoryResponse[]>('/categories/', parentId ? { parent_id: parentId } : undefined),

  // Получить одну категорию по ID
  getById: (id: string) =>
    api.get<CategoryResponse>(`/categories/${id}`),

  // Получить статьи категории (с опцией include_subcategories)
  getArticles: (categoryId: string, includeSub: boolean = false, offset: number = 0, limit: number = 10) =>
    api.get<ArticleResponse[]>(`/categories/${categoryId}/articles`, {
      include_subcategories: includeSub.toString(),
      offset: offset.toString(),
      limit: limit.toString(),
    }),

  // Создать категорию
  create: (data: CategoryCreate) =>
    api.post<CategoryResponse>('/categories/', data),

  // Обновить категорию
  update: (id: string, data: CategoryUpdate) =>
    api.put<CategoryResponse>(`/categories/${id}`, data),

  // Удалить категорию
  delete: (id: string) =>
    api.delete<void>(`/categories/${id}`),
};