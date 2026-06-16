// app/media/upload/page.tsx
import { Skeleton } from '@mantine/core';
import MediaUploadClient from './MediaUploadClient';
import { Suspense } from 'react';

export default function MediaUploadPage() {
  return (
    <Suspense fallback={<Skeleton height={400} animate />}>
      <MediaUploadClient />
    </Suspense>
  );
}