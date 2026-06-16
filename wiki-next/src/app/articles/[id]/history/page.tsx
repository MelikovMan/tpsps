// app/articles/[id]/history/page.tsx
import { Suspense } from 'react';
import { Skeleton } from '@mantine/core';
import HistoryClient from './components/HistoryClient';

export const revalidate = 360; // ISR для страницы-обёртки (опционально)

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ branch?: string; page?: string }>;
}

export default async function HistoryPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { branch = 'main', page = '1' } = await searchParams;
  const currentPage = parseInt(page, 10);

  return (
    <Suspense fallback={<Skeleton height={500} animate />}>
      <HistoryClient articleId={id} branch={branch} currentPage={currentPage} />
    </Suspense>
  );
}