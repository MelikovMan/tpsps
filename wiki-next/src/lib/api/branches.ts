import { api } from './client';
import type { BranchResponse, BranchCreate, BranchCreateFromCommit, MergeBranchRequest } from './types/article';

export const branchesApi = {
  getByArticle: (articleId: string, includePrivate = false) =>
    api.get<BranchResponse[]>(`/branches/article/${articleId}`, { include_private: includePrivate.toString() }),

  getById: (branchId: string) =>
    api.get<BranchResponse>(`/branches/${branchId}`),

  getByName: (articleId: string, branchName: string) =>
    api.get<BranchResponse>(`/branches/article/${articleId}/by-name/${branchName}`),

  create: (data: BranchCreate) =>
    api.post<BranchResponse>('/branches/', data),

  createFromCommit: (articleId: string, data: BranchCreateFromCommit) =>
    api.post<BranchResponse>(`/branches/article/${articleId}/from-commit`, data),

  update: (branchId: string, data: Partial<BranchCreate>) =>
    api.put<BranchResponse>(`/branches/${branchId}`, data),

  delete: (branchId: string) =>
    api.delete<void>(`/branches/${branchId}`),

  merge: ({ sourceBranchId, targetBranchId, message }: { sourceBranchId: string; targetBranchId: string; message?: string }) =>
    api.post<void>(`/branches/${sourceBranchId}/merge/${targetBranchId}`, message ? { message } : {}),
};