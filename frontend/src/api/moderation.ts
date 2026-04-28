// src/api/moderation.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type { ModerationResponse, ModerationUpdate } from './types/moderation';

export const useModerations = (status?: string) => {
    return useQuery({
        queryKey: ['moderations', status],
        queryFn: async () => {
            const params: any = {};
            if (status) params.status = status;
            const response = await apiClient.get<ModerationResponse[]>('/moderation/', { params });
            return response.data;
        },
        staleTime: 30_000,
    });
};

export const useUpdateModeration = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: ModerationUpdate }) => {
            const response = await apiClient.put<ModerationResponse>(`/moderation/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['moderations'] });
        },
    });
};