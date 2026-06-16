// app/actions/categories.ts
'use server';

import { revalidatePath } from 'next/cache';
import { categoriesApi } from '@/lib/api/categories';
import type { CategoryCreate, CategoryUpdate } from '@/lib/api/types/categories';

export async function createCategory(data: CategoryCreate) {
  const category = await categoriesApi.create(data);
  revalidatePath('/categories');
  return category;
}

export async function updateCategory(id: string, data: CategoryUpdate) {
  const category = await categoriesApi.update(id, data);
  revalidatePath('/categories');
  revalidatePath(`/categories/${id}`);
  return category;
}

export async function deleteCategory(id: string) {
  await categoriesApi.delete(id);
  revalidatePath('/categories');
}