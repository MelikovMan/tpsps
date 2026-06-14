'use server';

import { revalidatePath } from 'next/cache';
import { profileApi } from '@/lib/api/profile';
import type { CreateProfileData, UpdateProfileData } from '@/lib/api/types/profile';

export async function createProfile(data: CreateProfileData) {
  const profile = await profileApi.create(data);
  revalidatePath('/profile');
  return profile;
}

export async function updateProfile(data: UpdateProfileData) {
  const profile = await profileApi.update(data);
  revalidatePath('/profile');
  return profile;
}

export async function deleteProfile() {
  await profileApi.delete();
  revalidatePath('/profile');
}