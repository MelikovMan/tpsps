'use server';

import { revalidatePath } from 'next/cache';
import { usersApi } from '@/lib/api/users';
import type { UserCreate, UserUpdate } from '@/lib/api/types/users';

export async function createUser(data: UserCreate) {
  const user = await usersApi.create(data);
  revalidatePath('/users');
  return user;
}

export async function updateUser(userId: string, data: UserUpdate) {
  const user = await usersApi.update(userId, data);
  revalidatePath('/users');
  revalidatePath(`/users/${userId}`);
  return user;
}

export async function deleteUser(userId: string) {
  await usersApi.delete(userId);
  revalidatePath('/users');
}