// app/articles/[id]/branches/create/page.tsx
import { getArticleBranches } from '../../../lib/data';
import { notFound, redirect } from 'next/navigation';
import { Card, Stack, TextInput, Textarea, Button, Group } from '@mantine/core';
import { createBranch, createBranchFromCommit } from '../actions/branches';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fromCommit?: string }>;
}

export default async function CreateBranchPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { fromCommit } = await searchParams;
  const branches = await getArticleBranches(id).catch(() => []);
  const mainBranch = branches.find(b => b.name === 'main');

  if (!mainBranch && !fromCommit) {
    return notFound();
  }

  async function handleSubmit(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (fromCommit) {
      await createBranchFromCommit(id, {
        name,
        description,
        source_commit_id: fromCommit,
      });
    } else if (mainBranch) {
      await createBranch(id, {
        article_id: id,
        name,
        description,
        head_commit_id: mainBranch.head_commit_id,
      });
    } else {
      throw new Error('Cannot create branch');
    }
    redirect(`/articles/${id}/branches`);
  }

  return (
    <Card withBorder>
      <form action={handleSubmit}>
        <Stack>
          <TextInput
            name="name"
            label="Название ветки"
            placeholder="feature/new-ui"
            required
          />
          <Textarea
            name="description"
            label="Описание"
            placeholder="Что будет в этой ветке"
            rows={3}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" component="a" href={`/articles/${id}/branches`}>Отмена</Button>
            <Button type="submit">Создать</Button>
          </Group>
        </Stack>
      </form>
    </Card>
  );
}