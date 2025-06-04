import { useQuery } from '@tanstack/react-query';
import apiClient from './client';
import {type UserResponse} from './users'

export const useUser = (userId: string) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await apiClient.get<UserResponse>(`/users/${userId}`);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 минут кэширования
  });
};

// Получение информации о нескольких пользователях
export const useUsers = (userIds: string[]) => {
  return useQuery({
    queryKey: ['users', userIds.sort()],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      
      const promises = userIds.map(id => 
        apiClient.get<UserResponse>(`/users/${id}`).then(res => res.data)
      );
      
      const users = await Promise.allSettled(promises);
      return users
        .filter((result): result is PromiseFulfilledResult<UserResponse> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);
    },
    enabled: userIds.length > 0,
    staleTime: 10 * 60 * 1000,
  });
};