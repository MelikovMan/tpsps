// app/articles/[id]/history/components/CommitList.tsx
'use client'
import {
  Stack, Paper, Group, Text, Badge, Timeline, Pagination, Skeleton, Box
} from '@mantine/core';
import { IconUser, IconCalendar, IconGitCommit, IconGitMerge } from '@tabler/icons-react';
import type { CommitResponse } from '@/lib/api/types/article';
import Link from 'next/link';

interface CommitListProps {
  commits: CommitResponse[];
  totalCount: number;
  currentPage: number;
  baseUrl: string; // например, `/articles/${id}/history`
  branch?: string;
}

export default function CommitList({
  commits,
  totalCount,
  currentPage,
  baseUrl,
  branch,
}: CommitListProps) {
  const limit = 20;
  const totalPages = Math.ceil(totalCount / limit);

  // Функция для построения URL пагинации с сохранением параметра branch
  const getPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (branch && branch !== 'main') params.set('branch', branch);
    params.set('page', page.toString());
    return `${baseUrl}?${params.toString()}`;
  };

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
                {/* Можно добавить ссылку на детали коммита, если нужно */}
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
          getItemProps={(page) => ({
            component: Link,
            href: getPageUrl(page),
          })}
          mt="xl"
        />
      )}
    </Stack>
  );
}