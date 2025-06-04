import { useParams, useSearchParams } from 'react-router-dom';
import { Card, Title, Text, Skeleton, Group, Box, Tabs, Select, Badge } from '@mantine/core';
import { IconArticle, IconHistory, IconGitBranch, IconEye, IconMessage } from '@tabler/icons-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useArticle, useArticleBranches } from '../api/articles';
import CommitsHistory from '../components/CommitHistoryPanel';
import BranchesPanel from '../components/BranchesPanel';
import ArticleNavigation from '../components/ArticleNavigation';
import CommentsSection from '../components/CommentSection';

export default function ArticlePage() {
  const { id: articleId } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const {} = useAuth();
  
  // Получаем ветку из URL параметров или используем 'main' по умолчанию
  const branchParam = searchParams.get('branch') || 'main';
  const [selectedBranch, setSelectedBranch] = useState(branchParam);
  
  const { data: article, isLoading, isError } = useArticle(articleId || '', selectedBranch);
  const { data: branches } = useArticleBranches(articleId || '');

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

  const handleBranchChange = (value: string | null) => {
    const newBranch = value || 'main';
    setSelectedBranch(newBranch);
    
    // Обновляем URL параметры
    const newSearchParams = new URLSearchParams(searchParams);
    if (newBranch !== 'main') {
      newSearchParams.set('branch', newBranch);
    } else {
      newSearchParams.delete('branch');
    }
    setSearchParams(newSearchParams);
  };

  const currentBranch = branches?.find(b => b.name === selectedBranch) || branches?.find(b => b.name === 'main');
  //const canEdit = permissions?.can_edit;

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
          <Group justify="space-between" align="flex-start" mb="xl">
            <Box style={{ flex: 1 }}>
              <Title order={1} mb="sm">{article.title}</Title>
              
              <Group mb="md">
                <Text c="dimmed">
                  Обновлено: {new Date(article.updated_at).toLocaleDateString()}
                </Text>
                <Badge color={
                  article.status === 'published' ? 'green' : 
                  article.status === 'draft' ? 'blue' : 'gray'
                }>
                  {article.status === 'published' ? 'Опубликовано' : 
                   article.status === 'draft' ? 'Черновик' : 'Архив'}
                </Badge>
                
                {currentBranch && (
                  <Badge variant="outline" color="blue">
                    {currentBranch.name}
                  </Badge>
                )}
              </Group>
            </Box>

            <Group>
              {branches && branches.length > 0 && (
                <Select
                  placeholder="Выберите ветку"
                  data={branches.map(branch => ({
                    value: branch.name,
                    label: branch.name
                  }))}
                  value={selectedBranch}
                  onChange={handleBranchChange}
                  w={180}
                  leftSection={<IconGitBranch size="1rem" />}
                />
              )}
              
              <ArticleNavigation 
                articleId={articleId}
                currentBranch={selectedBranch}
                variant="buttons"
              />
            </Group>
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
              <Tabs.Tab value="comments" leftSection={<IconMessage size="1rem" />}>
                Комментарии
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="content">
              <Card withBorder p="xl" radius="md">
                <div 
                  dangerouslySetInnerHTML={{ __html: article.content }}
                  style={{
                    lineHeight: 1.6,
                    fontSize: '16px'
                  }}
                />
              </Card>
              
              {currentBranch && currentBranch.name !== 'main' && (
                <Card withBorder p="md" mt="md" bg="blue.0">
                  <Group>
                    <IconEye size="1rem" />
                    <Text size="sm">
                      Вы просматриваете содержимое ветки <strong>{currentBranch.name}</strong>
                      {currentBranch.description && (
                        <Text component="span" c="dimmed"> - {currentBranch.description}</Text>
                      )}
                    </Text>
                  </Group>
                </Card>
              )}
            </Tabs.Panel>

            <Tabs.Panel value="history">
              <CommitsHistory 
                articleId={articleId}
                selectedBranchId={currentBranch?.id}
              />
            </Tabs.Panel>

            <Tabs.Panel value="branches">
              <BranchesPanel articleId={articleId} />
            </Tabs.Panel>
            <Tabs.Panel value="comments">
              <CommentsSection articleId={articleId} />
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