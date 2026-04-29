import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Title, Group, Checkbox, Loader, Alert, Card, Text, Stack, Badge, Pagination
} from '@mantine/core';
import { Link } from 'react-router-dom';
import { useCategory, useCategoryArticles } from '../api/categories';

const ARTICLES_PER_PAGE = 10;

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const { data: category, isLoading: catLoading, error: catError } = useCategory(id!);
  const [includeSub, setIncludeSub] = useState(false);
  const [page, setPage] = useState(1);

  const { data: articles, isLoading: articlesLoading } = useCategoryArticles(
    id!,
    includeSub,
    (page - 1) * ARTICLES_PER_PAGE,
    ARTICLES_PER_PAGE
  );

  if (catLoading) return <Loader />;
  if (catError || !category) return <Alert color="red">Категория не найдена</Alert>;

  return (
    <div>
      <Title order={2} mb="sm">{category.name}</Title>
      <Text c="dimmed" mb="md">Путь: {category.path}</Text>

      <Group mb="lg">
        <Checkbox
          label="Включая статьи из подкатегорий"
          checked={includeSub}
          onChange={(e) => setIncludeSub(e.currentTarget.checked)}
        />
      </Group>

      <Title order={3} mb="md">Статьи</Title>

      {articlesLoading ? (
        <Loader />
      ) : articles && articles.length > 0 ? (
        <Stack>
          {articles.map((article) => (
            <Card
              key={article.id}
              component={Link}
              to={`/articles/${article.id}`}
              p="md"
              radius="md"
              withBorder
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Group justify="space-between">
                <Text size="lg" fw={500}>{article.title}</Text>
                <Badge color={article.status === 'published' ? 'green' : 'blue'}>
                  {article.status === 'published' ? 'Опубликовано' : 'Черновик'}
                </Badge>
              </Group>
              <Text size="sm" c="dimmed">{new Date(article.created_at).toLocaleDateString()}</Text>
            </Card>
          ))}
          <Pagination
            mt="md"
            value={page}
            onChange={setPage}
            total={Math.ceil(articles.length / ARTICLES_PER_PAGE)} // упрощённо
          />
        </Stack>
      ) : (
        <Text c="dimmed">В этой категории пока нет статей</Text>
      )}
    </div>
  );
}