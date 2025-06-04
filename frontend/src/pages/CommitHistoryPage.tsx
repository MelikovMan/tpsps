import { useParams, Link } from 'react-router-dom';
import { Box, Title, Breadcrumbs, Anchor, Text, Card, Skeleton } from '@mantine/core';
import { IconHome, IconHistory } from '@tabler/icons-react';
import { useArticle } from '../api/articles';
import CommitsHistory from '../components/CommitHistoryPanel';

export default function CommitsHistoryPage() {
  const { id: articleId } = useParams<{ id: string }>();
  const { data: article, isLoading } = useArticle(articleId || '');

  if (!articleId) {
    return (
      <Card withBorder p="xl" radius="md">
        <Text size="lg" ta="center" c="dimmed">
          Статья не указана
        </Text>
      </Card>
    );
  }

  return (
    <Box>
      <Breadcrumbs mb="md">
        <Anchor component={Link} to="/">
          <IconHome size="1rem" />
        </Anchor>
        <Anchor component={Link} to="/articles">
          Статьи
        </Anchor>
        <Anchor component={Link} to={`/articles/${articleId}`}>
          {isLoading ? (
            <Skeleton width={100} height={16} />
          ) : (
            article?.title || 'Статья'
          )}
        </Anchor>
        <Text c="dimmed">История изменений</Text>
      </Breadcrumbs>

      <Title order={1} mb="xl">
        <IconHistory size="2rem" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
        История изменений
      </Title>

      {isLoading ? (
        <Text c="dimmed">Загрузка...</Text>
      ) : article ? (
        <Text c="dimmed" mb="xl">
          История коммитов для статьи "{article.title}"
        </Text>
      ) : null}

      <CommitsHistory articleId={articleId} />
    </Box>
  );
}