import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Skeleton } from '@mantine/core';
import { getArticle, getArticleBranches, getAllCategoriesFlat, getTemplates, getArticleCategories } from '../../lib/data';
import ArticleEditForm from '@/components/ArticleEditForm';


interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ branch?: string }>;
}

export default async function EditArticlePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { branch = 'main' } = await searchParams;
  try {
    const [article, branches, articleCats, allCats, templates] = await Promise.all([
      getArticle(id, branch, false),
      getArticleBranches(id),
      getArticleCategories(id),
      getAllCategoriesFlat(),
      getTemplates(),
    ]);
    return (
      <Suspense fallback={<Skeleton height={600} />}>
        <ArticleEditForm
          article={article}
          branches={branches}
          articleCategories={articleCats}
          allCategories={allCats}
          templates={templates}
          currentBranch={branch}
        />
      </Suspense>
    );
  } catch {
    notFound();
  }
}