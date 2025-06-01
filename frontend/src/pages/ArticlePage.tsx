import { useParams } from 'react-router-dom';
import { Card, Title, Text, Skeleton, Group, Box, Tabs } from '@mantine/core';
import { useArticle } from '../api/articles';
import { IconArticle, IconHistory, IconGitBranch } from '@tabler/icons-react';

export default function ArticlePage() {
  const { articleId } = useParams<{ articleId: string }>();
  const { data: article, isLoading, isError } = useArticle(articleId || '');

  if (!articleId) {
    return (
      <Card withBorder p="xl" radius="md">
        <Text size="lg" ta="center" c="dimmed">
          Статья не указана
        </Text>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card withBorder p="xl" radius="md">
        <Text size="lg" ta="center" c="red">
          Ошибка загрузки статьи
        </Text>
      </Card>
    );
  }

  return (
    <Box>
      {isLoading ? (
        <>
          <Skeleton height={40} mb="md" />
          <Skeleton height={20} mb="xs" />
          <Skeleton height={20} mb="xs" />
          <Skeleton height={20} mb="xs" />
          <Skeleton height={20} width="80%" />
        </>
      ) : article ? (
        <>
          <Title order={1} mb="xl">{article.title}</Title>
          
          <Group mb="xl" justify="space-between">
            <Text c="dimmed">
              Обновлено: {new Date(article.updated_at).toLocaleDateString()}
            </Text>
            <Text c={
              article.status === 'published' ? 'green' : 
              article.status === 'draft' ? 'blue' : 'gray'
            }>
              {article.status === 'published' ? 'Опубликовано' : 
               article.status === 'draft' ? 'Черновик' : 'Архив'}
            </Text>
          </Group>

          <Tabs defaultValue="content">
            <Tabs.List mb="md">
              <Tabs.Tab value="content" leftSection={<IconArticle size="1rem" />}>
                Содержание
              </Tabs.Tab>
              <Tabs.Tab value="history" leftSection={<IconHistory size="1rem" />}>
                История изменений
              </Tabs.Tab>
              <Tabs.Tab value="branches" leftSection={<IconGitBranch size="1rem" />}>
                Ветки
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="content">
              <Card withBorder p="xl" radius="md">
                <div dangerouslySetInnerHTML={{ __html: article.content }} />
              </Card>
            </Tabs.Panel>

            <Tabs.Panel value="history">
              <Text>История изменений будет здесь...</Text>
            </Tabs.Panel>

            <Tabs.Panel value="branches">
              <Text>Список веток будет здесь...</Text>
            </Tabs.Panel>
          </Tabs>
        </>
      ) : (
        <Card withBorder p="xl" radius="md">
          <Text size="lg" ta="center" c="dimmed">
            Статья не найдена
          </Text>
        </Card>
      )}
    </Box>
  );
}