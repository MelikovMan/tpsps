import apiClient from './client';
import { type MediaResponse } from './types/media';

export const uploadMedia = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post<MediaResponse>(
    '/media/upload', 
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  
  return response.data;
};

// Типы данных