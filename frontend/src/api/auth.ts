import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import { type LoginRequest, type RegisterRequest, type PermissionResponse, type UserResponse, type LoginResponse } from './types';

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LoginRequest) =>
      apiClient.post<LoginResponse>('/auth/login', data).then((res) => res.data),
    onSuccess: async (data) => {
      localStorage.setItem('access_token', data.access_token);
      await queryClient.fetchQuery({
        queryKey: ['currentUser'],
        queryFn: () => apiClient.get<UserResponse>('/users/me').then(res => res.data),
      });
      await queryClient.fetchQuery({
        queryKey: ['userPermissions'],
        queryFn: () => apiClient.get<PermissionResponse>('/users/me/permissions').then(res => res.data),
      });
      
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RegisterRequest) =>
      apiClient.post<UserResponse>('/auth/register', data).then((res) => res.data),
    onSuccess: async (data) =>{
      localStorage.setItem('access_token', data.access_token);
      await queryClient.fetchQuery({
        queryKey: ['currentUser'],
        queryFn: () => apiClient.get<UserResponse>('/users/me').then(res => res.data),
      });
      await queryClient.fetchQuery({
        queryKey: ['userPermissions'],
        queryFn: () => apiClient.get<PermissionResponse>('/users/me/permissions').then(res => res.data),
      });
    }
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post('/auth/logout'),
    onSuccess: () => {
      localStorage.removeItem('access_token');
      // Stop any ongoing refetches for the user data
      queryClient.cancelQueries({ queryKey: ['currentUser'] });
      queryClient.cancelQueries({ queryKey: ['userPermissions'] });
      // Immediately set the cached data to null → user disappears, isAuthenticated becomes false
      queryClient.setQueryData(['currentUser'], null);
      queryClient.setQueryData(['userPermissions'], null);
    },
    onError: () => {
      // Even if the server returns an error, still clear local state
      localStorage.removeItem('access_token');
      queryClient.cancelQueries({ queryKey: ['currentUser'] });
      queryClient.cancelQueries({ queryKey: ['userPermissions'] });
      queryClient.setQueryData(['currentUser'], null);
      queryClient.setQueryData(['userPermissions'], null);
    },
  });
};
export const useUserPermissions = () => {
  return useQuery({
    queryKey: ['userPermissions'],
    queryFn: () => 
      apiClient.get<PermissionResponse>('/users/me/permissions').then(res => res.data),
    enabled: !!localStorage.getItem('access_token'),
    retry: false,
  });
};
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => 
      apiClient.get<UserResponse>('/users/me').then((res) => res.data),
    enabled: !!localStorage.getItem('access_token'),
    retry: false,
  });
};