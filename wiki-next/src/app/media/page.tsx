// app/media/page.tsx
import { mediaApi } from '@/lib/api/media';
import MediaListClient from './MediaListClient';

export default async function MediaPage() {
  // Предзагружаем первую страницу (без поиска и фильтров)
  const initialData = await mediaApi.getList({ page: 1, limit: 12 });
  return <MediaListClient initialData={initialData} />;
}