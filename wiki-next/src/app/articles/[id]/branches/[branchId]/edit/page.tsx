// app/articles/[id]/branches/[branchId]/edit/page.tsx
import { notFound, redirect } from 'next/navigation';
import { branchesApi } from '@/lib/api/branches';
import { Card, Stack, TextInput, Textarea, Button, Group } from '@mantine/core';
import { updateBranch } from '../../actions/branches';

interface PageProps {
  params: Promise<{ id: string; branchId: string }>;
}

export default async function EditBranchPage({ params }: PageProps) {
  const { id, branchId } = await params;
  let branch;
  try {
    branch = await branchesApi.getById(branchId);
  } catch {
    notFound();
  }

  async function handleSubmit(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    await updateBranch(branchId, { name, description });
    redirect(`/articles/${id}/branches`);
  }

  return (
    <Card withBorder>
      <form action={handleSubmit}>
        <Stack>
          <TextInput
            name="name"
            label="Название ветки"
            defaultValue={branch.name}
            required
          />
          <Textarea
            name="description"
            label="Описание"
            defaultValue={branch.description || ''}
            rows={3}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" component="a" href={`/articles/${id}/branches`}>Отмена</Button>
            <Button type="submit">Сохранить</Button>
          </Group>
        </Stack>
      </form>
    </Card>
  );
}