// app/articles/page.tsx
import { Suspense } from 'react';
import ArticlesList from './components/ArticleList';
import { Skeleton } from '@mantine/core';
import { getArticles } from './lib/data';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    q?: string;         // поисковый запрос
    lang?: string;      // язык
    fields?: string;    // область поиска
    hybrid?: string;    // 'true' или 'false'
  }>;
}

export default async function ArticlesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const limit = 10;
  const skip = (page - 1) * limit;
  
  const articlesData = getArticles({
    skip,
    limit,
    status: params.status,
    search: params.q,
    language: params.lang,
    fields: params.fields,
    hybrid: params.hybrid === 'true',
  });
  
  return (
    <div>
      <h1>Список статей</h1>
      <Suspense fallback={<Skeleton height={400} />}>
        <ArticlesList 
          searchParams={params} 
          dataPromise={articlesData} 
        />
      </Suspense>
    </div>
  );
}