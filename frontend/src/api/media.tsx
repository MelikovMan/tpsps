// media.tsx
import apiClient from './client';
import {  
  type MediaFile, 
  type MediaUploadResponse,
  type MediaInfoResponse,
  type MediaListResponse,
  type MediaDownloadResponse,
  type MediaListParams,
  type UploadMediaParams,
  type AttachMediaParams,
  type DetachMediaParams,
  type DownloadMediaParams
} from './types/media';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// API functions
export const uploadMedia = async ({ file, articleId, commitId }: UploadMediaParams): Promise<MediaUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const params = new URLSearchParams();
  if (articleId) params.append('article_id', articleId);
  if (commitId) params.append('commit_id', commitId);
  
  const response = await apiClient.post<MediaUploadResponse>(
    `/media/upload?${params}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  
  return response.data;
};

export const getMediaList = async (params: MediaListParams = {}): Promise<MediaListResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params.skip !== undefined) queryParams.append('skip', params.skip.toString());
  if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.type && params.type !== 'all') queryParams.append('type', params.type);
  
  const response = await apiClient.get<MediaListResponse>(`/media?${queryParams}`);
  response.data.data
  
  // For now, we'll return a mock structure. In a real app, your backend should return pagination info.
  return {
    data: response.data.data,
    total: response.data.total // This should come from backend pagination headers
  };
};

export const getMediaById = async (mediaId: string): Promise<MediaFile> => {
  const response = await apiClient.get<MediaFile>(`/media/${mediaId}`);
  return response.data;
};

export const getMediaInfo = async (mediaId: string): Promise<MediaInfoResponse> => {
  const response = await apiClient.get<MediaInfoResponse>(`/media/${mediaId}/info`);
  return response.data;
};

export const getMediaDownloadUrl = async ({ mediaId, expiresIn = 3600 }: DownloadMediaParams): Promise<string> => {
  const response = await apiClient.get<MediaDownloadResponse>(`/media/${mediaId}/url`, {
    params: { expires_in: expiresIn }
  });
  return response.data.download_url;
};

export const deleteMedia = async (mediaId: string): Promise<void> => {
  await apiClient.delete(`/media/${mediaId}`);
};

export const attachMediaToArticle = async ({ mediaId, articleId, commitId }: AttachMediaParams): Promise<void> => {
  await apiClient.post(`/media/${mediaId}/attach`, null, {
    params: { article_id: articleId, commit_id: commitId }
  });
};

export const detachMediaFromArticle = async ({ mediaId, articleId }: DetachMediaParams): Promise<void> => {
  await apiClient.post(`/media/${mediaId}/detach`, null, {
    params: { article_id: articleId }
  });
};

// React Query Hooks
export const useMediaList = (params: MediaListParams = {}) => {
  return useQuery({
    queryKey: ['media', 'list', params],
    queryFn: () => getMediaList(params),
  });
};

export const useMedia = (mediaId: string) => {
  return useQuery({
    queryKey: ['media', 'detail', mediaId],
    queryFn: () => getMediaById(mediaId),
    enabled: !!mediaId,
  });
};

export const useMediaInfo = (mediaId: string) => {
  return useQuery({
    queryKey: ['media', 'info', mediaId],
    queryFn: () => getMediaInfo(mediaId),
    enabled: !!mediaId,
  });
};

export const useUploadMedia = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: uploadMedia,
    onSuccess: () => {
      // Invalidate media list queries to refetch after upload
      queryClient.invalidateQueries({ queryKey: ['media', 'list'] });
    },
  });
};

export const useDeleteMedia = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteMedia,
    onSuccess: () => {
      // Invalidate media list queries to refetch after deletion
      queryClient.invalidateQueries({ queryKey: ['media', 'list'] });
    },
  });
};

export const useAttachMedia = () => {
  return useMutation({
    mutationFn: attachMediaToArticle,
  });
};

export const useDetachMedia = () => {
  return useMutation({
    mutationFn: detachMediaFromArticle,
  });
};

export const useMediaDownload = () => {
  return useMutation({
    mutationFn: getMediaDownloadUrl,
  });
};

// Utility functions for the MediaListPage
export const getFileIcon = (mimeType: string) => {
  const icons = {
    'image': '🖼️',
    'video': '🎥',
    'audio': '🎵',
    'application/pdf': '📄',
    'text': '📝',
    'default': '📄'
  };

  if (mimeType.startsWith('image/')) return icons.image;
  if (mimeType.startsWith('video/')) return icons.video;
  if (mimeType.startsWith('audio/')) return icons.audio;
  if (mimeType.startsWith('application/pdf')) return icons['application/pdf'];
  if (mimeType.startsWith('text/')) return icons.text;
  return icons.default;
};

export const getFileType = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.startsWith('video/')) return 'Video';
  if (mimeType.startsWith('audio/')) return 'Audio';
  if (mimeType.startsWith('application/pdf')) return 'PDF';
  if (mimeType.startsWith('text/')) return 'Text';
  return 'Document';
};

export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};