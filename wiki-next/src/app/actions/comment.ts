'use server';

import { commentsApi } from '@/lib/api/comments';
import { revalidatePath } from 'next/cache';
import type { CommentCreate, CommentUpdate } from '@/lib/api/types/comment';

export async function addComment(data: CommentCreate) {
  const comment = await commentsApi.create(data);
  revalidatePath(`/articles/${data.article_id}`);
  return comment;
}

export async function editComment(commentId: string, data: CommentUpdate) {
  const comment = await commentsApi.update(commentId, data);
  revalidatePath(`/articles/${comment.article_id}`); // предполагается, что ответ содержит article_id
  return comment;
}

export async function removeComment(commentId: string) {
  await commentsApi.delete(commentId);
  // Так как мы не знаем article_id, можно инвалидировать общий путь или передать article_id параметром
  // Например, revalidatePath('/articles/[id]', 'page');
  // Для простоты можно сделать реимпорт всех страниц статей, но лучше передавать article_id.
}