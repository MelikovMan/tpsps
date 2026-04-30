// app/actions/articles.ts
'use server';

import { revalidatePath } from 'next/cache';
import { articlesApi } from '@/lib/api/articles';
import type { ArticleCreate, ArticleUpdate } from '@/lib/api/types/article';

export async function createArticle(data: ArticleCreate) {
  const article = await articlesApi.create(data);
  revalidatePath('/articles');
  return article;
}

export async function updateArticle(articleId: string, data: ArticleUpdate) {
  const article = await articlesApi.update(articleId, data);
  revalidatePath(`/articles/${articleId}`);
  return article;
}

export async function deleteArticle(articleId: string) {
  await articlesApi.delete(articleId);
  revalidatePath('/articles');
}