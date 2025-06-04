import { useState } from 'react';
import {
  Text,
  Group,
  Stack,
  Button,
  Badge,
  ActionIcon,
  Modal,
  Alert,
  Menu,
  Code,
  Pagination,
  Select,
  Loader,
  Skeleton,
  Timeline,
  Paper,
  Collapse
} from '@mantine/core';
import {
  IconUser,
  IconCalendar,
  IconGitCommit,
  IconGitMerge,
  IconRestore,
  IconEye,
  IconCode,
  IconChevronDown,
  IconChevronUp,
  IconDots
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  useArticleCommits,
  useBranchCommits,
  useCommitDetailed,
  useCommitDiff,
  useRevertCommit,
  useArticleBranches
} from '../api/articles';
import { type CommitResponse } from '../api/article';

interface CommitsHistoryProps {
  articleId: string;
  selectedBranchId?: string;
}

export default function CommitsHistory({ articleId, selectedBranchId }: CommitsHistoryProps) {
  const [page, setPage] = useState(1);
  const [selectedCommit, setSelectedCommit] = useState<CommitResponse | null>(null);
  const [viewMode, setViewMode] = useState<'article' | 'branch'>('article');
  const [branchId, setBranchId] = useState<string>(selectedBranchId || '');
  
  const [detailsModalOpened, { open: openDetailsModal, close: closeDetailsModal }] = useDisclosure();

  const limit = 20;
  const skip = (page - 1) * limit;

  const { data: branches } = useArticleBranches(articleId);
  
  const articlesCommitsQuery = useArticleCommits(
    articleId, 
    skip, 
    limit
  );
  
  const branchCommitsQuery = useBranchCommits(
    branchId, 
    skip, 
    limit
  );

  const commitsQuery = viewMode === 'branch' && branchId 
    ? branchCommitsQuery 
    : articlesCommitsQuery;

  const { data: commits, isLoading } = commitsQuery;
  const revertCommit = useRevertCommit();

  const handleViewCommit = (commit: CommitResponse) => {
    setSelectedCommit(commit);
    openDetailsModal();
  };

  const handleRevertCommit = async (commitId: string) => {
    try {
      await revertCommit.mutateAsync(commitId);
      notifications.show({
        title: 'Успех',
        message: 'Коммит успешно отменен',
        color: 'green'
      });
    } catch (error: any) {
      notifications.show({
        title: 'Ошибка',
        message: error.response?.data?.detail || 'Не удалось отменить коммит',
        color: 'red'
      });
    }
  };

  const handleBranchChange = (value: string | null) => {
    setBranchId(value || '');
    setPage(1);
  };

  const handleViewModeChange = (value: string | null) => {
    setViewMode((value as 'article' | 'branch') || 'article');
    setPage(1);
    if (value === 'article') {
      setBranchId('');
    }
  };

  const totalPages = Math.ceil((commits?.length || 0) / limit);

  if (isLoading) {
    return (
      <Stack>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} height={120} />
        ))}
      </Stack>
    );
  }

  return (
    <>
      <Stack>
        <Group justify="space-between">
          <Text size="lg" fw={600}>История коммитов</Text>
          
          <Group>
            <Select
              placeholder="Режим просмотра"
              data={[
                { value: 'article', label: 'Все коммиты статьи' },
                { value: 'branch', label: 'Коммиты ветки' }
              ]}
              value={viewMode}
              onChange={handleViewModeChange}
              w={200}
            />
            
            {viewMode === 'branch' && (
              <Select
                placeholder="Выберите ветку"
                data={branches?.map(branch => ({
                  value: branch.id,
                  label: branch.name
                })) || []}
                value={branchId}
                onChange={handleBranchChange}
                w={200}
                disabled={!branches || branches.length === 0}
              />
            )}
          </Group>
        </Group>

        {(!commits || commits.length === 0) ? (
          <Alert>
            Коммиты не найдены
          </Alert>
        ) : (
          <Timeline active={-1} bulletSize={24} lineWidth={2}>
            {commits.map((commit) => (
              <Timeline.Item
                key={commit.id}
                bullet={
                  commit.is_merge ? (
                    <IconGitMerge size="0.8rem" />
                  ) : (
                    <IconGitCommit size="0.8rem" />
                  )
                }
                title={
                  <Group justify="space-between" align="flex-start">
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Group>
                        <Text fw={500}>{commit.message}</Text>
                        {commit.is_merge && (
                          <Badge color="blue" size="sm">Merge</Badge>
                        )}
                      </Group>
                      
                      <Group gap="xs" c="dimmed">
                        <IconUser size="0.7rem" />
                        <Text size="xs">
                          {commit.author_id}
                        </Text>
                        <IconCalendar size="0.7rem" />
                        <Text size="xs">
                          {new Date(commit.created_at).toLocaleString()}
                        </Text>
                      </Group>
                      
                      <Code c="dimmed">
                        {commit.id.substring(0, 8)}
                      </Code>
                    </Stack>

                    <Menu>
                      <Menu.Target>
                        <ActionIcon variant="subtle" size="sm">
                          <IconDots size="1rem" />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconEye size="1rem" />}
                          onClick={() => handleViewCommit(commit)}
                        >
                          Посмотреть детали
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconCode size="1rem" />}
                        >
                          Посмотреть изменения
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item
                          leftSection={<IconRestore size="1rem" />}
                          color="orange"
                          onClick={() => handleRevertCommit(commit.id)}
                        >
                          Отменить коммит
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                }
              >
                {commit.content_diff && (
                  <Paper withBorder p="xs" mt="xs" bg="gray.0">
                    <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
                      {commit.content_diff.length > 200 
                        ? `${commit.content_diff.substring(0, 200)}...`
                        : commit.content_diff
                      }
                    </Text>
                  </Paper>
                )}
              </Timeline.Item>
            ))}
          </Timeline>
        )}

        {commits && commits.length > 0 && totalPages > 1 && (
          <Group justify="center" mt="md">
            <Pagination
              value={page}
              onChange={setPage}
              total={totalPages}
            />
          </Group>
        )}
      </Stack>

      {/* Commit Details Modal */}
      <Modal
        opened={detailsModalOpened}
        onClose={closeDetailsModal}
        title="Детали коммита"
        size="lg"
      >
        {selectedCommit && (
          <CommitDetailsContent commit={selectedCommit} />
        )}
      </Modal>
    </>
  );
}

