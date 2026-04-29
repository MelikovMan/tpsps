// src/pages/ModerationPage.tsx
import { useState } from 'react';
import {
    Table, Title, Badge, Group, Button, Modal, Stack, Text, Textarea,
    Select, Loader, Alert, ActionIcon, Tooltip
} from '@mantine/core';
import { IconCheck, IconRotateClockwise, IconX } from '@tabler/icons-react';
import { useModerations, useUpdateModeration } from '../api/moderation';
import type { ModerationResponse } from '../api/types/moderation';

export default function ModerationPage() {
    const [statusFilter, setStatusFilter] = useState<string | null>('pending');
    const { data: moderations, isLoading, error } = useModerations(statusFilter ?? undefined);
    const updateMutation = useUpdateModeration();

    const [selected, setSelected] = useState<ModerationResponse | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [comment, setComment] = useState('');

    const openDetails = (moderation: ModerationResponse) => {
        setSelected(moderation);
        setComment(moderation.comment || '');
        setModalOpen(true);
    };

    const handleAction = async (status: 'resolved' | 'rejected', revert: boolean) => {
        if (!selected) return;
        try {
            await updateMutation.mutateAsync({
                id: selected.id,
                data: {
                    status,
                    comment: comment || undefined,
                    revert_commit: revert,
                },
            });
            setModalOpen(false);
            setSelected(null);
        } catch (e) {
            // Ошибка обрабатывается через состояние мутации (updateMutation.isError)
        }
    };

    const statusOptions = [
        { value: 'pending', label: 'Ожидает' },
        { value: 'resolved', label: 'Решено' },
        { value: 'rejected', label: 'Отклонено' },
        { value: 'all', label: 'Все' },
    ];

    if (isLoading) return <Loader />;
    if (error) return <Alert color="red">Ошибка загрузки заявок</Alert>;

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
                                                <ActionIcon variant="light" color="green" onClick={() => { setSelected(m); handleAction('resolved', false); }}>
                                                    <IconCheck size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label="Принять и откатить коммит">
                                                <ActionIcon variant="light" color="orange" onClick={() => { setSelected(m); handleAction('resolved', true); }}>
                                                    <IconRotateClockwise size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label="Отклонить">
                                                <ActionIcon variant="light" color="red" onClick={() => { setSelected(m); handleAction('rejected', false); }}>
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
                                        loading={updateMutation.isPending}
                                    >
                                        Отклонить
                                    </Button>
                                    <Button
                                        color="green"
                                        onClick={() => handleAction('resolved', false)}
                                        loading={updateMutation.isPending}
                                    >
                                        Принять
                                    </Button>
                                    <Button
                                        color="orange"
                                        onClick={() => handleAction('resolved', true)}
                                        loading={updateMutation.isPending}
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