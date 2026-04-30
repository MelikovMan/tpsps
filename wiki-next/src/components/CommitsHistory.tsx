'use client';

import { useState, useEffect } from 'react';
import {
  Text, Group, Stack, Button, Badge, ActionIcon, Modal, Alert, Menu,
  Code, Pagination, Select, Loader, Skeleton, Timeline, Paper, Collapse
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconUser, IconCalendar, IconGitCommit, IconGitMerge, IconRestore, IconEye,
  IconCode, IconChevronDown, IconChevronUp, IconDots
} from '@tabler/icons-react';
import { getArticleBranches, getArticleCommits, getBranchCommits, getCommitDetailed, getCommitDiff, revertCommit } from '@/lib/api/branches';
import type { CommitResponse, CommitResponseDetailed, DiffResponse } from '@/lib/api/types/article';

interface CommitsHistoryProps {
  articleId: string;
  selectedBranchId?: string;
  initialCommits: CommitResponse[];   // первые 5 коммитов предзагружены
}

export default function CommitsHistory({ articleId, selectedBranchId, initialCommits }: CommitsHistoryProps) {
  const [viewMode, setViewMode] = useState<'article' | 'branch'>('article');
  const [branchId, setBranchId] = useState<string>(selectedBranchId || '');
  const [branches, setBranches] = useState<any[]>([]);
  const [commits, setCommits] = useState<CommitResponse[]>(initialCommits);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 20;

  const [selectedCommit, setSelectedCommit] = useState<CommitResponse | null>(null);
  const [detailsOpened, { open: openDetails, close: closeDetails }] = useDisclosure(false);

  // Загрузка списка веток для выбора
  useEffect(() => {
    getArticleBranches(articleId)
      .then(setBranches)
      .catch(() => notifications.show({ title: 'Ошибка', message: 'Не удалось загрузить ветки', color: 'red' }));
  }, [articleId]);

  // Загрузка коммитов при изменении фильтров или пагинации
  useEffect(() => {
    const fetchCommits = async () => {
      setLoading(true);
      try {
        const skip = (page - 1) * limit;
        if (viewMode === 'branch' && branchId) {
          const data = await getBranchCommits(branchId, skip, limit);
          setCommits(data);
        } else {
          const data = await getArticleCommits(articleId, skip, limit);
          setCommits(data);
        }
      } catch (error) {
        notifications.show({ title: 'Ошибка', message: 'Не удалось загрузить коммиты', color: 'red' });
      } finally {
        setLoading(false);
      }
    };

    // При первой загрузке не перезаписываем предзагруженные данные
    if (page > 1 || viewMode !== 'article' || branchId !== '') {
      fetchCommits();
    }
  }, [page, viewMode, branchId]);

  const handleRevert = async (commitId: string) => {
    try {
      await revertCommit(commitId);
      notifications.show({ title: 'Успех', message: 'Коммит отменён', color: 'green' });
      // обновить список коммитов
    } catch (err: any) {
      notifications.show({ title: 'Ошибка', message: err.message, color: 'red' });
    }
  };

  const viewCommitDetails = (commit: CommitResponse) => {
    setSelectedCommit(commit);
    openDetails();
  };

  return (
    <>
      <Stack>
        <Group justify="space-between">
          <Text size="lg" fw={600}>История коммитов</Text>
          <Group>
            <Select
              data={[
                { value: 'article', label: 'Все коммиты статьи' },
                { value: 'branch', label: 'Коммиты ветки' }
              ]}
              value={viewMode}
              onChange={(val) => { setViewMode(val as any); setPage(1); }}
            />
            {viewMode === 'branch' && (
              <Select
                placeholder="Выберите ветку"
                data={branches.map((b: any) => ({ value: b.id, label: b.name }))}
                value={branchId}
                onChange={(val) => { setBranchId(val || ''); setPage(1); }}
              />
            )}
          </Group>
        </Group>

        {loading ? (
          <>{[...Array(3)].map((_, i) => <Skeleton key={i} height={100} />)}</>
        ) : commits.length === 0 ? (
          <Alert color="gray">Коммиты не найдены</Alert>
        ) : (
          <Timeline active={-1} bulletSize={24} lineWidth={2}>
            {commits.map(commit => (
              <Timeline.Item
                key={commit.id}
                bullet={commit.is_merge ? <IconGitMerge size="0.8rem" /> : <IconGitCommit size="0.8rem" />}
                title={
                  <Group justify="space-between" align="flex-start">
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Group>
                        <Text fw={500}>{commit.message}</Text>
                        {commit.is_merge && <Badge color="blue" size="sm">Merge</Badge>}
                      </Group>
                      <Group gap="xs" c="dimmed">
                        <IconUser size="0.7rem" />
                        <Text size="xs">{commit.author_id}</Text>
                        <IconCalendar size="0.7rem" />
                        <Text size="xs">{new Date(commit.created_at).toLocaleString()}</Text>
                      </Group>
                    </Stack>
                    <Menu>
                      <Menu.Target>
                        <ActionIcon variant="subtle"><IconDots size="1rem" /></ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item leftSection={<IconEye size="1rem" />} onClick={() => viewCommitDetails(commit)}>Детали</Menu.Item>
                        <Menu.Item leftSection={<IconCode size="1rem" />}>Изменения</Menu.Item>
                        <Menu.Divider />
                        <Menu.Item leftSection={<IconRestore size="1rem" />} color="orange" onClick={() => handleRevert(commit.id)}>
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
                      {commit.content_diff.length > 200 ? `${commit.content_diff.substring(0, 200)}...` : commit.content_diff}
                    </Text>
                  </Paper>
                )}
              </Timeline.Item>
            ))}
          </Timeline>
        )}
        <Pagination value={page} onChange={setPage} total={Math.ceil(commits.length / limit) || 1} />
      </Stack>

      <Modal opened={detailsOpened} onClose={closeDetails} title="Детали коммита" size="lg">
        {selectedCommit && <CommitDetailsContent commit={selectedCommit} />}
      </Modal>
    </>
  );
}

