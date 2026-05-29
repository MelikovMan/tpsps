import { api } from './client';
import type { CommentResponse, CommentCreate, CommentUpdate } from './types/comment';

export const commentsApi = {
  getByArticle: (articleId: string) =>
    api.get<CommentResponse[]>(`/comments/article/${articleId}`),

  create: (data: CommentCreate) =>
    api.post<CommentResponse>('/comments/', data),

  update: (commentId: string, data: CommentUpdate) =>
    api.put<CommentResponse>(`/comments/${commentId}`, data),

  delete: (commentId: string) =>
    api.delete<void>(`/comments/${commentId}`),
};