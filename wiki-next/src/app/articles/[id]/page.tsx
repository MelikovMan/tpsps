// app/articles/[id]/page.tsx
import { Suspense } from 'react';
import { getArticle, getArticles } from '../lib/data';
import { Skeleton } from '@mantine/core';
import BranchAwareArticleBody from './components/BranchAwareArticleBody';

export const revalidate = 600; // ISR

// Генерируем статические пути для популярных статей (опционально)
export async function generateStaticParams() {
  const articles = await getArticles({ limit: 100, status: 'published' }, true); // publicAccess
  return articles.items.map((article) => ({ id: article.id }));
}

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