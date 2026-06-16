import { moderationApi } from '@/lib/api/moderation';
import ModerationClient from './ModerationClient';

export default async function ModerationPage() {
  // Предзагружаем заявки со статусом "pending" (или можно без фильтра)
  const initialModerations = await moderationApi.getList('pending');
  return <ModerationClient initialModerations={initialModerations} />;
}