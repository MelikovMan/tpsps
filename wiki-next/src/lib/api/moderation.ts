// lib/api/moderation.ts
import { api } from './client';
import type { ModerationResponse, ModerationUpdate } from './types/moderation';

export const moderationApi = {
  // Получить список заявок с фильтром по статусу
  getList: (status?: string) => {
    const params: Record<string, string> = {};
    if (status && status !== 'all') params.status = status;
    return api.get<ModerationResponse[]>('/moderation/', params);
  },

  // Обновить заявку
  update: (id: string, data: ModerationUpdate) =>
    api.put<ModerationResponse>(`/moderation/${id}`, data),
};