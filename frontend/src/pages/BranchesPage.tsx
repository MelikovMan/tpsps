import { useParams, Link } from 'react-router-dom';
import { Box, Title, Breadcrumbs, Anchor, Text, Card, Skeleton } from '@mantine/core';
import { IconHome, IconGitBranch } from '@tabler/icons-react';
import { useArticle } from '../api/articles';
import BranchesPanel from '../components/BranchesPanel';

export default function BranchesPage() {
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
        <Text c="dimmed">Ветки</Text>
      </Breadcrumbs>

      <Title order={1} mb="xl">
        <IconGitBranch size="2rem" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
        Управление ветками
      </Title>

      {isLoading ? (
        <Text c="dimmed">Загрузка...</Text>
      ) : article ? (
        <Text c="dimmed" mb="xl">
          Ветки для статьи "{article.title}"
        </Text>
      ) : null}

      <BranchesPanel articleId={articleId} />
    </Box>
  );
}