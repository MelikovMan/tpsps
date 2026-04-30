import { api } from './client';
import type { CommitResponse, CommitResponseDetailed, CommitCreate, DiffResponse } from './types/article';

export const commitsApi = {
  getByArticle: (articleId: string, skip = 0, limit = 50) =>
    api.get<CommitResponse[]>(`/commits/article/${articleId}`, { skip: skip.toString(), limit: limit.toString() }),

  getByBranch: (branchId: string, skip = 0, limit = 50) =>
    api.get<CommitResponse[]>(`/commits/branch/${branchId}`, { skip: skip.toString(), limit: limit.toString() }),

  getById: (commitId: string) =>
    api.get<CommitResponse>(`/commits/${commitId}`),

  getDetailed: (commitId: string) =>
    api.get<CommitResponseDetailed>(`/commits/${commitId}/detailed`),

  getDiff: (commitId: string) =>
    api.get<DiffResponse>(`/commits/${commitId}/diff`),

  create: (articleId: string, data: CommitCreate) =>
    api.post<CommitResponse>(`/commits/article/${articleId}`, data),

  revert: (commitId: string) =>
    api.post<CommitResponse>(`/commits/${commitId}/revert`),
};