import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { type UserProfile, type CreateProfileData, type UpdateProfileData, type ProfileVersion } from './types/profile.ts';

// Получение профиля текущего пользователя
export const useMyProfile = () => {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      const response = await apiClient.get<UserProfile>('/users/me/profile');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 минут
    retry: (failureCount, error: any) => {
      // Не повторяем запрос если профиль не найден (404)
      if (error?.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    }
  });
};

// Получение профиля пользователя по ID
export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const response = await apiClient.get<UserProfile>(`/users/${userId}/profile`);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

// Создание профиля
export const useCreateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (profileData: CreateProfileData) => {
      const response = await apiClient.post<UserProfile>('/users/me/profile', profileData);
      return response.data;
    },
    onSuccess: (data) => {
      // Обновляем кэш профиля
      queryClient.setQueryData(['profile', 'me'], data);
      // Инвалидируем связанные запросы
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

// Обновление профиля
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (profileData: UpdateProfileData) => {
      const response = await apiClient.put<UserProfile>('/users/me/profile', profileData);
      return response.data;
    },
    onSuccess: (data) => {
      // Обновляем кэш профиля
      queryClient.setQueryData(['profile', 'me'], data);
      // Инвалидируем связанные запросы
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile-versions'] });
    },
  });
};

// Удаление профиля
export const useDeleteProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      await apiClient.delete('/users/me/profile');
    },
    onSuccess: () => {
      // Удаляем данные профиля из кэша
      queryClient.removeQueries({ queryKey: ['profile', 'me'] });
      // Инвалидируем связанные запросы
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile-versions'] });
    },
  });
};

// Получение истории версий профиля
export const useProfileVersions = (skip: number = 0, limit: number = 10) => {
  return useQuery({
    queryKey: ['profile-versions', 'me', skip, limit],
    queryFn: async () => {
      const response = await apiClient.get<ProfileVersion[]>('/users/me/profile/versions', {
        params: { skip, limit }
      });
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 минуты
  });
};

// Получение истории версий профиля пользователя (для модераторов)
export const useUserProfileVersions = (userId: string, skip: number = 0, limit: number = 10) => {
  return useQuery({
    queryKey: ['profile-versions', userId, skip, limit],
    queryFn: async () => {
      const response = await apiClient.get<ProfileVersion[]>(`/users/${userId}/profile/versions`, {
        params: { skip, limit }
      });
      return response.data;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
};