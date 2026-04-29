// src/api/categories.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type { ArticleResponse } from './article';
import type { CategoryResponse } from './types/categories';


export const useCategories = (parentId?: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['categories', parentId ?? 'root'],
    queryFn: async () => {
      const params = parentId ? { parent_id: parentId } : {};
      const response = await apiClient.get<CategoryResponse[]>('/categories/', { params });
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    ...options
  });
};

export const useCategory = (categoryId: string) => {
  return useQuery({
    queryKey: ['category', categoryId],
    queryFn: async () => {
      const response = await apiClient.get<CategoryResponse>(`/categories/${categoryId}`);
      return response.data;
    },
    enabled: !!categoryId,
  });
};

export const useCategoryArticles = (
  categoryId: string,
  includeSubcategories: boolean = false,
  skip: number = 0,
  limit: number = 20
) => {
  return useQuery({
    queryKey: ['categoryArticles', categoryId, includeSubcategories, skip, limit],
    queryFn: async () => {
      const response = await apiClient.get<ArticleResponse[]>(
        `/categories/${categoryId}/articles`,
        { params: { skip, limit, include_subcategories: includeSubcategories } }
      );
      return response.data;
    },
    enabled: !!categoryId,
  });
};

// Мутации для управления категориями (требуются права can_edit/can_delete)
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; parent_id?: string }) => {
      const response = await apiClient.post<CategoryResponse>('/categories/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; parent_id?: string }) => {
      const response = await apiClient.put<CategoryResponse>(`/categories/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category', variables.id] });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useSearchCategories = (query: string, parentId?: string) => {
  return useQuery({
    queryKey: ['categories', 'search', query, parentId],
    queryFn: async () => {
      const params: Record<string, string> = { q: query };
      if (parentId) params.parent_id = parentId;
      const response = await apiClient.get<CategoryResponse[]>('/categories/search', { params });
      return response.data;
    },
    enabled: query.length > 0,   // only run when there is a search term
    staleTime: 1 * 60 * 1000,   // 1 minute
  });
};

export const useAllCategoriesFlat = () => {
  return useQuery({
    queryKey: ['categories', 'flat'],
    queryFn: async () => {
      const response = await apiClient.get<CategoryResponse[]>('/categories/flat');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};  