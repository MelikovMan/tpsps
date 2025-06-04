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


