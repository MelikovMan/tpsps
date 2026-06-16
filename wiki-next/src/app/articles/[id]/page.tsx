// app/articles/[id]/page.tsx
import { Suspense } from 'react';
import { getArticle, getArticles } from '../lib/data';
import { Skeleton } from '@mantine/core';
import BranchAwareArticleBody from './components/BranchAwareArticleBody';

export const revalidate = 600; // ISR

// Генерируем статические пути для популярных статей (опционально)

export async function generateStaticParams() {
  // Если стратегия не SSG – ничего не генерируем заранее
  if (process.env.BUILD_STRATEGY !== 'ssg') {
    return [{
      id: '550e8400-e29b-41d4-a716-446655440001',
    }];
  }

  // Иначе – загружаем все опубликованные статьи и генерируем для них страницы
  try {
    const articles = await getArticles({ 
      limit: 1000,              // можно увеличить, если статей много
      status: 'published' 
    }, true);                   // publicAccess = true (без cookies)

    return articles.items.map((article: { id: string }) => ({
      id: article.id,
    }));
  } catch (error) {
    console.error('Failed to generate static paths for articles:', error);
    throw Error;
  }
}
export const dynamicParams = true;
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ArticlePage({ params }: PageProps) {
  const { id } = await params;
  // Загружаем данные основной ветки (главное содержимое)
  const article = await getArticle(id, 'main', true, true);

  return (
    <Suspense fallback={<Skeleton height={400} animate />}>
      <BranchAwareArticleBody
        articleId={id}
        initialBranch="main"
        initialContent={article.content}
      />
    </Suspense>
  );
}