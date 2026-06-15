// app/articles/[id]/components/ArticleHeader.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { Box, Group, Title, Badge, Text, Select } from '@mantine/core';
import { IconGitBranch } from '@tabler/icons-react';
import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import type { ArticleFullResponse, BranchResponse } from '@/lib/api/types/article';

interface ArticleHeaderProps {
  article: ArticleFullResponse;
  branches: BranchResponse[];
  articleId: string;
}

export default function ArticleHeader({ article, branches, articleId }: ArticleHeaderProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const currentBranch = searchParams.get('branch') || 'main';
  const currentBranchObj = branches.find(b => b.name === currentBranch);

  const handleBranchChange = useCallback((value: string | null) => {
    const newBranch = value || 'main';
    const params = new URLSearchParams(searchParams);
    if (newBranch === 'main') {
      params.delete('branch');
    } else {
      params.set('branch', newBranch);
    }
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ''}`);
  }, [router, pathname, searchParams]);

  return (
    <Group justify="space-between" align="flex-start" mb="xl">
      <Box style={{ flex: 1 }}>
        <Title order={1} mb="sm">{article.title}</Title>
        <Group mb="md">
          <Text c="dimmed">
            Обновлено: {new Date(article.updated_at).toLocaleDateString()}
          </Text>
          <Badge
            color={
              article.status === 'published' ? 'green' :
              article.status === 'draft' ? 'blue' : 'gray'
            }
          >
            {article.status === 'published' ? 'Опубликовано' :
             article.status === 'draft' ? 'Черновик' : 'Архив'}
          </Badge>
          {currentBranchObj && (
            <Badge variant="outline" color="blue">
              {currentBranchObj.name}
            </Badge>
          )}
        </Group>
      </Box>
      <Select
        placeholder="Выберите ветку"
        data={branches.map(b => ({ value: b.name, label: b.name }))}
        value={currentBranch}
        onChange={handleBranchChange}
        w={180}
        leftSection={<IconGitBranch size="1rem" />}
      />
    </Group>
  );
}