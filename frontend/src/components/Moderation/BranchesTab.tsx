// src/components/Moderation/BranchesTab.tsx
import { Table, Text, ActionIcon, Badge, Alert } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { type BranchWithDetails } from './useModerationData';

interface BranchesTabProps {
  branches: BranchWithDetails[];
  onDeleteBranch: (branch: BranchWithDetails) => void;
  isLoading?: boolean;
}

export const BranchesTab = ({ branches, onDeleteBranch, isLoading }: BranchesTabProps) => {
  if (branches.length === 0) {
    return (
      <Alert color="blue" title="Нет данных">
        Ветки не найдены
      </Alert>
    );
  }

  return (
    <Table striped>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Название</Table.Th>
          <Table.Th>Статья</Table.Th>
          <Table.Th>Описание</Table.Th>
          <Table.Th>Дата создания</Table.Th>
          <Table.Th>Статус</Table.Th>
          <Table.Th>Действия</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {branches.map((branch) => (
          <Table.Tr key={branch.id}>
            <Table.Td>
              <Text fw={500}>{branch.name}</Text>
              <Text size="sm" c="dimmed">
                ID: {branch.id.slice(0, 8)}...
              </Text>
            </Table.Td>
            <Table.Td>{branch.article_title}</Table.Td>
            <Table.Td>{branch.description || '—'}</Table.Td>
            <Table.Td>
              {new Date(branch.created_at).toLocaleDateString('ru-RU')}
            </Table.Td>
            <Table.Td>
              {branch.is_protected ? (
                <Badge color="blue">Защищена</Badge>
              ) : (
                <Badge color="gray">Обычная</Badge>
              )}
            </Table.Td>
            <Table.Td>
              {!branch.is_protected && (
                <ActionIcon
                  color="red"
                  variant="subtle"
                  onClick={() => onDeleteBranch(branch)}
                  title="Удалить ветку"
                  loading={isLoading}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              )}
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
};