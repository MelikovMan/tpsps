// src/components/Moderation/CommitsTab.tsx
import { Table, Text, ActionIcon, Alert } from '@mantine/core';
import { IconRotate2 } from '@tabler/icons-react';
import { type CommitWithDetails } from './useModerationData';

interface CommitsTabProps {
  commits: CommitWithDetails[];
  onRevertCommit: (commit: CommitWithDetails) => void;
  isLoading?: boolean;
}

export const CommitsTab = ({ commits, onRevertCommit, isLoading }: CommitsTabProps) => {
  if (commits.length === 0) {
    return (
      <Alert color="blue" title="Нет данных">
        Коммиты не найдены
      </Alert>
    );
  }

  return (
    <Table striped>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Сообщение</Table.Th>
          <Table.Th>Статья</Table.Th>
          <Table.Th>Дата</Table.Th>
          <Table.Th>Действия</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {commits.map((commit) => (
          <Table.Tr key={commit.id}>
            <Table.Td>
              <Text fw={500}>{commit.message}</Text>
              <Text size="sm" c="dimmed">
                ID: {commit.id.slice(0, 8)}...
              </Text>
            </Table.Td>
            <Table.Td>{commit.article_title}</Table.Td>
            <Table.Td>
              {new Date(commit.created_at).toLocaleDateString('ru-RU')}
              <Text size="sm" c="dimmed">
                {new Date(commit.created_at).toLocaleTimeString('ru-RU')}
              </Text>
            </Table.Td>
            <Table.Td>
              <ActionIcon
                color="orange"
                variant="subtle"
                onClick={() => onRevertCommit(commit)}
                title="Откатить коммит"
                loading={isLoading}
              >
                <IconRotate2 size={16} />
              </ActionIcon>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
};