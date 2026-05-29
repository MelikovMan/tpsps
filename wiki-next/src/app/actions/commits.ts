// app/actions/commits.ts
'use server';

import { revalidatePath } from 'next/cache';
import { commitsApi } from '@/lib/api/commits';
import type { CommitCreate } from '@/lib/api/types/article';

export async function createCommit(articleId: string, data: CommitCreate) {
  const commit = await commitsApi.create(articleId, data);
  revalidatePath(`/articles/${articleId}`);
  return commit;
}

export async function revertCommit(commitId: string, articleId: string) {
  const commit = await commitsApi.revert(commitId);
  revalidatePath(`/articles/${articleId}`);
  return commit;
}