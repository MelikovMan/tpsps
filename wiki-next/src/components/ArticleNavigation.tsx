'use client'
import Link from 'next/link';
import { Button, Menu, ActionIcon, Group } from '@mantine/core';
import { IconEdit, IconHistory, IconGitBranch, IconDots, IconEye } from '@tabler/icons-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ArticleNavigation({ articleId, currentBranch }: { articleId: string; currentBranch: string }) {
  const pathname = usePathname();
  const { permissions } = useAuth();
  const canEdit = permissions?.can_edit;
  const branchPath = currentBranch !== 'main' ? `/${currentBranch}` : '';

  const items = [
    { label: 'Просмотр', href: `/articles/${articleId}${branchPath}`, icon: <IconEye size="1rem" />, active: pathname === `/articles/${articleId}` || pathname === `/articles/${articleId}/${currentBranch}` },
    { label: 'Редактировать', href: `/articles/${articleId}/edit${currentBranch !== 'main' ? `?branch=${currentBranch}` : ''}`, icon: <IconEdit size="1rem" />, active: pathname.startsWith(`/articles/${articleId}/edit`), show: canEdit },
    { label: 'История', href: `/articles/${articleId}/history`, icon: <IconHistory size="1rem" />, active: pathname === `/articles/${articleId}/history` },
    { label: 'Ветки', href: `/articles/${articleId}/branches`, icon: <IconGitBranch size="1rem" />, active: pathname === `/articles/${articleId}/branches`, show: canEdit },
  ].filter(item => item.show !== false);

  return (
    <Group>
      {items.map(item => (
        <Button key={item.href} component={Link} href={item.href} variant={item.active ? 'filled' : 'subtle'} leftSection={item.icon} size="sm">
          {item.label}
        </Button>
      ))}
      <Menu>
        <Menu.Target>
          <ActionIcon variant="subtle"><IconDots size="1rem" /></ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          {items.map(item => (
            <Menu.Item key={item.href} component={Link} href={item.href} leftSection={item.icon} data-active={item.active || undefined}>
              {item.label}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}