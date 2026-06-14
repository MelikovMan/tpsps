import { api } from './client';
import type { UserProfile, CreateProfileData, UpdateProfileData, ProfileVersion } from './types/profile';

export const profileApi = {
  // Получить профиль текущего пользователя
  getMyProfile: () =>
    api.get<UserProfile>('/users/me/profile'),

  // Получить профиль пользователя по ID
  getUserProfile: (userId: string) =>
    api.get<UserProfile>(`/users/${userId}/profile`),

  // Создать профиль
  create: (data: CreateProfileData) =>
    api.post<UserProfile>('/users/me/profile', data),

  // Обновить профиль
  update: (data: UpdateProfileData) =>
    api.put<UserProfile>('/users/me/profile', data),

  // Удалить профиль
  delete: () =>
    api.delete<void>('/users/me/profile'),

  // История версий текущего профиля
  getVersions: (skip = 0, limit = 10) =>
    api.get<ProfileVersion[]>('/users/me/profile/versions', { skip: skip.toString(), limit: limit.toString() }),

  // История версий профиля другого пользователя (для модератора)
  getUserVersions: (userId: string, skip = 0, limit = 10) =>
    api.get<ProfileVersion[]>(`/users/${userId}/profile/versions`, { skip: skip.toString(), limit: limit.toString() }),
};