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

export interface ArticlesQueryParams {
  skip?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface BranchResponse {
  id: string;
  name: string;
  description: string;
  article_id: string;
  head_commit_id: string;
  created_at: string;
  updated_at: string;
  is_protected: boolean;
  creator_id: string;
}

export interface BranchWithCommitCount extends BranchResponse {
  commits_count: number;
}

export interface BranchCreate {
  article_id: string;
  name: string;
  description?: string;
  head_commit_id: string;
}

export interface BranchCreateFromCommit {
  name: string;
  description?: string;
  source_commit_id: string;
}

export interface CommitResponse {
  id: string;
  message: string;
  content_diff: string;
  is_merge: boolean;
  article_id: string;
  author_id: string;
  created_at: string;
}

export interface CommitResponseDetailed extends CommitResponse {
  content: string;
  author_name: string;
  branch_name: string;
  parent_commits?: string[];
}

export interface CommitCreate {
  message: string;
  content: string;
  branch_id?: string;
}

export interface DiffResponse {
  commit_id: string;
  parent_commit_id?: string;
  diff: string;
  added_lines: number;
  removed_lines: number;
}

export interface MergeBranchRequest {
  message?: string;
}

export interface ArticleCreate {
  title: string;
  content: string;
  status?: string;
  article_type?: string;
  message?: string;
}

export interface ArticleUpdate {
  title?: string;
  content?: string;
  status?: string;
  article_type?: string;
  message?: string;
}

// Новый интерфейс для редактирования статьи через коммиты
export interface ArticleEditCommit {
  message: string;
  content: string;
  branch?: string; // Имя ветки, если не указано - используется текущая ветка
}