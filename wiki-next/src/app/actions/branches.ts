// app/actions/branches.ts
'use server';

import { revalidatePath } from 'next/cache';
import { branchesApi } from '@/lib/api/branches';
import type { BranchCreate, BranchCreateFromCommit } from '@/lib/api/types/article';

export async function createBranch(articleId: string, data: BranchCreate) {
  const branch = await branchesApi.create(data);
  revalidatePath(`/articles/${articleId}`);
  return branch;
}

export async function createBranchFromCommit(articleId: string, data: BranchCreateFromCommit) {
  const branch = await branchesApi.createFromCommit(articleId, data);
  revalidatePath(`/articles/${articleId}`);
  return branch;
}

export async function deleteBranch(branchId: string, articleId: string) {
  await branchesApi.delete(branchId);
  revalidatePath(`/articles/${articleId}`);
}

export async function mergeBranches(params: { sourceBranchId: string; targetBranchId: string; message?: string; articleId: string }) {
  await branchesApi.merge(params);
  revalidatePath(`/articles/${params.articleId}`);
}