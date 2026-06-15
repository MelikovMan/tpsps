'use client';

import { Card, Text, Group, Stack, Badge, Overlay, Loader } from '@mantine/core';
import Link from 'next/link';
import Filters from './Filters';
import SearchBar from './SearchBar';
import ClientPagination from './ClientPagination';
import { useSearchTransition } from './SearchTransitionContext';
import classes from './ArticleCard.module.css';

interface ArticleItem {
  id: string;
  title: string;
  created_at: string;
  status?: 'draft' | 'published' | 'archived';
  snippet?: string;
}

interface Props {
  searchParams: Record<string, string | undefined>;
  items: ArticleItem[];
  total: number;
  isSearch: boolean;
}

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

export default function ArticlesList({ searchParams, items, total, isSearch }: Props) {
  const { isPending } = useSearchTransition();
  const currentPage = parseInt(searchParams.page || '1', 10);
  const limit = 10;
  const totalPages = Math.ceil(total / limit);
  const isSearchMode = !!searchParams.q;

  return (
    <div style={{ position: 'relative' }}>
      <SearchBar initialValue={searchParams.q || ''} />
      <Filters
        status={searchParams.status}
        language={searchParams.lang}
        fields={searchParams.fields}
        hybrid={searchParams.hybrid === 'true'}
        isSearchMode={isSearchMode}
      />

      <div style={{ position: 'relative', minHeight: '400px' }}>
        <Stack mb="xl" style={{ opacity: isPending ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          {items.map((item) => {
            const statusBadge = getStatusBadge(item.status);
            const isSearchResult = isSearch && item.snippet;

            return (
              <Link key={item.id} href={`/articles/${item.id}`} style={{ textDecoration: 'none' }}>
                <Card p="lg" radius="md" withBorder className={classes.card}>
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
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                    {isSearchResult ? (
                      <Text
                        size="sm"
                        className={classes.snippet}
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

        {isPending && (
          <Overlay
            color="#fff"
            backgroundOpacity={0.3}
            blur={0}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Loader size="xl" variant="dots" />
          </Overlay>
        )}
      </div>

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