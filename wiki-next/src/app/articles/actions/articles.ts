'use server';
import { revalidatePath, revalidateTag, updateTag } from 'next/cache';
import { articlesApi } from '@/lib/api/articles'; // используем тот же api, но на сервере
import { ArticleCreate, ArticleUpdate } from '@/lib/api/types/article';

export async function createArticle(data: ArticleCreate) {
  const article = await articlesApi.create(data);
  // Инвалидируем все запросы с тегом 'articles'
  revalidateTag('articles','max');
  revalidatePath('/articles');
  return article;
}

export async function updateArticle(articleId: string, data: ArticleUpdate) {
  const article = await articlesApi.update(articleId, data);
  revalidateTag('articles','max');
  revalidatePath(`/articles/${articleId}`);
  return article;
}

export async function deleteArticle(articleId: string) {
  await articlesApi.delete(articleId);
  revalidateTag('articles','max');
  revalidatePath('/articles');
}