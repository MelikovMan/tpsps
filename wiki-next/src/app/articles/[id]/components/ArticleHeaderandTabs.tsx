'use client';

import { useSearchParams } from 'next/navigation';
import { Tabs, Group, Box, Title, Badge, Text, Select, Button } from '@mantine/core';
import Link from 'next/link';
import { IconGitBranch, IconArticle, IconHistory, IconGitBranch as IconGitBranchTab, IconMessage, IconEdit } from '@tabler/icons-react';
import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { ArticleFullResponse, BranchResponse } from '@/lib/api/types/article';

interface ArticleHeaderAndTabsProps {
  article: ArticleFullResponse;
  branches: BranchResponse[];
  articleId: string;
  children: React.ReactNode;
}

export default function ArticleHeaderAndTabs({ article, branches, articleId, children }: ArticleHeaderAndTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { permissions } = useAuth();
  const canEdit = permissions?.can_edit ?? false;

  const currentBranch = searchParams.get('branch') || 'main';
  const currentBranchObj = branches.find(b => b.name === currentBranch);

  const activeTab = pathname.includes('/history') ? 'history'
    : pathname.includes('/branches') ? 'branches'
    : pathname.includes('/comments') ? 'comments'
    : 'content';

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
    <div>
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
        <Group>
          <Select
            placeholder="Выберите ветку"
            data={branches.map(b => ({ value: b.name, label: b.name }))}
            value={currentBranch}
            onChange={handleBranchChange}
            w={180}
            leftSection={<IconGitBranch size="1rem" />}
          />
          {canEdit && (
            <Button
              component={Link}
              href={`/articles/${articleId}/edit?branch=${currentBranch}`}
              leftSection={<IconEdit size="1rem" />}
              variant="light"
            >
              Редактировать
            </Button>
          )}
        </Group>
      </Group>

      {/* Вкладки (без изменений) */}
      <Tabs value={activeTab}>
        <Tabs.List mb="md">
          <Tabs.Tab
            value="content"
            component={Link}
            href={`/articles/${articleId}?branch=${currentBranch}`}
            leftSection={<IconArticle size="1rem" />}
          >
            Содержание
          </Tabs.Tab>
          <Tabs.Tab
            value="history"
            component={Link}
            href={`/articles/${articleId}/history?branch=${currentBranch}`}
            leftSection={<IconHistory size="1rem" />}
          >
            История изменений
          </Tabs.Tab>
          <Tabs.Tab
            value="branches"
            component={Link}
            href={`/articles/${articleId}/branches?branch=${currentBranch}`}
            leftSection={<IconGitBranchTab size="1rem" />}
          >
            Ветки
          </Tabs.Tab>
          <Tabs.Tab
            value="comments"
            component={Link}
            href={`/articles/${articleId}/comments?branch=${currentBranch}`}
            leftSection={<IconMessage size="1rem" />}
          >
            Комментарии
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {children}
    </div>
  );
}