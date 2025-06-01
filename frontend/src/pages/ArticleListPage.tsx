
import { useMemo, useState } from 'react';
import { SimpleGrid, Card, Title, Text, TextInput, Select, Pagination, Skeleton, Group, useMantineTheme} from '@mantine/core';
import { createStyles } from '@mantine/emotion';
import { IconSearch } from '@tabler/icons-react';
import { useArticles } from '../api/articles';
import { Link } from 'react-router-dom';
import { useMediaQuery } from '@mantine/hooks';

// Статусы статей для фильтра
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
      borderColor: theme.colors.blue[6]
    }
  },
  grid: {
    [`@media (max-width: ${theme.breakpoints.sm}px)`]: {
      gridTemplateColumns: 'repeat(1, 1fr)'
    },
    [`@media (max-width: ${theme.breakpoints.md}px)`]: {
      gridTemplateColumns: 'repeat(2, 1fr)'
    }
  }
}));
export default function ArticleListPage(){
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const { classes } = useStyles();
  const theme = useMantineTheme();
  const mediaQuerysm = useMediaQuery(`(max-width: ${theme.breakpoints.sm}px)`);
  const mediaQuerymd = useMediaQuery(`(max-width: ${theme.breakpoints.md}px)`);
  const getGridCols = useMemo(()=>(
    (mediaQuerysm) ? 1
    : (mediaQuerymd) ? 2 :
    3 
  ),[mediaQuerymd,mediaQuerysm])
  const noBackend=true;
 
  // Параметры запроса
  const params = {
    skip: (page - 1) * 10,
    limit: 10,
    status: statusFilter || undefined,
    search: search || undefined
  };
  
  const { data: articles, isLoading, isFetching } = useArticles(params);
  // Заглушка данных
  const articles_base = [
    { id: 1, title: 'Первая статья', description: 'Введение в систему' },
    { id: 2, title: 'Вторая статья', description: 'Основные функции' },
  ];

  return (
    (noBackend)
        ?
    <div>
      <Title order={2} mb="lg">Все статьи</Title>
      <SimpleGrid cols={3}>
        {articles_base.map(article => (
          <Card key={article.id} shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={4}>{article.title}</Title>
            <Text mt="sm" c="dimmed">{article.description}</Text>
          </Card>
        ))}
      </SimpleGrid>
    </div>
    :
         <div>
      <Title order={2} mb="xl">Список статей</Title>
      
      {/* Панель фильтров */}
      <Group mb="xl" grow>
        <TextInput
          placeholder="Поиск по названию..."
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          leftSection={<IconSearch size="1rem" />}
        />
        
        <Select
          placeholder="Статус статьи"
          data={ARTICLE_STATUSES}
          value={statusFilter}
          onChange={setStatusFilter}
          clearable
        />
      </Group>
      
      {/* Список статей */}
      {isLoading || isFetching ? (
        <SimpleGrid cols={getGridCols} spacing="md">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={120} radius="md" />
          ))}
        </SimpleGrid>
      ) : articles && articles.length > 0 ? (
        <>
          <SimpleGrid 
            cols={getGridCols} 
            spacing="md"
            className={classes.grid}
          >
            {articles.map(article => (
              <Card 
                key={article.id}
                component={Link}
                to={`/articles/${article.id}`}
                p="lg" 
                radius="md" 
                withBorder
                className={classes.card}
              >
                <Text size="lg" fw={600} mb="xs" truncate>
                  {article.title}
                </Text>
                
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    {new Date(article.created_at).toLocaleDateString()}
                  </Text>
                  
                  <Text size="sm" c={
                    article.status === 'published' ? 'green' : 
                    article.status === 'draft' ? 'blue' : 'gray'
                  }>
                    {article.status === 'published' ? 'Опубликовано' : 
                     article.status === 'draft' ? 'Черновик' : 'Архив'}
                  </Text>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
          
          {/* Пагинация */}
          <Pagination
            mt="xl"
            value={page}
            onChange={setPage}
            total={Math.ceil((articles.length > 0 ? articles.length : 0) / 10)} // Заглушка для общего количества
          />
        </>
      ) : (
        <Card withBorder p="xl" radius="md">
          <Text size="lg" ta="center" c="dimmed">
            Статьи не найдены
          </Text>
          <Text ta="center" mt="sm">
            Попробуйте изменить параметры поиска
          </Text>
        </Card>
      )}
    </div>

    
  );
}