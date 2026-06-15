// app/articles/components/ArticlesList.tsx
import { Card, Text, Group, Stack, Badge } from '@mantine/core';
import Link from 'next/link';
import Filters from './Filters';
import SearchBar from './SearchBar';
import ClientPagination from './ClientPagination';

interface ArticleItem {
  id: string;
  title: string;
  created_at: string;
  status?: 'draft' | 'published' | 'archived';
  snippet?: string; // только для результатов поиска
  // другие поля при необходимости
}

interface Props {
  searchParams: Record<string, string | undefined>;
  dataPromise: Promise<{ items: ArticleItem[]; total: number; isSearch: boolean }>;
}

const styles = {
  card: {
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      transform: 'translateY(-3px)',
      boxShadow: 'var(--mantine-shadow-md)',
      borderColor: 'var(--mantine-color-blue-6)',
    },
  },
  snippet: {
    margin: 0,
    '& mark': {
      backgroundColor: 'var(--mantine-color-yellow-3)',
      padding: '0 2px',
      borderRadius: 'var(--mantine-radius-xs)',
    },
  },
};

// Вспомогательная функция для отображения статуса на русском
const getStatusBadge = (status?: string) => {
  switch (status) {
    case 'published':
      return { color: 'green', label: 'Опубликовано' };
    case 'draft':
      return { color: 'blue', label: 'Черновик' };
    case 'archived':
      return { color: 'gray', label: 'Архив' };
    default:
      return null;
  }
};

export default async function ArticlesList({ searchParams, dataPromise }: Props) {
  const { items, total, isSearch } = await dataPromise;
  const currentPage = parseInt(searchParams.page || '1', 10);
  const limit = 10;
  const totalPages = Math.ceil(total / limit);
  const isSearchMode = !!searchParams.q;

  return (
    <div>
      <SearchBar initialValue={searchParams.q || ''} />
      <Filters
        status={searchParams.status}
        language={searchParams.lang}
        fields={searchParams.fields}
        hybrid={searchParams.hybrid === 'true'}
        isSearchMode={isSearchMode}
      />

      <Stack mb="xl">
        {items.map((item) => {
          const statusBadge = getStatusBadge(item.status);
          const isSearchResult = isSearch && item.snippet;

          return (
            <Link
              key={item.id}
              href={`/articles/${item.id}`}
              style={{ textDecoration: 'none' }}
            >
              <Card p="lg" radius="md" withBorder style={styles.card}>
                {/* Верхняя строка: заголовок + статус (если есть) */}
                <Group justify="space-between" mb="xs">
                  <Text size="lg" fw={600} truncate>
                    {item.title}
                  </Text>
                  {statusBadge && (
                    <Badge color={statusBadge.color} variant="light">
                      {statusBadge.label}
                    </Badge>
                  )}
                </Group>

                {/* Нижняя строка: дата + сниппет или заглушка */}
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                  {isSearchResult ? (
                    <Text
                      size="sm"
                      style={styles.snippet}
                      lineClamp={2}
                      dangerouslySetInnerHTML={{ __html: item.snippet! }}
                    />
                  ) : (
                    <Text size="sm" c="dimmed" lineClamp={1}>
                      {item.title}
                    </Text>
                  )}
                </Group>
              </Card>
            </Link>
          );
        })}
      </Stack>

      {totalPages > 1 && (
        <ClientPagination
          currentPage={currentPage}
          totalPages={totalPages}
          baseUrl="/articles"
          searchParams={searchParams}
        />
      )}
    </div>
  );
}