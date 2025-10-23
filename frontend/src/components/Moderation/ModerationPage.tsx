// src/components/Moderation/ModerationPage.tsx
import { useState } from 'react';
import {
  Tabs,
  Text,
  Group,
  Stack,
  Select,
  TextInput,
  Paper,
  Title,
  Box,
  Loader,
  Alert,
  Button,
  Badge,
  Tooltip,
} from '@mantine/core';
import { IconSearch, IconRefresh, IconClock } from '@tabler/icons-react';
import { useModerationData } from './useModerationData';
import { CommitsTab } from './CommitTab';
import { BranchesTab } from './BranchesTab';
import { ArticlesTab } from './articlesTab.tsx';
import { RevertCommitModal } from './RevertCommitModal';
import { DeleteBranchModal } from './DeleteBranchModal';
import { DeleteArticleModal } from './DeleteArticleModal';
import { type CommitWithDetails, type BranchWithDetails } from './useModerationData';
import { type ArticleResponse } from '../../api/article';

export const ModerationPage = () => {
  const [activeTab, setActiveTab] = useState<string>('commits');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // States for modals
  const [revertModalOpened, setRevertModalOpened] = useState(false);
  const [deleteBranchModalOpened, setDeleteBranchModalOpened] = useState(false);
  const [deleteArticleModalOpened, setDeleteArticleModalOpened] = useState(false);
  
  // Selected items for actions
  const [selectedCommit, setSelectedCommit] = useState<CommitWithDetails | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<BranchWithDetails | null>(null);
  const [selectedArticleItem, setSelectedArticleItem] = useState<ArticleResponse | null>(null);

  const {
    articlesData,
    allCommits,
    allBranches,
    isLoading,
    error,
    refreshData
  } = useModerationData();

  // Filter data based on search and selection
  const filteredCommits = allCommits.filter(commit =>
    (selectedArticle === 'all' || commit.article_id === selectedArticle) &&
    (commit.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
     commit.article_title?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredBranches = allBranches.filter(branch =>
    (selectedArticle === 'all' || branch.article_id === selectedArticle) &&
    (branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     branch.article_title?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredArticles = articlesData.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Action handlers
  const handleRevertCommit = (commit: CommitWithDetails) => {
    setSelectedCommit(commit);
    setRevertModalOpened(true);
  };

  const handleDeleteBranch = (branch: BranchWithDetails) => {
    setSelectedBranch(branch);
    setDeleteBranchModalOpened(true);
  };

  const handleDeleteArticle = (article: ArticleResponse) => {
    setSelectedArticleItem(article);
    setDeleteArticleModalOpened(true);
  };

  const handleRefresh = async () => {
    await refreshData();
    setLastUpdated(new Date());
  };

  const handleSuccess = () => {
    handleRefresh();
  };

  if (isLoading && allCommits.length === 0 && allBranches.length === 0) {
    return (
      <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <Loader size="lg" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert color="red" title="Ошибка загрузки данных">
        {error?.toString()}
      </Alert>
    );
  }

  return (
    <Stack>
      <Group justify="space-between">
        <div>
          <Title order={1}>Панель модерации</Title>
          <Text c="dimmed">Управление коммитами, ветками и статьями</Text>
        </div>
        <Tooltip label={`Последнее обновление: ${lastUpdated.toLocaleTimeString('ru-RU')}`}>
          <Badge 
            variant="light" 
            leftSection={<IconClock size={12} />}
            color="blue"
          >
            {lastUpdated.toLocaleTimeString('ru-RU')}
          </Badge>
        </Tooltip>
      </Group>

      <Paper p="md" withBorder>
        <Group justify="space-between" mb="md">
          <TextInput
            placeholder="Поиск..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftSection={<IconSearch size={16} />}
            style={{ flex: 1 }}
          />
          <Group>
            <Select
              placeholder="Все статьи"
              data={[
                { value: 'all', label: 'Все статьи' },
                ...(articlesData.map(article => ({
                  value: article.id,
                  label: article.title
                })) || [])
              ]}
              value={selectedArticle}
              onChange={(value) => setSelectedArticle(value || 'all')}
              style={{ width: 200 }}
            />
            <Button 
              onClick={handleRefresh}
              loading={isLoading}
              variant="outline"
              leftSection={<IconRefresh size={16} />}
            >
              Обновить
            </Button>
          </Group>
        </Group>

        <Tabs value={activeTab} onChange={(value)=>setActiveTab(value ?? "articles")}>
          <Tabs.List>
            <Tabs.Tab value="commits">
              Коммиты ({filteredCommits.length})
            </Tabs.Tab>
            <Tabs.Tab value="branches">
              Ветки ({filteredBranches.length})
            </Tabs.Tab>
            <Tabs.Tab value="articles">
              Статьи ({filteredArticles.length})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="commits" pt="md">
            {isLoading && allCommits.length > 0 && (
              <Group justify="center" mb="md">
                <Loader size="sm" />
                <Text size="sm" c="dimmed">Обновление данных...</Text>
              </Group>
            )}
            <CommitsTab 
              commits={filteredCommits} 
              onRevertCommit={handleRevertCommit}
              isLoading={isLoading}
            />
          </Tabs.Panel>

          <Tabs.Panel value="branches" pt="md">
            {isLoading && allBranches.length > 0 && (
              <Group justify="center" mb="md">
                <Loader size="sm" />
                <Text size="sm" c="dimmed">Обновление данных...</Text>
              </Group>
            )}
            <BranchesTab 
              branches={filteredBranches} 
              onDeleteBranch={handleDeleteBranch}
              isLoading={isLoading}
            />
          </Tabs.Panel>

          <Tabs.Panel value="articles" pt="md">
            {isLoading && articlesData.length > 0 && (
              <Group justify="center" mb="md">
                <Loader size="sm" />
                <Text size="sm" c="dimmed">Обновление данных...</Text>
              </Group>
            )}
            <ArticlesTab 
              articles={filteredArticles} 
              onDeleteArticle={handleDeleteArticle}
              isLoading={isLoading}
            />
          </Tabs.Panel>
        </Tabs>
      </Paper>

      {/* Modals */}
      <RevertCommitModal
        opened={revertModalOpened}
        onClose={() => setRevertModalOpened(false)}
        commit={selectedCommit}
        onSuccess={handleSuccess}
      />

      <DeleteBranchModal
        opened={deleteBranchModalOpened}
        onClose={() => setDeleteBranchModalOpened(false)}
        branch={selectedBranch}
        onSuccess={handleSuccess}
      />

      <DeleteArticleModal
        opened={deleteArticleModalOpened}
        onClose={() => setDeleteArticleModalOpened(false)}
        article={selectedArticleItem}
        onSuccess={handleSuccess}
      />
    </Stack>
  );
};

export default ModerationPage;