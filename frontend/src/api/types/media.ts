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