export interface CommentResponse {
  id: string;
  article_id: string;
  user_id: string;
  content: string;
  created_at: string;
  reply_to_id?: string;
  replies?: CommentResponse[];
}

export interface CommentCreate {
  article_id: string;
  content: string;
  reply_to_id?: string;
}

export interface CommentUpdate {
  content?: string;
}