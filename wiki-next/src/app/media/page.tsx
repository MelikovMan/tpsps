// app/media/page.tsx
import { mediaApi } from '@/lib/api/media';
import MediaListClient from './MediaListClient';
import { Skeleton } from '@mantine/core';
import { Suspense } from 'react';

export default async function MediaPage() {
  // Предзагружаем первую страницу (без поиска и фильтров)
  const initialData = await mediaApi.getList({ page: 1, limit: 12 });
  return (
    <Suspense fallback={<Skeleton height={400} animate />}>
      <MediaListClient initialData={initialData} />
    </Suspense>
  );
}