function CommitDetailsContent({ commit }: { commit: CommitResponse }) {
  const [showDiff, setShowDiff] = useState(false);
  const [details, setDetails] = useState<CommitResponseDetailed | null>(null);
  const [diff, setDiff] = useState<DiffResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCommitDetailed(commit.id), getCommitDiff(commit.id)])
      .then(([det, dif]) => {
        setDetails(det);
        setDiff(dif);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [commit.id]);

  return (
    <Stack>
      <Group><Text fw={600}>Сообщение:</Text><Text>{commit.message}</Text></Group>
      <Group><Text fw={600}>ID:</Text><Code>{commit.id}</Code></Group>
      <Group><Text fw={600}>Автор:</Text><Text>{details?.author_name || commit.author_id}</Text></Group>
      <Group><Text fw={600}>Дата:</Text><Text>{new Date(commit.created_at).toLocaleString()}</Text></Group>
      {details?.branch_name && (
        <Group><Text fw={600}>Ветка:</Text><Badge>{details.branch_name}</Badge></Group>
      )}
      {commit.is_merge && <Badge color="blue">Коммит слияния</Badge>}

      <Group justify="space-between" mt="md">
        <Text fw={600}>Изменения:</Text>
        <Button variant="subtle" size="sm" rightSection={showDiff ? <IconChevronUp size="1rem" /> : <IconChevronDown size="1rem" />} onClick={() => setShowDiff(!showDiff)}>
          {showDiff ? 'Скрыть' : 'Показать'} diff
        </Button>
      </Group>

      <Collapse in={showDiff}>
        {diff ? (
          <Paper withBorder p="md" bg="gray.0">
            <Group>
              <Text size="sm" c="green" fw={500}>+{diff.added_lines} добавлено</Text>
              <Text size="sm" c="red" fw={500}>-{diff.removed_lines} удалено</Text>
            </Group>
            <Code block style={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>{diff.diff}</Code>
          </Paper>
        ) : (
          <Text c="dimmed" size="sm">Diff недоступен</Text>
        )}
      </Collapse>

      {details?.content && (
        <>
          <Text fw={600} mt="md">Полное содержимое:</Text>
          <Paper withBorder p="md" bg="gray.0" mah={300} style={{ overflow: 'auto' }}>
            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{details.content}</Text>
          </Paper>
        </>
      )}
    </Stack>
  );
}