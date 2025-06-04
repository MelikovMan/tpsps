import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import { type CommentResponse, type CommentCreate, type CommentUpdate } from './comment.ts';

// Получение комментариев к статье
export const useArticleComments = (articleId: string) => {
  return useQuery({
    queryKey: ['comments', 'article', articleId],
    queryFn: async () => {
      const response = await apiClient.get<CommentResponse[]>(`/comments/article/${articleId}`);
      return response.data;
    },
    enabled: !!articleId,
    staleTime: 2 * 60 * 1000, // 2 минуты кэширования
  });
};

// Создание нового комментария
export const useCreateComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (commentData: CommentCreate) => {
      const response = await apiClient.post<CommentResponse>('/comments/', commentData);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Обновляем кэш комментариев для статьи
      queryClient.invalidateQueries({ 
        queryKey: ['comments', 'article', variables.article_id] 
      });
    },
    onError: (error) => {
      console.error('Error creating comment:', error);
    },
  });
};

// Обновление комментария
export const useUpdateComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ commentId, updateData }: { commentId: string; updateData: CommentUpdate }) => {
      const response = await apiClient.put<CommentResponse>(`/comments/${commentId}`, updateData);
      return response.data;
    },
    onSuccess: (data) => {
      // Обновляем кэш комментариев для статьи
      queryClient.invalidateQueries({ 
        queryKey: ['comments', 'article', data.article_id] 
      });
    },
    onError: (error) => {
      console.error('Error updating comment:', error);
    },
  });
};

// Удаление комментария
export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (commentId: string) => {
      await apiClient.delete(`/comments/${commentId}`);
      return commentId;
    },
    onSuccess: (_, commentId) => {
      // Обновляем все кэши комментариев
      queryClient.invalidateQueries({ 
        queryKey: ['comments'] 
      });
    },
    onError: (error) => {
      console.error('Error deleting comment:', error);
    },
  });
};