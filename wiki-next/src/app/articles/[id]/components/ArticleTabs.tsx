'use client';

import { Tabs } from '@mantine/core';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconArticle, IconHistory, IconGitBranch, IconMessage } from '@tabler/icons-react';

interface ArticleTabsProps {
  articleId: string;
  currentBranch: string;
  children: React.ReactNode;
}

export default function ArticleTabs({ articleId, currentBranch, children }: ArticleTabsProps) {
  const pathname = usePathname();

  // Определяем активную вкладку по текущему пути
  const getActiveTab = () => {
    if (pathname.includes('/history')) return 'history';
    if (pathname.includes('/branches')) return 'branches';
    if (pathname.includes('/comments')) return 'comments';
    return 'content';
  };

  const activeTab = getActiveTab();
  return (
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
          leftSection={<IconGitBranch size="1rem" />}
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

      {children}
    </Tabs>
  );
}