import { categoriesApi } from '@/lib/api/categories';
import { notFound } from 'next/navigation';
import CategoryClient from './CategoryClient';

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const category = await categoriesApi.getById(id);
    const initialArticles = await categoriesApi.getArticles(id, false, 0, 10);
    return <CategoryClient category={category} initialArticles={initialArticles} />;
  } catch (error) {
    notFound();
  }
}