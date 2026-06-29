'use server';

import { revalidatePath, revalidateTag, updateTag } from 'next/cache';
import { branchesApi } from '@/lib/api/branches';
import type { BranchCreate, BranchCreateFromCommit } from '@/lib/api/types/article';

export async function createBranch(articleId: string, data: BranchCreate) {
  const branch = await branchesApi.create(data);
  revalidateTag(`branches-${articleId}`, 'max');
  revalidatePath(`/articles/${articleId}/branches`);
  return branch;
}

export async function createBranchFromCommit(articleId: string, data: BranchCreateFromCommit) {
  const branch = await branchesApi.createFromCommit(articleId, data);
  revalidateTag(`branches-${articleId}`, 'max');
  revalidatePath(`/articles/${articleId}/branches`);
  return branch;
}

export async function updateBranch(branchId: string, data: any) {
  const branch = await branchesApi.update(branchId, data);
  revalidateTag(`branches-${branchId}`, 'max');
  revalidatePath(`/articles/${branchId.split('/')[0]}/branches`);
  return branch;
}

export async function deleteBranch(branchId: string, articleId: string) {
  await branchesApi.delete(branchId);
  revalidateTag(`branches-${articleId}`, 'max');
  revalidatePath(`/articles/${articleId}/branches`);
}

export async function mergeBranches(sourceBranchId: string, targetBranchId: string, message?: string, articleId?: string) {
  await branchesApi.merge({ sourceBranchId, targetBranchId, message });
  if (articleId) {
    revalidateTag(`branches-${articleId}`, 'max');
    revalidatePath(`/articles/${articleId}/branches`);
  }
}