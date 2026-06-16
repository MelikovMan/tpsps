// app/articles/[id]/history/components/HistoryClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { Stack, Paper, Text, Pagination, Skeleton, Group, Badge, Timeline, Box } from '@mantine/core';
import { IconUser, IconCalendar, IconGitCommit, IconGitMerge } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

interface Commit {
  id: string;
  message: string;
  author_id: string;
  created_at: string;
  is_merge: boolean;
  content_diff?: string;
}

interface HistoryClientProps {
  articleId: string;
  branch: string;
  currentPage: number;
}

export default function HistoryClient({ articleId, branch, currentPage }: HistoryClientProps) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/articles/${articleId}/commits?branch=${branch}&page=${currentPage}`)
      .then(res => res.json())
      .then(data => {
        setCommits(data.commits);
        setTotalCount(data.total);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [articleId, branch, currentPage]);

  const totalPages = Math.ceil(totalCount / limit);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams();
    if (branch && branch !== 'main') params.set('branch', branch);
    params.set('page', page.toString());
    router.push(`/articles/${articleId}/history?${params.toString()}`);
  };

  if (loading) return <Skeleton height={500} animate />;

  if (!commits.length) {
    return (
      <Paper withBorder p="xl" radius="md">
        <Text ta="center" c="dimmed">Коммиты не найдены</Text>
      </Paper>
    );
  }

  return (
    <Stack>
      <Timeline active={-1} bulletSize={24} lineWidth={2}>
        {commits.map((commit) => (
          <Timeline.Item
            key={commit.id}
            bullet={commit.is_merge ? <IconGitMerge size="0.8rem" /> : <IconGitCommit size="0.8rem" />}
            title={
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Box style={{ flex: 1 }}>
                  <Group gap="xs">
                    <Text fw={500}>{commit.message}</Text>
                    {commit.is_merge && <Badge color="blue" size="sm">Merge</Badge>}
                  </Group>
                  <Group gap="xs" c="dimmed" mt={4}>
                    <IconUser size="0.7rem" />
                    <Text size="xs">{commit.author_id}</Text>
                    <IconCalendar size="0.7rem" />
                    <Text size="xs">{new Date(commit.created_at).toLocaleString()}</Text>
                  </Group>
                </Box>
              </Group>
            }
          >
            {commit.content_diff && (
              <Paper withBorder p="xs" mt="xs" bg="gray.0">
                <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
                  {commit.content_diff.length > 200
                    ? `${commit.content_diff.substring(0, 200)}...`
                    : commit.content_diff}
                </Text>
              </Paper>
            )}
          </Timeline.Item>
        ))}
      </Timeline>

      {totalPages > 1 && (
        <Pagination
          value={currentPage}
          total={totalPages}
          onChange={handlePageChange}
          mt="xl"
        />
      )}
    </Stack>
  );
}