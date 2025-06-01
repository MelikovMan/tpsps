import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from './client';
import { type LoginRequest, type RegisterRequest, type PermissionResponse, type UserResponse, type LoginResponse } from './types';

export const useLogin = () => {
  return useMutation({
    mutationFn: (data: LoginRequest) =>
      apiClient.post<LoginResponse>('/auth/login', data).then((res) => res.data),
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access_token);
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (data: RegisterRequest) =>
      apiClient.post<UserResponse>('/auth/register', data).then((res) => res.data),
    onSuccess: (data) =>{
      localStorage.setItem('access_token', data.access_token);
    }
  });
};

export const useLogout = () => {
  
  return useMutation({
    mutationFn: () => apiClient.post('/auth/logout'),
    onSuccess: () => {
      localStorage.removeItem('access_token');
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