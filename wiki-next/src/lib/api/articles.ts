import { api } from './client';
import type { ArticleResponse, ArticleFullResponse, ArticleCreate, ArticleUpdate } from './types/article'

export const articlesApi = {
  getList: (params?: { skip?: number; limit?: number; status?: string; search?: string }) =>
    api.get<ArticleResponse[]>('/articles/', params as Record<string, string>),

  getById: (articleId: string, branch = 'main', renderTemplates = false) =>
    api.get<ArticleFullResponse>(`/articles/${articleId}`, {
      branch,
      render_templates: renderTemplates.toString(),
    }),

  create: (data: ArticleCreate) =>
    api.post<ArticleResponse>('/articles/', data),

  update: (articleId: string, data: ArticleUpdate) =>
    api.put<ArticleResponse>(`/articles/${articleId}`, data),

  delete: (articleId: string) =>
    api.delete<void>(`/articles/${articleId}`),

  // Категории статьи
  getCategories: (articleId: string) =>
    api.get<any[]>(`/articles/${articleId}/categories`),

  addCategories: (articleId: string, categoryIds: string[]) =>
    api.post<void>(`/articles/${articleId}/categories`, categoryIds),

  removeCategory: (articleId: string, categoryId: string) =>
    api.delete<void>(`/articles/${articleId}/categories/${categoryId}`),
};