interface CommitDetailsContentProps {
  commit: CommitResponse;
}

function CommitDetailsContent({ commit }: CommitDetailsContentProps) {
  const [showDiff, setShowDiff] = useState(false);
  
  const { data: commitDetails, isLoading: detailsLoading } = useCommitDetailed(commit.id);
  const { data: commitDiff, isLoading: diffLoading } = useCommitDiff(commit.id);

  if (detailsLoading) {
    return <Loader />;
  }

  return (
    <Stack>
      <Group>
        <Text fw={600}>Сообщение:</Text>
        <Text>{commit.message}</Text>
      </Group>
      
      <Group>
        <Text fw={600}>ID коммита:</Text>
        <Code>{commit.id}</Code>
      </Group>
      
      <Group>
        <Text fw={600}>Автор:</Text>
        <Text>{commitDetails?.author_name || commit.author_id}</Text>
      </Group>
      
      <Group>
        <Text fw={600}>Дата:</Text>
        <Text>{new Date(commit.created_at).toLocaleString()}</Text>
      </Group>
      
      {commitDetails?.branch_name && (
        <Group>
          <Text fw={600}>Ветка:</Text>
          <Badge>{commitDetails.branch_name}</Badge>
        </Group>
      )}
      
      {commit.is_merge && (
        <Badge color="blue">Коммит слияния</Badge>
      )}

      <Group justify="space-between" mt="md">
        <Text fw={600}>Изменения в содержимом:</Text>
        <Button
          variant="subtle"
          size="sm"
          rightSection={showDiff ? <IconChevronUp size="1rem" /> : <IconChevronDown size="1rem" />}
          onClick={() => setShowDiff(!showDiff)}
        >
          {showDiff ? 'Скрыть' : 'Показать'} diff
        </Button>
      </Group>

      <Collapse in={showDiff}>
        {diffLoading ? (
          <Loader size="sm" />
        ) : commitDiff ? (
          <Paper withBorder p="md" bg="gray.0">
            <Stack gap="xs">
              <Group>
                <Text size="sm" c="green" fw={500}>+{commitDiff.added_lines} добавлено</Text>
                <Text size="sm" c="red" fw={500}>-{commitDiff.removed_lines} удалено</Text>
              </Group>
              <Code block style={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>
                {commitDiff.diff}
              </Code>
            </Stack>
          </Paper>
        ) : (
          <Text c="dimmed" size="sm">Diff недоступен</Text>
        )}
      </Collapse>

      {commit.content_diff && (
        <>
          <Text fw={600} mt="md">Краткое описание изменений:</Text>
          <Paper withBorder p="md" bg="gray.0">
            <Text size="sm" style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
              {commit.content_diff}
            </Text>
          </Paper>
        </>
      )}

      {commitDetails?.content && (
        <>
          <Text fw={600} mt="md">Полное содержимое на момент коммита:</Text>
          <Paper withBorder p="md" bg="gray.0" mah={300} style={{ overflow: 'auto' }}>
            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
              {commitDetails.content}
            </Text>
          </Paper>
        </>
      )}
    </Stack>
  );
}