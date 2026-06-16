// app/articles/[id]/branches/page.tsx
import { getArticleBranches } from '../../lib/data';
import { notFound } from 'next/navigation';
import { Stack, Group, Button, Title, Skeleton } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import BranchCard from './components/BranchCard';
import { Suspense } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function BranchesList({ id }: { id: string }) {
  const branches = await getArticleBranches(id);
  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Ветки</Title>
        <Link href={`/articles/${id}/branches/create`} style={{ textDecoration: 'none' }}>
          <Button leftSection={<IconPlus size="1rem" />}>Создать ветку</Button>
        </Link>
      </Group>
      {branches.map(branch => (
        <BranchCard key={branch.id} branch={branch} articleId={id} />
      ))}
    </Stack>
  );
}

export default async function BranchesPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<Skeleton height={300} animate />}>
      <BranchesList id={id} />
    </Suspense>
  );
}