'use server';

import { revalidatePath } from 'next/cache';
import { mediaApi } from '@/lib/api/media';

export async function uploadMedia(formData: FormData, articleId?: string, commitId?: string) {
  const result = await mediaApi.upload(formData, articleId, commitId);
  revalidatePath('/media');
  return result;
}

export async function deleteMedia(mediaId: string) {
  await mediaApi.delete(mediaId);
  revalidatePath('/media');
}