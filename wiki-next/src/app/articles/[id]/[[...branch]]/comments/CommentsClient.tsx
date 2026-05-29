'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container, Title, Text, Group, Badge, Select, Breadcrumbs, Anchor, Stack, Box,
} from '@mantine/core';
import { IconGitBranch, IconMessage } from '@tabler/icons-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import CommentsSection from '@/components/CommentsSection';
import type { ArticleFullResponse, BranchResponse } from '@/lib/api/types/article';
import type { CommentResponse } from '@/lib/api/types/comment';

interface Props {
  article: ArticleFullResponse;
  branches: BranchResponse[];
  initialComments: CommentResponse[];
  currentBranch: string;
}

export default function CommentsClient({
  article,
  branches,
  initialComments,
  currentBranch,
}: Props) {
  const router = useRouter();
  const [selectedBranch, setSelectedBranch] = useState(currentBranch);
  const currentBranchObj = branches.find(b => b.name === selectedBranch);

  const articleUrl = `/articles/${article.id}${selectedBranch !== 'main' ? `/${selectedBranch}` : ''}`;

  const handleBranchChange = (value: string | null) => {
    const newBranch = value || 'main';
    setSelectedBranch(newBranch);
    const query = newBranch !== 'main' ? `?branch=${newBranch}` : '';
    router.push(`/articles/${article.id}/comments${query}`);
  };

  return (
    <Container size="lg" py="xl">
      <Breadcrumbs mb="md">
        <Anchor component={Link} href="/articles">Статьи</Anchor>
        <Anchor component={Link} href={articleUrl}>{article.title}</Anchor>
        <Text c="dimmed">Комментарии</Text>
      </Breadcrumbs>

      <Group justify="space-between" align="flex-start" mb="xl">
        <Box style={{ flex: 1 }}>
          <Title order={1} mb="sm">{article.title}</Title>
          <Group mb="md">
            <Text c="dimmed">Обновлено: {new Date(article.updated_at).toLocaleDateString()}</Text>
            <Badge color={
              article.status === 'published' ? 'green' : 
              article.status === 'draft' ? 'blue' : 'gray'
            }>
              {article.status === 'published' ? 'Опубликовано' : 
               article.status === 'draft' ? 'Черновик' : 'Архив'}
            </Badge>
            {currentBranchObj && (
              <Badge variant="outline" color="blue">{currentBranchObj.name}</Badge>
            )}
          </Group>
        </Box>
        <Group>
          {branches.length > 0 && (
            <Select
              placeholder="Выберите ветку"
              data={branches.map(b => ({ value: b.name, label: b.name }))}
              value={selectedBranch}
              onChange={handleBranchChange}
              w={180}
              leftSection={<IconGitBranch size="1rem" />}
            />
          )}
        </Group>
      </Group>

      <Stack gap="lg">
        <Group>
          <IconMessage size="1.2rem" />
          <Text size="lg" fw={600}>
            Комментарии
          </Text>
        </Group>
        <CommentsSection articleId={article.id} initialComments={initialComments} />
      </Stack>
    </Container>
  );
}