// lib/api/media.ts
import { api } from './client';
import type {
  MediaFile,
  MediaListResponse,
  MediaInfoResponse,
  MediaDownloadResponse,
  MediaListParams,
  MediaUploadResponse,
} from './types/media';

export const mediaApi = {
  // Получить список медиа с пагинацией, поиском и фильтром по типу
  getList: (params: MediaListParams = {}) => {
    const { page, limit = 12, search, type } = params;
    const skip = page ? (page - 1) * limit : 0;
    const queryParams: Record<string, string> = {
      skip: skip.toString(),
      limit: limit.toString(),
    };
    if (search) queryParams.search = search;
    if (type && type !== 'all') queryParams.type = type;
    return api.get<MediaListResponse>('/media/', queryParams);
  },

  // Получить один медиафайл по ID
  getById: (mediaId: string) =>
    api.get<MediaFile>(`/media/${mediaId}`),

  // Получить расширенную информацию о медиа
  getInfo: (mediaId: string) =>
    api.get<MediaInfoResponse>(`/media/${mediaId}/info`),

  // Получить временную ссылку на скачивание
  getDownloadUrl: (mediaId: string, expiresIn = 3600) =>
    api.get<MediaDownloadResponse>(`/media/${mediaId}/url`, { expires_in: expiresIn.toString() })
      .then(res => res.download_url),

  // Загрузить новый файл
  upload: (formData: FormData, articleId?: string, commitId?: string) => {
    const queryParams: Record<string, string> = {};
    if (articleId) queryParams.article_id = articleId;
    if (commitId) queryParams.commit_id = commitId;
    return api.post<MediaUploadResponse>('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: queryParams,
    });
  },

  // Удалить медиафайл
  delete: (mediaId: string) =>
    api.delete<void>(`/media/${mediaId}`),

  // Привязать медиа к статье
  attachToArticle: (mediaId: string, articleId: string) =>
    api.post<void>(`/media/${mediaId}/attach/article/${articleId}`),

  // Отвязать медиа от статьи
  detachFromArticle: (mediaId: string, articleId: string) =>
    api.post<void>(`/media/${mediaId}/detach`, null, { params: { article_id: articleId } }),
};