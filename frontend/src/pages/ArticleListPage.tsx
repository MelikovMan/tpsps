import { useState, useEffect } from 'react';
import {
  SimpleGrid, Card, Title, Text, TextInput, Select,
  Pagination, Skeleton, Group, Stack, Checkbox, Tooltip
} from '@mantine/core';
import { createStyles } from '@mantine/emotion';
import { IconSearch, IconLanguage, IconListSearch } from '@tabler/icons-react';
import { useArticles, useSearchArticles } from '../api/articles';
import { Link } from 'react-router-dom';

// Статусы статей для обычного фильтра (остался без изменений)
const ARTICLE_STATUSES = [
  { value: 'draft', label: 'Черновик' },
  { value: 'published', label: 'Опубликовано' },
  { value: 'archived', label: 'Архив' },
];

const useStyles = createStyles((theme) => ({
  card: {
    transition: 'transform 0.2s',
    '&:hover': {
      transform: 'translateY(-3px)',
      boxShadow: theme.shadows.md,
      borderColor: theme.colors.blue[6],
    },
  },
  skeletonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.md,
  },
  snippet: {
    '& mark': {
      backgroundColor: theme.colors.yellow[3],
      padding: '0 2px',
      borderRadius: theme.radius.xs,
    },
  },
}));

const SEARCH_LIMIT = 10;

export default function ArticleListPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Состояния для расширенного поиска
  const [searchLanguage, setSearchLanguage] = useState<string | null>(null);
  const [searchFields, setSearchFields] = useState<string>('both');
  const [hybridSearch, setHybridSearch] = useState(false);

  const { classes } = useStyles();
  const noBackend = false;

  // Debounce для поискового запроса
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const isSearchMode = debouncedSearch.length > 0;

  // Параметры для обычного списка (без поиска)
  const articlesParams = {
    skip: (page - 1) * 10,
    limit: 10,
    status: statusFilter || undefined,
    search: undefined,
  };

  // Запросы
  const {
    data: articles,
    isLoading: articlesLoading,
    isFetching: articlesFetching,
  } = useArticles(articlesParams);

  const {
    data: searchData,
    isLoading: searchLoading,
    isFetching: searchFetching,
  } = useSearchArticles({
    q: debouncedSearch,
    limit: SEARCH_LIMIT,
    offset: (page - 1) * SEARCH_LIMIT,
    language: searchLanguage || undefined,
    fields: searchFields,
    hybrid: hybridSearch,
    // semantic_weight можно оставить по умолчанию (0.5) или добавить слайдер
  });

  const isLoading = isSearchMode ? searchLoading : articlesLoading;
  const isFetching = isSearchMode ? searchFetching : articlesFetching;
  const displayItems = isSearchMode
    ? searchData?.results ?? []
    : articles ?? [];
  const totalResults = isSearchMode
    ? (searchData?.total ?? 0)
    : (articles?.length ?? 0);
  const totalPages = Math.ceil(totalResults / (isSearchMode ? SEARCH_LIMIT : 10));

  // Заглушка, если бэкенд отключён
  const articles_base = [
    { id: 1, title: 'Первая статья', description: 'Введение в систему' },
    { id: 2, title: 'Вторая статья', description: 'Основные функции' },
  ];

  if (noBackend) {
    return (
      <div>
        <Title order={2} mb="lg">Все статьи</Title>
        <SimpleGrid cols={3}>
          {articles_base.map((article) => (
            <Card key={article.id} shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={4}>{article.title}</Title>
              <Text mt="sm" c="dimmed">{article.description}</Text>
            </Card>
          ))}
        </SimpleGrid>
      </div>
    );
  }

  return (
    <div>
      <Title order={2} mb="xl">Список статей</Title>

      {/* Основная строка поиска и фильтров */}
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
          // Обычный фильтр по статусу
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
          // Расширенные фильтры поиска
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

      {/* Дополнительная опция гибридного поиска (только в режиме поиска) */}
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

      {isLoading || isFetching ? (
        <div className={classes.skeletonContainer}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={100} radius="md" />
          ))}
        </div>
      ) : displayItems.length > 0 ? (
        <>
          <Stack mb="xl">
            {displayItems.map((item) => {
              const isSearchResult = isSearchMode;
              return (
                <Card
                  key={item.id}
                  component={Link}
                  to={`/articles/${item.id}`}
                  p="lg"
                  radius="md"
                  withBorder
                  className={classes.card}
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
                    {isSearchResult && 'snippet' in item && !!item.snippet  ? (
                      <Text
                        size="sm"
                        className={classes.snippet}
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
          <Text ta="center" mt="sm">
            {isSearchMode
              ? 'Попробуйте изменить запрос или фильтры'
              : 'Попробуйте изменить параметры поиска'}
          </Text>
        </Card>
      )}
    </div>
  );
}