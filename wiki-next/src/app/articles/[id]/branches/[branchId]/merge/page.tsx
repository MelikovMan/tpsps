// app/articles/[id]/branches/[branchId]/merge/page.tsx
import { notFound, redirect } from 'next/navigation';
import { branchesApi } from '@/lib/api/branches';
import { getArticleBranches } from '@/app/articles/lib/data';
import { Card, Stack, Select, TextInput, Button, Group, Alert } from '@mantine/core';
import { mergeBranches } from '@/app/actions/branches';

interface PageProps {
  params: Promise<{ id: string; branchId: string }>;
}

export default async function MergeBranchPage({ params }: PageProps) {
  const { id, branchId } = await params;
  let sourceBranch, allBranches;
  try {
    sourceBranch = await branchesApi.getById(branchId);
    allBranches = await getArticleBranches(id);
  } catch {
    notFound();
  }

  if (sourceBranch.name === 'main') {
    return notFound(); // нельзя объединять main
  }

  const targetBranches = allBranches.filter(b => b.id !== branchId && b.name !== 'main');

  async function handleSubmit(formData: FormData) {
    'use server';
    const targetBranchId = formData.get('targetBranchId') as string;
    const message = formData.get('message') as string;
    if (!targetBranchId) throw new Error('Выберите целевую ветку');
    await mergeBranches(branchId, targetBranchId, message || undefined, id);
    redirect(`/articles/${id}/branches`);
  }

  return (
    <Card withBorder>
      <form action={handleSubmit}>
        <Stack>
          <Alert>Объединение ветки <strong>{sourceBranch.name}</strong> с целевой</Alert>
          <Select
            name="targetBranchId"
            label="Целевая ветка"
            data={targetBranches.map(b => ({ value: b.id, label: b.name }))}
            required
          />
          <TextInput
            name="message"
            label="Сообщение коммита"
            placeholder={`Merge branch '${sourceBranch.name}'`}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" component="a" href={`/articles/${id}/branches`}>Отмена</Button>
            <Button type="submit">Объединить</Button>
          </Group>
        </Stack>
      </form>
    </Card>
  );
}