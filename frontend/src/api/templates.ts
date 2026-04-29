import { useQuery } from '@tanstack/react-query';
import apiClient from './client';
import type { TemplateResponse } from './types/templates';

export const useTemplates = () => {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await apiClient.get<TemplateResponse[]>('/templates/');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};