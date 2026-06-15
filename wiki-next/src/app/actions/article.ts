'use server';

import { revalidatePath, revalidateTag, updateTag } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };
  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `API error ${res.status}`);
  }
  return res.json();
}

export async function createArticle(data: {
  title: string;
  content: string;
  status: string;
  article_type: string;
  message: string;
}) {
  const article = await fetchAPI<any>('/articles/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  updateTag('articles');
  revalidatePath('/articles');
  redirect(`/articles/${article.id}`);
}

export async function updateArticle(
  articleId: string,
  branch: string,
  data: { content: string; message: string }
) {
  try {
    const article = await fetchAPI<any>(`/articles/${articleId}?branch=${branch}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    updateTag(`article-${articleId}`);
    updateTag(`branches-${articleId}`);
    revalidatePath(`/articles/${articleId}`);
    redirect(`/articles/${articleId}?branch=${branch}`);
  } catch (error: any) {
    if (error.message.includes('409') || error.message.includes('Conflict')) {
      // Пробрасываем конфликт клиенту
      throw new Error('CONFLICT');
    }
    throw error;
  }
}

export async function createBranchFromCommit(
  articleId: string,
  sourceCommitId: string,
  newBranchName: string,
  description?: string
) {
  const branch = await fetchAPI<any>(`/branches/article/${articleId}/from-commit`, {
    method: 'POST',
    body: JSON.stringify({
      name: newBranchName,
      source_commit_id: sourceCommitId,
      description,
    }),
  });
  updateTag(`branches-${articleId}`);
  revalidatePath(`/articles/${articleId}/branches`);
  return branch;
}

export async function addArticleCategory(articleId: string, categoryId: string) {
  await fetchAPI(`/articles/${articleId}/categories`, {
    method: 'POST',
    body: JSON.stringify([categoryId]),
  });
  updateTag(`categories-${articleId}`);
  revalidatePath(`/articles/${articleId}/edit`);
}

export async function removeArticleCategory(articleId: string, categoryId: string) {
  await fetchAPI(`/articles/${articleId}/categories/${categoryId}`, {
    method: 'DELETE',
  });
  updateTag(`categories-${articleId}`);
  revalidatePath(`/articles/${articleId}/edit`);
}