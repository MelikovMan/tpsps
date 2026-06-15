import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { ArticleFullResponse, BranchResponse, CommitResponse } from '@/lib/api/types/article';
import { CommentResponse } from '@/lib/api/types/comment';
import { CategoryResponse } from '@/lib/api/types/categories';
import { TemplateResponse } from '@/lib/api/types/templates';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

type FetchOptions = RequestInit & {
  publicAccess?: boolean;
  next?: {
    tags?: string[];
    revalidate?: number | false;
  };
};

// Базовый fetch с авторизацией через cookies
async function fetchAPI<T>(endpoint: string, options?: FetchOptions): Promise<T> {

  const { publicAccess = false, ...fetchOptions } = options || {};

  let token: string | undefined;

   if (!publicAccess) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get('access_token')?.value;
    } catch (error) {
      // В статическом контексте (generateStaticParams / build) cookies() выбрасывает ошибку
      console.warn(`Cannot access cookies (static generation) for ${endpoint}, continuing without auth`);
    }
  }

  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...fetchOptions?.headers,
  };
  
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
    // Включаем кеширование Next.js
    next: { tags: fetchOptions?.next?.tags || [] }, // теги для инвалидации
  });
  
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

// Кеширование React для одного запроса в рамках рендера
export const getArticles = cache(async (
  params: {
    skip?: number;
    limit?: number;
    status?: string;
    search?: string;
    language?: string;
    fields?: string;
    hybrid?: boolean;
  },
  publicAccess = false
) => {
  const isSearchMode = !!params.search;
  const urlParams = new URLSearchParams();
  
  if (isSearchMode) {
    // Для поискового эндпоинта используем q, offset, hybrid и т.д.
    urlParams.append('q', params.search!);
    urlParams.append('offset', (params.skip ?? 0).toString());
    urlParams.append('limit', (params.limit ?? 10).toString());
    if (params.language) urlParams.append('language', params.language);
    if (params.fields) urlParams.append('fields', params.fields);
    if (params.hybrid !== undefined) urlParams.append('hybrid', params.hybrid ? 'true' : 'false');
    // при необходимости можно добавить status, если бэкенд поддерживает
  } else {
    // Для обычного списка статей
    urlParams.append('skip', (params.skip ?? 0).toString());
    urlParams.append('limit', (params.limit ?? 10).toString());
    if (params.status) urlParams.append('status', params.status);
    if (params.search) urlParams.append('search', params.search);
  }
  
  const endpoint = isSearchMode ? '/search/' : '/articles/';
  const data = await fetchAPI<any>(`${endpoint}?${urlParams.toString()}`, { publicAccess });
  
  if (isSearchMode) {
    return {
      items: data.results,
      total: data.total,
      isSearch: true,
    };
  } else {
    return {
      items: data,
      total: data.length,
      isSearch: false,
    };
  }
});

// Для получения одной статьи (можно использовать в generateStaticParams)
export const getArticle = cache(async (
  id: string,
  branch = 'main',
  renderTemplates = true,
  publicAccess = false
) => {
  const params = new URLSearchParams({
    branch,
    render_templates: renderTemplates.toString(),
  });
  return fetchAPI<ArticleFullResponse>(`/articles/${id}?${params}`, {
    publicAccess,
    next: { tags: [`article-${id}`] },
  });
});


export const getArticleBranches = cache(async (articleId: string, publicAccess = false) => {
  return fetchAPI<BranchResponse[]>(`/branches/article/${articleId}`, {
    publicAccess,
    next: { tags: [`branches-${articleId}`] },
  });
});
export const getArticleCommits = cache(async (
  articleId: string,
  branchId?: string,
  skip = 0,
  limit = 20,
  withTotal = true,
  publicAccess = false
): Promise<{ items: CommitResponse[]; total: number }> => {
  const params = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString(),
    with_total: withTotal.toString(),
  });
  const endpoint = branchId
    ? `/commits/branch/${branchId}?${params}`
    : `/commits/article/${articleId}?${params}`;
  const data = await fetchAPI<any>(endpoint, {
    publicAccess,
    next: { tags: [`commits-${articleId}`] },
  });
  
  if (withTotal && data.items && typeof data.total === 'number') {
    return { items: data.items, total: data.total };
  }
  // fallback на случай, если бэкенд вернул массив
  return { items: Array.isArray(data) ? data : [], total: Array.isArray(data) ? data.length : 0 };
});
export const getArticleComments = cache(async (articleId: string) => {
  return fetchAPI<CommentResponse[]>(`/comments/article/${articleId}`, 
    {
    next: { tags: [`commits-${articleId}`] }
  });
});

export const getAllCategoriesFlat = cache(async () => {
  return fetchAPI<CategoryResponse[]>('/categories/flat', {next: { tags: ['categories'] }});
});

export const getTemplates = cache(async () => {
  return fetchAPI<TemplateResponse[]>('/templates/', {next: { tags: ['templates'] }});
});
export const getArticleCategories = cache(async (articleId: string) => {
  return fetchAPI<CategoryResponse[]>(`/articles/${articleId}/categories`, 
  {next: { 
    tags: [`categories-${articleId}`] 
  }});
});
