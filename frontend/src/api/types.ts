export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type:string;
  username: UserResponse;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  role: string;
  access_token:string
}
export interface PermissionResponse {
  role: string;
  can_edit: boolean;
  can_delete: boolean;
  can_moderate: boolean;
  bypass_tag_restrictions: boolean;
}
export interface ArticleResponse {
  id: string;
  title: string;
  status: string;
  article_type: string;
  current_commit_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ArticleFullResponse extends ArticleResponse {
  content: string;
}

// Добавляем тип для параметров запроса
export interface ArticlesQueryParams {
  skip?: number;
  limit?: number;
  status?: string;
  search?: string;
}
export interface BranchResponse {
    id: String;
    name:String;
    description:String;
    article_id: String;
    head_commit_id: String;
}
export interface CommitResponse {
    message: String;
    content_diff: String;
    is_merge: Boolean
    id: String;
    article_id: String
    author_id: String
    created_at: String;
}

