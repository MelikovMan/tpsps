// lib/api/users.ts
import { api } from './client';
import type { UserResponse, UserCreate, UserUpdate } from './types/users';

export const usersApi = {
  // Поиск пользователей с пагинацией и фильтрацией
  search: (params: { q?: string; role?: string; skip?: number; limit?: number }) =>
    api.get<{ data: UserResponse[]; total: number }>('/users/search', params as Record<string, string>),

  // Получить пользователя по ID
  getById: (userId: string) =>
    api.get<UserResponse>(`/users/${userId}`),

  // Создать пользователя (будет вызвано через server action)
  create: (data: UserCreate) =>
    api.post<UserResponse>('/users', data),

  // Обновить пользователя
  update: (userId: string, data: UserUpdate) =>
    api.put<UserResponse>(`/users/${userId}`, data),

  // Удалить пользователя
  delete: (userId: string) =>
    api.delete<void>(`/users/${userId}`),
};