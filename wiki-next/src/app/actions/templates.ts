// app/actions/templates.ts
'use server';

import { revalidatePath } from 'next/cache';
import { templatesApi } from '@/lib/api/templates';
import type { TemplateCreate, TemplateUpdate } from '@/lib/api/types/templates';

// Если потребуются мутации – раскомментировать
// export async function createTemplate(data: TemplateCreate) { ... }
// export async function updateTemplate(id: string, data: TemplateUpdate) { ... }
// export async function deleteTemplate(id: string) { ... }