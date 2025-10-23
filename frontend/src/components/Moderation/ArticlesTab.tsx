// src/components/Moderation/ArticlesTab.tsx
import { Table, Text, ActionIcon, Badge, Alert } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { type ArticleResponse } from '../../api/article';

interface ArticlesTabProps {
  articles: ArticleResponse[];
  onDeleteArticle: (article: ArticleResponse) => void;
  isLoading?: boolean;
}

export const ArticlesTab = ({ articles, onDeleteArticle, isLoading }: ArticlesTabProps) => {
  if (articles.length === 0) {
    return (
      <Alert color="blue" title="Нет данных">
        Статьи не найдены
      </Alert>
    );
  }

  return (
    <Table striped>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Название</Table.Th>
          <Table.Th>Статус</Table.Th>
          <Table.Th>Тип</Table.Th>
          <Table.Th>Обновлено</Table.Th>
          <Table.Th>Действия</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {articles.map((article) => (
          <Table.Tr key={article.id}>
            <Table.Td>
              <Text fw={500}>{article.title}</Text>
              <Text size="sm" c="dimmed">
                ID: {article.id.slice(0, 8)}...
              </Text>
            </Table.Td>
            <Table.Td>
              <Badge color={
                article.status === 'published' ? 'green' : 
                article.status === 'draft' ? 'yellow' : 'red'
              }>
                {article.status}
              </Badge>
            </Table.Td>
            <Table.Td>{article.article_type}</Table.Td>
            <Table.Td>
              {new Date(article.updated_at).toLocaleDateString('ru-RU')}
              <Text size="sm" c="dimmed">
                {new Date(article.updated_at).toLocaleTimeString('ru-RU')}
              </Text>
            </Table.Td>
            <Table.Td>
              <ActionIcon
                color="red"
                variant="subtle"
                onClick={() => onDeleteArticle(article)}
                title="Удалить статью"
                loading={isLoading}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
};