
import { useState } from 'react';
import { SimpleGrid, Card, Title, Text, TextInput, Select, Pagination, Skeleton, Group, Stack} from '@mantine/core';
import { createStyles } from '@mantine/emotion';
import { IconSearch } from '@tabler/icons-react';
import { useArticles } from '../api/articles';
import { Link } from 'react-router-dom';

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
  skeletonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.md,
  }
}));
export default function ArticleListPage(){
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const { classes } = useStyles();
  const noBackend=false;
 
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
          
          {isLoading || isFetching ? (
            <div className={classes.skeletonContainer}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height={100} radius="md" />
              ))}
            </div>
          ) : articles && articles.length > 0 ? (
            <>
              <Stack mb="xl">
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
                    <Group justify="space-between" mb="xs">
                      <Text size="lg" fw={600} truncate>
                        {article.title}
                      </Text>
                      <Text size="sm" c={
                        article.status === 'published' ? 'green' : 
                        article.status === 'draft' ? 'blue' : 'gray'
                      }>
                        {article.status === 'published' ? 'Опубликовано' : 
                        article.status === 'draft' ? 'Черновик' : 'Архив'}
                      </Text>
                    </Group>
                    
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        {new Date(article.created_at).toLocaleDateString()}
                      </Text>
                      <Text lineClamp={1} size="sm" c="dimmed">
                        {article.title}
                      </Text>
                    </Group>
                  </Card>
                ))}
              </Stack>
              
              <Pagination
                mt="xl"
                value={page}
                onChange={setPage}
                total={Math.ceil((articles.length > 0 ? articles.length : 0) / 10)}
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