// src/api/articles.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import { type ArticleFullResponse, type ArticleResponse, type CommitResponse } from './types';

interface ArticlesQueryParams {
  skip?: number;
  limit?: number;
  status?: string;
  search?: string;
}


export const useArticles = (params: ArticlesQueryParams = {}) => {
  return useQuery({
    queryKey: ['articles', params],
    queryFn: async () => {
      const response = await apiClient.get<ArticleResponse[]>('/articles', {
        params: {
          skip: params.skip || 0,
          limit: params.limit || 10,
          status: params.status,
          search: params.search
        }
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 минут кэширования
  });
};

export const useArticle = (articleId: string, branch: string = 'main') => {
  return useQuery({
    queryKey: ['article', articleId, branch],
    queryFn: async () => {
      const response = await apiClient.get<ArticleFullResponse>(`/articles/${articleId}`, {
        params: { branch }
      });
      return response.data;
    },
    enabled: !!articleId, // Запрос выполняется только при наличии articleId
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 минут кэширования
  });
};

export const useArticleCommits = (articleId: string) => {
  return useQuery({
    queryKey: ['articleCommits', articleId],
    queryFn: async () => {
      const response = await apiClient.get<CommitResponse[]>(`/articles/${articleId}/commits`);
      return response.data;
    },
    enabled: !!articleId,
  });
};
