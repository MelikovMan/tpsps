'use server';
import { revalidatePath, updateTag } from 'next/cache';
import { articlesApi } from '@/lib/api/articles'; // используем тот же api, но на сервере
import { ArticleCreate, ArticleUpdate } from '@/lib/api/types/article';

export async function createArticle(data: ArticleCreate) {
  const article = await articlesApi.create(data);
  // Инвалидируем все запросы с тегом 'articles'
  updateTag('articles');
  revalidatePath('/articles');
  return article;
}

export async function updateArticle(articleId: string, data: ArticleUpdate) {
  const article = await articlesApi.update(articleId, data);
  updateTag('articles');
  revalidatePath(`/articles/${articleId}`);
  return article;
}

export async function deleteArticle(articleId: string) {
  await articlesApi.delete(articleId);
  updateTag('articles');
  revalidatePath('/articles');
}