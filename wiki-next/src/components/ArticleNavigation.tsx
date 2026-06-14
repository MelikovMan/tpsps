'use client';

import Link from 'next/link';
import { Button, Menu, ActionIcon, Group } from '@mantine/core';
import { IconEdit, IconHistory, IconGitBranch, IconDots, IconEye, IconMessage } from '@tabler/icons-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ArticleNavigationProps {
  articleId: string;
  currentBranch: string;
}

export default function ArticleNavigation({ articleId, currentBranch }: ArticleNavigationProps) {
  const pathname = usePathname();
  const { permissions } = useAuth();
  const canEdit = permissions?.can_edit;

  const branchQuery = currentBranch !== 'main' ? `?branch=${currentBranch}` : '';
  const baseArticleUrl = `/articles/${articleId}${branchQuery}`;

  const items = [
    {
      label: 'Просмотр',
      href: baseArticleUrl,
      icon: <IconEye size="1rem" />,
      // Активно, если pathname в точности совпадает с URL статьи (с query или без)
      active: pathname === baseArticleUrl || pathname === `/articles/${articleId}`,
    },
    {
      label: 'Редактировать',
      href: `/articles/${articleId}/edit${branchQuery}`,
      icon: <IconEdit size="1rem" />,
      active: pathname.startsWith(`/articles/${articleId}/edit`),
      show: canEdit,
    },
    {
      label: 'История',
      href: `/articles/${articleId}/history`,
      icon: <IconHistory size="1rem" />,
      active: pathname === `/articles/${articleId}/history`,
    },
    {
      label: 'Ветки',
      href: `/articles/${articleId}/branches`,
      icon: <IconGitBranch size="1rem" />,
      active: pathname === `/articles/${articleId}/branches`,
      show: canEdit,
    },
    {
      label: 'Комментарии',
      href: `/articles/${articleId}/comments${branchQuery}`,
      icon: <IconMessage size="1rem" />,
      active: pathname === `/articles/${articleId}/comments`,
    },
  ].filter(item => item.show !== false);

  return (
    <Group>
      {items.map(item => (
        <Button
          key={item.href}
          component="a"
          href={item.href}
          variant={item.active ? 'filled' : 'subtle'}
          leftSection={item.icon}
          size="sm"
        >
          {item.label}
        </Button>
      ))}
      <Menu>
        <Menu.Target>
          <ActionIcon variant="subtle"><IconDots size="1rem" /></ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          {items.map(item => (
            <Menu.Item
              key={item.href}
              component="a"
              href={item.href}
              leftSection={item.icon}
              data-active={item.active || undefined}
            >
              {item.label}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}