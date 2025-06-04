import React, { useState } from 'react';
import {
  Card,
  Text,
  Group,
  Stack,
  Button,
  Badge,
  ActionIcon,
  Modal,
  TextInput,
  Textarea,
  Select,
  Alert,
  Menu,
  Skeleton
} from '@mantine/core';
import {
  IconGitBranch,
  IconPlus,
  IconTrash,
  IconGitMerge,
  IconDots,
  IconHistory,
  IconAlertCircle,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  useArticleBranches,
  useCreateBranch,
  useCreateBranchFromCommit,
  useDeleteBranch,
  useMergeBranch,
  useBranchCommits
} from '../api/articles';
import { type BranchResponse, type BranchCreate, type BranchCreateFromCommit } from '../api/article';

interface BranchesPanelProps {
  articleId: string;
}

export default function BranchesPanel({ articleId }: BranchesPanelProps) {
  const [createModalOpened, { open: openCreateModal, close: closeCreateModal }] = useDisclosure();
  const [mergeModalOpened, { open: openMergeModal, close: closeMergeModal }] = useDisclosure();
  const [selectedBranch, setSelectedBranch] = useState<BranchResponse | null>(null);
  const [mergedBranch, setMergeBranch] = useState<BranchResponse | null>(null);
  const [createFromCommit, setCreateFromCommit] = useState<string | null>(null);

  const { data: branches, isLoading } = useArticleBranches(articleId);
  const createBranch = useCreateBranch();
  const createBranchFromCommit = useCreateBranchFromCommit();
  const deleteBranch = useDeleteBranch();
  const mergeBranch = useMergeBranch();

  const handleCreateBranch = async (values: any) => {
    try {
      if (createFromCommit) {
        const branchData: BranchCreateFromCommit = {
          name: values.name,
          description: values.description,
          source_commit_id: createFromCommit
        };
        await createBranchFromCommit.mutateAsync({ articleId, branchData });
      } else {
        const mainBranch = branches?.find(b => b.name === 'main');
        if (!mainBranch) {
          throw new Error('Main branch not found');
        }
        
        const branchData: BranchCreate = {
          article_id: articleId,
          name: values.name,
          description: values.description,
          head_commit_id: mainBranch.head_commit_id
        };
        await createBranch.mutateAsync(branchData);
      }
      
      notifications.show({
        title: 'Успех',
        message: 'Ветка успешно создана',
        color: 'green'
      });
      closeCreateModal();
      setCreateFromCommit(null);
    } catch (error: any) {
      notifications.show({
        title: 'Ошибка',
        message: error.response?.data?.detail || 'Не удалось создать ветку',
        color: 'red'
      });
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    try {
      await deleteBranch.mutateAsync(branchId);
      notifications.show({
        title: 'Успех',
        message: 'Ветка успешно удалена',
        color: 'green'
      });
    } catch (error: any) {
      notifications.show({
        title: 'Ошибка',
        message: error.response?.data?.detail || 'Не удалось удалить ветку',
        color: 'red'
      });
    }
  };

  const handleMergeBranch = async (values: any) => {
    if (!selectedBranch || !mergedBranch) return;
    
    try {
      await mergeBranch.mutateAsync({
        sourceBranchId: selectedBranch.id,
        targetBranchId: mergedBranch.id,
        message: values.message
      });
      
      notifications.show({
        title: 'Успех',
        message: 'Ветки успешно объединены',
        color: 'green'
      });
      closeMergeModal();
      setSelectedBranch(null);
      setMergeBranch(null);
    } catch (error: any) {
      notifications.show({
        title: 'Ошибка',
        message: error.response?.data?.detail || 'Не удалось объединить ветки',
        color: 'red'
      });
    }
  };

  if (isLoading) {
    return (
      <Stack>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} height={80} />
        ))}
      </Stack>
    );
  }

  return (
    <>
      <Stack>
        <Group justify="space-between">
          <Text size="lg" fw={600}>Ветки</Text>
          <Button
            leftSection={<IconPlus size="1rem" />}
            onClick={openCreateModal}
            size="sm"
          >
            Создать ветку
          </Button>
        </Group>

        {branches?.map((branch) => (
          <BranchCard
            key={branch.id}
            branch={branch}
            onDelete={handleDeleteBranch}
            onMerge={(sourceBranch) => {
              setSelectedBranch(sourceBranch);
              openMergeModal();
            }}
            onCreateFromCommit={(commitId) => {
              setCreateFromCommit(commitId);
              openCreateModal();
            }}
            isMainBranch={branch.name === 'main'}
          />
        ))}

        {(!branches || branches.length === 0) && (
          <Alert icon={<IconAlertCircle size="1rem" />}>
            Ветки не найдены
          </Alert>
        )}
      </Stack>

      {/* Create Branch Modal */}
      <Modal
        opened={createModalOpened}
        onClose={() => {
          closeCreateModal();
          setCreateFromCommit(null);
        }}
        title={createFromCommit ? "Создать ветку из коммита" : "Создать новую ветку"}
      >
        <CreateBranchForm
          onSubmit={handleCreateBranch}
          loading={createBranch.isPending || createBranchFromCommit.isPending}
        />
      </Modal>

      {/* Merge Branch Modal */}
      <Modal
        opened={mergeModalOpened}
        onClose={closeMergeModal}
        title="Объединить ветки"
      >
        <MergeBranchForm
          sourceBranch={selectedBranch}
          branches={branches || []}
          onSubmit={handleMergeBranch}
          onTargetChange={setMergeBranch}
          loading={mergeBranch.isPending}
        />
      </Modal>
    </>
  );
}

