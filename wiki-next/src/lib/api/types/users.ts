export interface UserResponse {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  role: string;
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  last_login?: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  role: string;
  password: string;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  role?: string;
  password?: string;
}

export interface UsersListParams {
  skip?: number;
  limit?: number;
  search?: string;
  role?: string;
}

export interface UsersListResponse {
  users: User[];
  total: number;
  skip: number;
  limit: number;
}