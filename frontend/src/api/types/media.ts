
// types/media.ts
export interface MediaResponse {
  id: string;
  original_filename: string;
  storage_path: string;
  bucket_name: string;
  object_key: string;
  mime_type: string;
  file_size: number;
  public_url: string;
  uploaded_at: string;
}

export interface MediaUsageResponse {
  articles: { id: string; title: string }[];
  commits: { id: string; message: string }[];
  is_orphaned: boolean;
}

// Add the missing types
export interface MediaFile extends MediaResponse {
  // MediaFile is the same as MediaResponse, we can use it interchangeably
  // or add any additional fields if needed
}

export interface MediaUploadResponse {
  id: string;
  original_filename: string;
  storage_path: string;
  bucket_name: string;
  object_key: string;
  mime_type: string;
  file_size: number;
  public_url: string;
  uploaded_at: string;
  message: string;
}

export interface MediaInfoResponse extends MediaResponse {
  articles: { id: string; title: string }[];
  commits: { id: string; message: string }[];
  is_orphaned: boolean;
}

// Types for API responses
export interface MediaListResponse {
  data: MediaFile[];
  total: number;
  page?: number;
  pages?: number;
}

export interface MediaDownloadResponse {
  download_url: string;
  expires_in: number;
}

export const MediaFileType = {
  ALL: 'all',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  PDF: 'pdf',
  TEXT: 'text'
} as const;

export type MediaFileType = typeof MediaFileType[keyof typeof MediaFileType];

// Update MediaListParams to use the enum
export interface MediaListParams {
  page?: number;
  skip?: number;
  limit?: number;
  search?: string;
  type?: MediaFileType | string; // Allow string for backward compatibility
}


export interface UploadMediaParams {
  file: File;
  articleId?: string;
  commitId?: string;
}

export interface AttachMediaParams {
  mediaId: string;
  articleId: string;
  commitId?: string;
}

export interface DetachMediaParams {
  mediaId: string;
  articleId: string;
}

export interface DownloadMediaParams {
  mediaId: string;
  expiresIn?: number;
}