interface BranchCardProps {
  branch: BranchResponse;
  onDelete: (branchId: string) => void;
  onMerge: (branch: BranchResponse) => void;
  onCreateFromCommit: (commitId: string) => void;
  isMainBranch: boolean;
}

function BranchCard({ branch, onDelete, onMerge, onCreateFromCommit, isMainBranch }: BranchCardProps) {
  const { data: commits } = useBranchCommits(branch.id, 0, 1);
  const lastCommit = commits?.[0];

  return (
    <Card withBorder>
      <Group justify="space-between" align="flex-start">
        <Stack gap="xs" style={{ flex: 1 }}>
          <Group>
            <IconGitBranch size="1rem" />
            <Text fw={600}>{branch.name}</Text>
            {isMainBranch && (
              <Badge color="blue" size="sm">Основная</Badge>
            )}
            {branch.is_protected && (
              <Badge color="orange" size="sm">Защищенная</Badge>
            )}
          </Group>
          
          {branch.description && (
            <Text size="sm" c="dimmed">{branch.description}</Text>
          )}
          
          {lastCommit && (
            <Group gap="xs">
              <IconHistory size="0.8rem" />
              <Text size="xs" c="dimmed">
                Последний коммит: {lastCommit.message.substring(0, 50)}
                {lastCommit.message.length > 50 && '...'}
              </Text>
            </Group>
          )}
          
          <Text size="xs" c="dimmed">
            Создана: {new Date(branch.created_at).toLocaleDateString()}
          </Text>
        </Stack>

        <Menu>
          <Menu.Target>
            <ActionIcon variant="subtle">
              <IconDots size="1rem" />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconGitMerge size="1rem" />}
              onClick={() => onMerge(branch)}
              disabled={isMainBranch}
            >
              Объединить
            </Menu.Item>
            <Menu.Item
              leftSection={<IconPlus size="1rem" />}
              onClick={() => onCreateFromCommit(branch.head_commit_id)}
            >
              Создать ветку отсюда
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconTrash size="1rem" />}
              color="red"
              onClick={() => onDelete(branch.id)}
              disabled={isMainBranch || branch.is_protected}
            >
              Удалить
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Card>
  );
}

interface CreateBranchFormProps {
  onSubmit: (values: any) => void;
  loading: boolean;
}

function CreateBranchForm({ onSubmit, loading }: CreateBranchFormProps) {
  const [values, setValues] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        <TextInput
          label="Название ветки"
          placeholder="feature/new-functionality"
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          required
        />
        
        <Textarea
          label="Описание"
          placeholder="Описание изменений в ветке"
          value={values.description}
          onChange={(e) => setValues({ ...values, description: e.target.value })}
          rows={3}
        />

        <Group justify="flex-end" mt="md">
          <Button type="submit" loading={loading}>
            Создать
          </Button>
        </Group>
      </Stack>
    </form>
  );
}

interface MergeBranchFormProps {
  sourceBranch: BranchResponse | null;
  branches: BranchResponse[];
  onSubmit: (values: any) => void;
  onTargetChange: (branch: BranchResponse | null) => void;
  loading: boolean;
}

function MergeBranchForm({ sourceBranch, branches, onSubmit, onTargetChange, loading }: MergeBranchFormProps) {
  const [values, setValues] = useState({
    targetBranch: '',
    message: ''
  });

  const availableBranches = branches.filter(b => b.id !== sourceBranch?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  const handleTargetChange = (value: string | null) => {
    const branch = branches.find(b => b.id === value) || null;
    onTargetChange(branch);
    setValues({ ...values, targetBranch: value || '' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        <Alert>
          Объединение ветки <strong>{sourceBranch?.name}</strong> с выбранной целевой веткой
        </Alert>

        <Select
          label="Целевая ветка"
          placeholder="Выберите ветку для объединения"
          data={availableBranches.map(branch => ({
            value: branch.id,
            label: branch.name
          }))}
          value={values.targetBranch}
          onChange={handleTargetChange}
          required
        />

        <TextInput
          label="Сообщение коммита (опционально)"
          placeholder={`Merge branch '${sourceBranch?.name}'`}
          value={values.message}
          onChange={(e) => setValues({ ...values, message: e.target.value })}
        />

        <Group justify="flex-end" mt="md">
          <Button type="submit" loading={loading}>
            Объединить
          </Button>
        </Group>
      </Stack>
    </form>
  );
}