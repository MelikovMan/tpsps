import { Suspense } from 'react';
import { Skeleton } from '@mantine/core';
import { getAllCategoriesFlat, getTemplates } from '../lib/data';
import ArticleCreateForm from '@/components/ArticleCreateForm';

export default async function CreateArticlePage() {
  const [categories, templates] = await Promise.all([
    getAllCategoriesFlat(),
    getTemplates(),
  ]);
  return (
    <Suspense fallback={<Skeleton height={600} />}>
      <ArticleCreateForm initialCategories={categories} initialTemplates={templates} />
    </Suspense>
  );
}