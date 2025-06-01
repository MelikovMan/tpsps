export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

// Типы ответов
export interface LoginResponse {
  access_token: string;
  token_type: string;
  username: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  last_login?: string;
}

export interface UserProfile {
  bio?: string;
  avatar_url?: string;
  social_links?: Record<string, string>;
}

export interface ProfileVersion {
  id: string;
  content: Record<string, unknown>;
  created_at: string;
}