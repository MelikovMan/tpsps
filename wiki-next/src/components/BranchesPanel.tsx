'use client';

import { useState, useEffect } from 'react';
import {
  Card, Text, Group, Stack, Button, Badge, ActionIcon, Modal, TextInput, Textarea,
  Select, Alert, Menu, Skeleton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconGitBranch, IconPlus, IconTrash, IconGitMerge, IconDots, IconAlertCircle
} from '@tabler/icons-react';
import { useAuth } from '@/context/AuthContext';
import { branchesApi } from '@/lib/api/branches';
import type { BranchResponse } from '@/lib/api/types/article';

interface BranchesPanelProps {
  articleId: string;
  initialBranches: BranchResponse[];
}

export default function BranchesPanel({ articleId, initialBranches }: BranchesPanelProps) {
  const { permissions } = useAuth();
  const canEdit = permissions?.can_edit;
  const [branches, setBranches] = useState<BranchResponse[]>(initialBranches);
  const [loading, setLoading] = useState(false);

  const [createModalOpened, { open: openCreateModal, close: closeCreateModal }] = useDisclosure();
  const [mergeModalOpened, { open: openMergeModal, close: closeMergeModal }] = useDisclosure();
  const [selectedBranch, setSelectedBranch] = useState<BranchResponse | null>(null);
  const [createFromCommit, setCreateFromCommit] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await branchesApi.getByArticle(articleId);
      setBranches(data);
    } catch (err: any) {
      notifications.show({ title: 'Ошибка', message: err.message, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: { name: string; description: string }) => {
    try {
      if (createFromCommit) {
        await branchesApi.createFromCommit(articleId, { name: values.name, description: values.description, source_commit_id: createFromCommit });
      } else {
        const main = branches.find(b => b.name === 'main');
        if (!main) throw new Error('Main ветка не найдена');
        await branchesApi.create({ article_id: articleId, name: values.name, description: values.description, head_commit_id: main.head_commit_id });
      }
      notifications.show({ title: 'Успех', message: 'Ветка создана', color: 'green' });
      closeCreateModal();
      setCreateFromCommit(null);
      refresh();
    } catch (err: any) {
      notifications.show({ title: 'Ошибка', message: err.message, color: 'red' });
    }
  };

  const handleDelete = async (branchId: string) => {
    try {
      await branchesApi.delete(branchId);
      notifications.show({ title: 'Успех', message: 'Ветка удалена', color: 'green' });
      refresh();
    } catch (err: any) {
      notifications.show({ title: 'Ошибка', message: err.message, color: 'red' });
    }
  };

  const handleMerge = async (targetBranchId: string, message?: string) => {
    if (!selectedBranch) return;
    try {
      await branchesApi.merge({ sourceBranchId: selectedBranch.id, targetBranchId, message });
      notifications.show({ title: 'Успех', message: 'Ветки объединены', color: 'green' });
      closeMergeModal();
      setSelectedBranch(null);
      refresh();
    } catch (err: any) {
      notifications.show({ title: 'Ошибка', message: err.message, color: 'red' });
    }
  };

  return (
    <>
      <Stack>
        <Group justify="space-between">
          <Text size="lg" fw={600}>Ветки</Text>
          {canEdit && (
            <Button leftSection={<IconPlus size="1rem" />} onClick={openCreateModal} size="sm">Создать ветку</Button>
          )}
        </Group>

        {loading ? (
          <>{[...Array(3)].map((_, i) => <Skeleton key={i} height={80} />)}</>
        ) : branches.length === 0 ? (
          <Alert icon={<IconAlertCircle size="1rem" />}>Нет веток</Alert>
        ) : (
          branches.map(branch => (
            <Card key={branch.id} withBorder>
              <Group justify="space-between" align="flex-start">
                <Stack gap="xs" style={{ flex: 1 }}>
                  <Group>
                    <IconGitBranch size="1rem" />
                    <Text fw={600}>{branch.name}</Text>
                    {branch.name === 'main' && <Badge color="blue" size="sm">Основная</Badge>}
                    {branch.is_protected && <Badge color="orange" size="sm">Защищённая</Badge>}
                  </Group>
                  {branch.description && <Text size="sm" c="dimmed">{branch.description}</Text>}
                  <Text size="xs" c="dimmed">Создана: {new Date(branch.created_at).toLocaleDateString()}</Text>
                </Stack>
                {canEdit && (
                  <Menu>
                    <Menu.Target>
                      <ActionIcon variant="subtle"><IconDots size="1rem" /></ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item leftSection={<IconGitMerge size="1rem" />} onClick={() => { setSelectedBranch(branch); openMergeModal(); }} disabled={branch.name === 'main'}>
                        Объединить
                      </Menu.Item>
                      <Menu.Item leftSection={<IconPlus size="1rem" />} onClick={() => { setCreateFromCommit(branch.head_commit_id); openCreateModal(); }}>
                        Создать ветку отсюда
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item leftSection={<IconTrash size="1rem" />} color="red" onClick={() => handleDelete(branch.id)} disabled={branch.name === 'main' || branch.is_protected}>
                        Удалить
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                )}
              </Group>
            </Card>
          ))
        )}
      </Stack>

      <Modal opened={createModalOpened} onClose={() => { closeCreateModal(); setCreateFromCommit(null); }} title={createFromCommit ? 'Создать ветку из коммита' : 'Новая ветка'}>
        <CreateBranchForm onSubmit={handleCreate} />
      </Modal>

      <Modal opened={mergeModalOpened} onClose={closeMergeModal} title="Объединить ветки">
        <MergeBranchForm sourceBranch={selectedBranch} branches={branches} onSubmit={handleMerge} />
      </Modal>
    </>
  );
}

function CreateBranchForm({ onSubmit }: { onSubmit: (values: { name: string; description: string }) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ name, description }); }}>
      <Stack>
        <TextInput label="Название ветки" value={name} onChange={e => setName(e.target.value)} required />
        <Textarea label="Описание" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
        <Group justify="flex-end" mt="md">
          <Button type="submit">Создать</Button>
        </Group>
      </Stack>
    </form>
  );
}

function MergeBranchForm({ sourceBranch, branches, onSubmit }: { sourceBranch: BranchResponse | null; branches: BranchResponse[]; onSubmit: (targetId: string, message?: string) => void }) {
  const [target, setTarget] = useState<string>('');
  const [message, setMessage] = useState('');
  const available = branches.filter(b => b.id !== sourceBranch?.id);
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(target, message); }}>
      <Stack>
        <Alert>Объединение ветки <strong>{sourceBranch?.name}</strong> с целевой</Alert>
        <Select
          label="Целевая ветка"
          data={available.map(b => ({ value: b.id, label: b.name }))}
          value={target}
          onChange={val => setTarget(val || '')}
          required
        />
        <TextInput label="Сообщение коммита" placeholder={`Merge branch '${sourceBranch?.name}'`} value={message} onChange={e => setMessage(e.target.value)} />
        <Group justify="flex-end" mt="md">
          <Button type="submit">Объединить</Button>
        </Group>
      </Stack>
    </form>
  );
}