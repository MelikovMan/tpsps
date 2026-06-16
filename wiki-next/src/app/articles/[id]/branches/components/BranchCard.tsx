'use client';

import { Card, Group, Text, Badge, ActionIcon, Menu, Stack } from '@mantine/core';
import { IconGitBranch, IconDots, IconEdit, IconGitMerge, IconTrash } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteBranch } from '../actions/branches';
import { notifications } from '@mantine/notifications';
import type { BranchResponse } from '@/lib/api/types/article';

interface BranchCardProps {
  branch: BranchResponse;
  articleId: string;
}

export default function BranchCard({ branch, articleId }: BranchCardProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm(`Удалить ветку "${branch.name}"?`)) {
      try {
        await deleteBranch(branch.id, articleId);
        notifications.show({ title: 'Успех', message: 'Ветка удалена', color: 'green' });
        router.refresh();
      } catch (err: any) {
        notifications.show({ title: 'Ошибка', message: err.message, color: 'red' });
      }
    }
  };

  const isProtected = branch.name === 'main' || branch.is_protected;

  return (
    <Card withBorder>
      <Group justify="space-between" align="flex-start">
        <Stack gap="xs" style={{ flex: 1 }}>
          <Group>
            <IconGitBranch size="1rem" />
            <Text fw={600}>{branch.name}</Text>
            {branch.name === 'main' && <Badge color="blue">Основная</Badge>}
            {branch.is_protected && <Badge color="orange">Защищённая</Badge>}
          </Group>
          {branch.description && <Text size="sm" c="dimmed">{branch.description}</Text>}
          <Text size="xs" c="dimmed">Создана: {new Date(branch.created_at).toLocaleDateString()}</Text>
        </Stack>
        <Menu>
          <Menu.Target>
            <ActionIcon variant="subtle"><IconDots size="1rem" /></ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item component={Link} href={`/articles/${articleId}/branches/${branch.id}/edit`} leftSection={<IconEdit size="1rem" />}>
              Редактировать
            </Menu.Item>
            {!isProtected && (
              <Menu.Item component={Link} href={`/articles/${articleId}/branches/${branch.id}/merge`} leftSection={<IconGitMerge size="1rem" />}>
                Объединить
              </Menu.Item>
            )}
            {!isProtected && (
              <Menu.Item leftSection={<IconTrash size="1rem" />} color="red" onClick={handleDelete}>
                Удалить
              </Menu.Item>
            )}
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Card>
  );
}