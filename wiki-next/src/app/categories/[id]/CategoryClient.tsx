'use client';

import { useState, useEffect } from 'react';
import { Title, Group, Checkbox, Loader, Alert, Card, Text, Stack, Badge, Pagination } from '@mantine/core';
import Link from 'next/link';
import { categoriesApi } from '@/lib/api/categories';
import type { CategoryResponse, ArticleResponse } from '@/lib/api/types';

const ARTICLES_PER_PAGE = 10;

export default function CategoryClient({
  category,
  initialArticles,
}: {
  category: CategoryResponse;
  initialArticles: ArticleResponse[];
}) {
  const [includeSub, setIncludeSub] = useState(false);
  const [page, setPage] = useState(1);
  const [articles, setArticles] = useState<ArticleResponse[]>(initialArticles);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загружаем статьи при изменении параметров
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await categoriesApi.getArticles(
          category.id,
          includeSub,
          (page - 1) * ARTICLES_PER_PAGE,
          ARTICLES_PER_PAGE
        );
        setArticles(data);
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки статей');
      } finally {
        setLoading(false);
      }
    };

    // Если страница 1 и includeSub = false, уже есть initialArticles, но всё равно перезапросим для консистентности
    fetchArticles();
  }, [category.id, includeSub, page]);

  // Упрощённая пагинация (если бэкенд не возвращает total)
  const totalPages = articles.length === ARTICLES_PER_PAGE ? page + 1 : page;

  return (
    <div>
      <Title order={2} mb="sm">{category.name}</Title>
      <Text c="dimmed" mb="md">Путь: {category.path}</Text>

      <Group mb="lg">
        <Checkbox
          label="Включая статьи из подкатегорий"
          checked={includeSub}
          onChange={(e) => {
            setIncludeSub(e.currentTarget.checked);
            setPage(1);
          }}
        />
      </Group>

      <Title order={3} mb="md">Статьи</Title>

      {loading ? (
        <Loader />
      ) : error ? (
        <Alert color="red">{error}</Alert>
      ) : articles.length > 0 ? (
        <Stack>
          {articles.map((article) => (
            <Card
              key={article.id}
              component={Link}
              href={`/articles/${article.id}`}
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
          <Pagination mt="md" value={page} onChange={setPage} total={totalPages} />
        </Stack>
      ) : (
        <Text c="dimmed">В этой категории пока нет статей</Text>
      )}
    </div>
  );
}