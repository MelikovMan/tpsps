'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Box, Card, Title, Text, Skeleton, Group, Tabs, Select, Badge, Alert
} from '@mantine/core';
import {
  IconArticle, IconHistory, IconGitBranch, IconEye, IconMessage, IconAlertCircle
} from '@tabler/icons-react';
import { useAuth } from '@/context/AuthContext';
import CommitsHistory from '@/components/CommitsHistory';
import BranchesPanel from '@/components/BranchesPanel';
import CommentsSection from '@/components/CommentsSection';
import ArticleNavigation from '@/components/ArticleNavigation'
import type { ArticleFullResponse, BranchResponse, CommitResponse } from '@/lib/api/types/article';
import type {CommentResponse} from '@/lib/api/types/comment';
import Link from 'next/link';

interface ArticleDetailProps {
  article: ArticleFullResponse;
  branches: BranchResponse[];
  initialCommits: CommitResponse[];
  initialComments: CommentResponse[];
  currentBranch: string;
}

export default function ArticleDetail({
  article,
  branches,
  initialCommits,
  initialComments,
  currentBranch,
}: ArticleDetailProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [selectedBranch, setSelectedBranch] = useState(currentBranch);
  const [activeTab, setActiveTab] = useState<string | null>('content');

  // При изменении ветки обновляем URL
  const handleBranchChange = (value: string | null) => {
    const newBranch = value || 'main';
    setSelectedBranch(newBranch);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    if (newBranch !== 'main') {
      newSearchParams.set('branch', newBranch);
    } else {
      newSearchParams.delete('branch');
    }
    const query = newSearchParams.toString();
    router.replace(`/articles/${params.id}${query ? `?${query}` : ''}`);
  };

  const currentBranchObj = branches.find(b => b.name === selectedBranch) || null;
  const commentsHref = `/articles/${params.id}${currentBranch !== 'main' ? `/${currentBranch}` : ''}/comments`
  return (
    <Box>
      {/* Header */}
      <Group justify="space-between" align="flex-start" mb="xl">
        <Box style={{ flex: 1 }}>
          <Title order={1} mb="sm">{article.title}</Title>
          <Group mb="md">
            <Text c="dimmed">
              Обновлено: {new Date(article.updated_at).toLocaleDateString()}
            </Text>
            <Badge color={
              article.status === 'published' ? 'green' : 
              article.status === 'draft' ? 'blue' : 'gray'
            }>
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
          <ArticleNavigation articleId={params.id as string} currentBranch={selectedBranch} />
        </Group>
      </Group>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List mb="md">
          <Tabs.Tab value="content" leftSection={<IconArticle size="1rem" />}>Содержание</Tabs.Tab>
          <Tabs.Tab value="history" leftSection={<IconHistory size="1rem" />}>История изменений</Tabs.Tab>
          <Tabs.Tab value="branches" leftSection={<IconGitBranch size="1rem" />}>Ветки</Tabs.Tab>
      <Tabs.Tab
        value="comments"
        component={Link}
        href={commentsHref}
        leftSection={<IconMessage size="1rem" />}
      >
        Комментарии
      </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="content">
          <Card withBorder p="xl" radius="md">
            <div dangerouslySetInnerHTML={{ __html: article.content }} />
          </Card>
          {currentBranchObj && currentBranchObj.name !== 'main' && (
            <Card withBorder p="md" mt="md" bg="blue.0">
              <Group>
                <IconEye size="1rem" />
                <Text size="sm">
                  Вы просматриваете содержимое ветки <strong>{currentBranchObj.name}</strong>
                  {currentBranchObj.description && (
                    <Text component="span" c="dimmed"> - {currentBranchObj.description}</Text>
                  )}
                </Text>
              </Group>
            </Card>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="history">
          <CommitsHistory
            articleId={params.id as string}
            selectedBranchId={currentBranchObj?.id}
            initialCommits={initialCommits}
          />
        </Tabs.Panel>

        <Tabs.Panel value="branches">
          <BranchesPanel articleId={params.id as string} initialBranches={branches} />
        </Tabs.Panel>

      </Tabs>
    </Box>
  );
}

// ArticleNavigation остаётся практически без изменений, только с заменой Link на next/link
