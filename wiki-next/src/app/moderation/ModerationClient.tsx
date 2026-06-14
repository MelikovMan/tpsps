'use client';

import { useState, useEffect } from 'react';
import {
  Table, Title, Badge, Group, Button, Modal, Stack, Text, Textarea,
  Select, Loader, Alert, ActionIcon, Tooltip
} from '@mantine/core';
import { IconCheck, IconRotateClockwise, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { moderationApi } from '@/lib/api/moderation';
import { updateModeration } from '@/app/actions/moderation';
import type { ModerationResponse } from '@/lib/api/types/moderation';

export default function ModerationClient({ initialModerations }: { initialModerations: ModerationResponse[] }) {
  const [statusFilter, setStatusFilter] = useState<string | null>('pending');
  const [moderations, setModerations] = useState<ModerationResponse[]>(initialModerations);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<ModerationResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const statusOptions = [
    { value: 'pending', label: 'Ожидает' },
    { value: 'resolved', label: 'Решено' },
    { value: 'rejected', label: 'Отклонено' },
    { value: 'all', label: 'Все' },
  ];

  // Загрузка данных при изменении фильтра
  useEffect(() => {
    const fetchModerations = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await moderationApi.getList(statusFilter === 'all' ? undefined : statusFilter || undefined);
        setModerations(data);
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки заявок');
      } finally {
        setLoading(false);
      }
    };

    // Если фильтр 'pending' и это начальное состояние, используем initialModerations
    if (statusFilter === 'pending' && !loading && moderations === initialModerations) {
      return;
    }

    fetchModerations();
  }, [statusFilter]);

  const openDetails = (moderation: ModerationResponse) => {
    setSelected(moderation);
    setComment(moderation.comment || '');
    setModalOpen(true);
  };

  const handleAction = async (status: 'resolved' | 'rejected', revert: boolean) => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await updateModeration(selected.id, {
        status,
        comment: comment || undefined,
        revert_commit: revert,
      });
      notifications.show({
        title: 'Успешно',
        message: `Заявка ${status === 'resolved' ? 'одобрена' : 'отклонена'}`,
        color: 'green',
      });
      setModalOpen(false);
      setSelected(null);
      // Обновляем список
      const refreshed = await moderationApi.getList(statusFilter === 'all' ? undefined : statusFilter || undefined);
      setModerations(refreshed);
    } catch (err: any) {
      notifications.show({
        title: 'Ошибка',
        message: err.message || 'Не удалось обработать заявку',
        color: 'red',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (error) return <Alert color="red">{error}</Alert>;

  return (
    <div>
      <Group mb="md" justify="space-between">
        <Title order={2}>Модерация</Title>
        <Select
          label="Статус"
          data={statusOptions}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value === 'all' ? null : value)}
        />
      </Group>

      {moderations && moderations.length > 0 ? (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>ID</Table.Th>
              <Table.Th>Коммит</Table.Th>
              <Table.Th>Причина</Table.Th>
              <Table.Th>Статус</Table.Th>
              <Table.Th>Дата</Table.Th>
              <Table.Th>Действия</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {moderations.map((m) => (
              <Table.Tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => openDetails(m)}>
                <Table.Td>{m.id.slice(0, 8)}...</Table.Td>
                <Table.Td>{m.commit_id.slice(0, 8)}...</Table.Td>
                <Table.Td>
                  {m.reason && m.reason.length > 40 ? `${m.reason.slice(0, 40)}...` : (m.reason || '-')}
                </Table.Td>
                <Table.Td>
                  <Badge color={m.status === 'pending' ? 'yellow' : m.status === 'resolved' ? 'green' : 'red'}>
                    {m.status}
                  </Badge>
                </Table.Td>
                <Table.Td>{new Date(m.created_at).toLocaleDateString()}</Table.Td>
                <Table.Td onClick={(e) => e.stopPropagation()}>
                  {m.status === 'pending' && (
                    <Group gap="xs">
                      <Tooltip label="Принять без отката">
                        <ActionIcon
                          variant="light"
                          color="green"
                          onClick={() => {
                            setSelected(m);
                            handleAction('resolved', false);
                          }}
                          loading={actionLoading}
                        >
                          <IconCheck size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Принять и откатить коммит">
                        <ActionIcon
                          variant="light"
                          color="orange"
                          onClick={() => {
                            setSelected(m);
                            handleAction('resolved', true);
                          }}
                          loading={actionLoading}
                        >
                          <IconRotateClockwise size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Отклонить">
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => {
                            setSelected(m);
                            handleAction('rejected', false);
                          }}
                          loading={actionLoading}
                        >
                          <IconX size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <Text c="dimmed">Нет заявок на модерацию</Text>
      )}

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Детали заявки"
        size="lg"
      >
        {selected && (
          <Stack>
            <Text><strong>ID:</strong> {selected.id}</Text>
            <Text><strong>Commit ID:</strong> {selected.commit_id}</Text>
            <Text><strong>Причина:</strong> {selected.reason || '-'}</Text>
            <Text><strong>Описание:</strong> {selected.description || '-'}</Text>
            <Text>
              <strong>Статус:</strong>{' '}
              <Badge color={selected.status === 'pending' ? 'yellow' : selected.status === 'resolved' ? 'green' : 'red'}>
                {selected.status}
              </Badge>
            </Text>
            <Text><strong>Заявитель:</strong> {selected.reported_by}</Text>
            {selected.moderated_by && <Text><strong>Модератор:</strong> {selected.moderated_by}</Text>}
            <Text><strong>Создано:</strong> {new Date(selected.created_at).toLocaleString()}</Text>
            {selected.moderated_at && <Text><strong>Решено:</strong> {new Date(selected.moderated_at).toLocaleString()}</Text>}

            {selected.status === 'pending' && (
              <>
                <Textarea
                  label="Комментарий модератора"
                  value={comment}
                  onChange={(e) => setComment(e.currentTarget.value)}
                  autosize
                  minRows={2}
                />
                <Group justify="flex-end">
                  <Button
                    color="red"
                    variant="outline"
                    onClick={() => handleAction('rejected', false)}
                    loading={actionLoading}
                  >
                    Отклонить
                  </Button>
                  <Button
                    color="green"
                    onClick={() => handleAction('resolved', false)}
                    loading={actionLoading}
                  >
                    Принять
                  </Button>
                  <Button
                    color="orange"
                    onClick={() => handleAction('resolved', true)}
                    loading={actionLoading}
                  >
                    Принять и откатить
                  </Button>
                </Group>
              </>
            )}
            {selected.comment && (
              <Text><strong>Комментарий:</strong> {selected.comment}</Text>
            )}
          </Stack>
        )}
      </Modal>
    </div>
  );
}