// types/profile.ts
export interface UserProfile {
  user_id: string;
  bio?: string;
  avatar_url?: string;
  social_links?: Record<string, string>;
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
    created_at: string;
    last_login?: string;
  };
}

export interface CreateProfileData {
  bio?: string;
  avatar_url?: string;
  social_links?: Record<string, string>;
}

export interface UpdateProfileData {
  bio?: string;
  avatar_url?: string;
  social_links?: Record<string, string>;
}

export interface ProfileVersion {
  id: string;
  user_id: string;
  content: Record<string, any>;
  created_at: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  label: string;
}