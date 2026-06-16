'use server';

import { revalidatePath } from 'next/cache';
import { moderationApi } from '@/lib/api/moderation';
import type { ModerationUpdate } from '@/lib/api/types/moderation';

export async function updateModeration(id: string, data: ModerationUpdate) {
  const result = await moderationApi.update(id, data);
  revalidatePath('/moderation');
  return result;
}