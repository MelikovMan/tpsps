'use client';

import { useState, useEffect } from 'react';
import {
  Card, Title, Text, TextInput, Select,
  Pagination, Skeleton, Group, Stack, Checkbox, Tooltip
} from '@mantine/core';
import { IconSearch, IconLanguage, IconListSearch } from '@tabler/icons-react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import type { ArticleResponse, SearchResponse } from '@/lib/api/types/article'; 

const ARTICLE_STATUSES = [
  { value: 'draft', label: 'Черновик' },
  { value: 'published', label: 'Опубликовано' },
  { value: 'archived', label: 'Архив' },
];

const SEARCH_LIMIT = 10;

const styles = {
  card: {
    cursor: 'pointer',
    transition: 'transform 0.2s',
    '&:hover': {
      transform: 'translateY(-3px)',
      boxShadow: 'var(--mantine-shadow-md)',
      borderColor: 'var(--mantine-color-blue-6)',
    },
  },
  skeletonContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--mantine-spacing-md)',
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

interface Props {
  initialArticles: ArticleResponse[];
}

export default function ArticlesListClient({ initialArticles }: Props) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const [searchLanguage, setSearchLanguage] = useState<string | null>(null);
  const [searchFields, setSearchFields] = useState<string>('both');
  const [hybridSearch, setHybridSearch] = useState(false);

  const [articles, setArticles] = useState<ArticleResponse[]>(initialArticles);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce для поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const isSearchMode = debouncedSearch.length > 0;

  // Эффект для загрузки данных
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (isSearchMode) {
          const params: Record<string, string> = {
            q: debouncedSearch,
            limit: SEARCH_LIMIT.toString(),
            offset: ((page - 1) * SEARCH_LIMIT).toString(),
            fields: searchFields,
          };
          if (searchLanguage) params.language = searchLanguage;
          if (hybridSearch) params.hybrid = 'true';

          const data = await api.get<SearchResponse>('/search/', params);
          setSearchResults(data);
        } else {
          const params: Record<string, string> = {
            skip: ((page - 1) * 10).toString(),
            limit: '10',
          };
          if (statusFilter) params.status = statusFilter;
          const data = await api.get<ArticleResponse[]>('/articles/', params);
          setArticles(data);
        }
      } catch (err: any) {
        setError(err.message || 'Ошибка при загрузке статей');
      } finally {
        setLoading(false);
      }
    };

    // При первом рендере не перезагружаем, если страница=1, строка поиска пуста, фильтр не задан
    if (page === 1 && !isSearchMode && !statusFilter) return;
    fetchData();
  }, [page, debouncedSearch, statusFilter, searchLanguage, searchFields, hybridSearch]);

  const displayItems: (ArticleResponse | any)[] = isSearchMode
    ? searchResults?.results ?? []
    : articles;
  const totalResults = isSearchMode
    ? (searchResults?.total ?? 0)
    : (articles.length);
  const totalPages = Math.ceil(totalResults / (isSearchMode ? SEARCH_LIMIT : 10));

  // Рендер
  return (
    <div>
      <Title order={2} mb="xl">Список статей</Title>

      {/* Панель поиска и фильтров */}
      <Group mb="xs" grow>
        <TextInput
          placeholder="Поиск по названию и содержимому..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.currentTarget.value);
            setPage(1);
          }}
          leftSection={<IconSearch size="1rem" />}
        />
        {!isSearchMode ? (
          <Select
            placeholder="Статус статьи"
            data={ARTICLE_STATUSES}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            clearable
          />
        ) : (
          <>
            <Select
              placeholder="Язык"
              leftSection={<IconLanguage size="1rem" />}
              data={[
                { value: 'ru', label: 'Русский' },
                { value: 'en', label: 'Английский' },
              ]}
              value={searchLanguage}
              onChange={(val) => {
                setSearchLanguage(val);
                setPage(1);
              }}
              clearable
            />
            <Select
              placeholder="Область поиска"
              leftSection={<IconListSearch size="1rem" />}
              data={[
                { value: 'both', label: 'Везде' },
                { value: 'title', label: 'Заголовки' },
                { value: 'content', label: 'Содержимое' },
              ]}
              value={searchFields}
              onChange={(val) => {
                setSearchFields(val || 'both');
                setPage(1);
              }}
            />
          </>
        )}
      </Group>

      {isSearchMode && (
        <Group mb="xl" justify="flex-start">
          <Tooltip label="Объединяет полнотекстовый и семантический поиск (требуется Typesense)">
            <Checkbox
              label="Гибридный поиск"
              checked={hybridSearch}
              onChange={(e) => {
                setHybridSearch(e.currentTarget.checked);
                setPage(1);
              }}
            />
          </Tooltip>
        </Group>
      )}

      {/* Контент */}
      {loading ? (
        <div style={styles.skeletonContainer}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={100} radius="md" />
          ))}
        </div>
      ) : error ? (
        <Card withBorder p="xl" radius="md">
          <Text size="lg" ta="center" c="red">{error}</Text>
        </Card>
      ) : displayItems.length > 0 ? (
        <>
          <Stack mb="xl">
            {displayItems.map((item) => {
              const isSearchResult = isSearchMode;
              return (
                <Card
                  key={item.id}
                  component={Link}
                  href={`/articles/${item.id}`}
                  p="lg"
                  radius="md"
                  withBorder
                  style={styles.card}
                >
                  <Group justify="space-between" mb="xs">
                    <Text size="lg" fw={600} truncate>
                      {item.title}
                    </Text>
                    {!isSearchResult && 'status' in item && (
                      <Text
                        size="sm"
                        c={
                          item.status === 'published'
                            ? 'green'
                            : item.status === 'draft'
                            ? 'blue'
                            : 'gray'
                        }
                      >
                        {item.status === 'published'
                          ? 'Опубликовано'
                          : item.status === 'draft'
                          ? 'Черновик'
                          : 'Архив'}
                      </Text>
                    )}
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                    {isSearchResult && 'snippet' in item && item.snippet ? (
                      <Text
                        size="sm"
                        style={styles.snippet}
                        lineClamp={2}
                        dangerouslySetInnerHTML={{ __html: item.snippet }}
                      />
                    ) : (
                      <Text lineClamp={1} size="sm" c="dimmed">
                        {item.title}
                      </Text>
                    )}
                  </Group>
                </Card>
              );
            })}
          </Stack>
          <Pagination
            mt="xl"
            value={page}
            onChange={setPage}
            total={totalPages || 1}
          />
        </>
      ) : (
        <Card withBorder p="xl" radius="md">
          <Text size="lg" ta="center" c="dimmed">
            {isSearchMode ? 'Ничего не найдено' : 'Статьи не найдены'}
          </Text>
        </Card>
      )}
    </div>
  );
}