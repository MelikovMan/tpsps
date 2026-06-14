'use client';

import { useState, useEffect } from 'react';
import {
  Box, Button, TextInput, Select, Table, Group, ActionIcon,
  Modal, Text, Flex, Pagination, LoadingOverlay, Title, Badge, Stack
} from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { usersApi } from '@/lib/api/users';
import { createUser, updateUser, deleteUser } from '@/app/actions/users';
import type { UserResponse } from '@/lib/api/types/users';

const PAGE_SIZE = 10;

export default function UserListClient({ initialData }: { initialData: { data: UserResponse[]; total: number } }) {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [usersData, setUsersData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  const [debouncedSearch] = useDebouncedValue(searchTerm, 500);
  const [actionLoading, setActionLoading] = useState(false);

  // Загрузка данных при изменении параметров
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const data = await usersApi.search({
          q: debouncedSearch || undefined,
          role: roleFilter || undefined,
          skip: (page - 1) * PAGE_SIZE,
          limit: PAGE_SIZE,
        });
        setUsersData(data);
      } catch (err: any) {
        notifications.show({ title: 'Error', message: err.message || 'Failed to load users', color: 'red' });
      } finally {
        setLoading(false);
      }
    };

    // Если параметры начальные – используем initialData без запроса
    if (page === 1 && !debouncedSearch && !roleFilter) {
      setUsersData(initialData);
      setLoading(false);
      return;
    }

    fetchUsers();
  }, [page, debouncedSearch, roleFilter, initialData]);

  const createForm = useForm({
    initialValues: { username: '', email: '', role: 'user', password: '' },
    validate: {
      username: (v) => (v.length < 3 ? 'Минимум 3 символа' : null),
      email: (v) => (!/^\S+@\S+$/.test(v) ? 'Неверный email' : null),
      password: (v) => (v.length < 8 ? 'Пароль минимум 8 символов' : null),
    },
  });

  const editForm = useForm({
    initialValues: { username: '', email: '', role: 'user', password: '' },
  });

  const handleEditClick = (user: UserResponse) => {
    setSelectedUser(user);
    editForm.setValues({ username: user.username, email: user.email, role: user.role, password: '' });
    setEditModalOpen(true);
  };

  const handleDeleteClick = (user: UserResponse) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const handleCreateSubmit = async (values: any) => {
    setActionLoading(true);
    try {
      await createUser(values);
      notifications.show({ title: 'Создан', message: 'Пользователь создан', color: 'green' });
      setCreateModalOpen(false);
      createForm.reset();
      // Обновляем список
      const refreshed = await usersApi.search({ skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE, q: debouncedSearch || undefined, role: roleFilter || undefined });
      setUsersData(refreshed);
    } catch (err: any) {
      notifications.show({ title: 'Ошибка', message: err.message || 'Не удалось создать', color: 'red' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (values: any) => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await updateUser(selectedUser.id, values);
      notifications.show({ title: 'Обновлён', message: 'Данные пользователя обновлены', color: 'teal' });
      setEditModalOpen(false);
      const refreshed = await usersApi.search({ skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE, q: debouncedSearch || undefined, role: roleFilter || undefined });
      setUsersData(refreshed);
    } catch (err: any) {
      notifications.show({ title: 'Ошибка', message: err.message || 'Не удалось обновить', color: 'red' });
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await deleteUser(selectedUser.id);
      notifications.show({ title: 'Удалён', message: 'Пользователь удалён', color: 'red' });
      setDeleteModalOpen(false);
      const refreshed = await usersApi.search({ skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE, q: debouncedSearch || undefined, role: roleFilter || undefined });
      setUsersData(refreshed);
    } catch (err: any) {
      notifications.show({ title: 'Ошибка', message: err.message || 'Не удалось удалить', color: 'red' });
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil((usersData?.total || 0) / PAGE_SIZE);

  return (
    <Box p="md">
      <Title order={1} mb="xl">Управление пользователями</Title>

      <Flex justify="space-between" mb="md">
        <Group>
          <TextInput placeholder="Поиск пользователей..." value={searchTerm} onChange={(e) => setSearchTerm(e.currentTarget.value)} />
          <Select
            placeholder="Фильтр по роли"
            data={[
              { value: 'user', label: 'Пользователь' },
              { value: 'moderator', label: 'Модератор' },
              { value: 'admin', label: 'Администратор' },
            ]}
            value={roleFilter}
            onChange={setRoleFilter}
            clearable
          />
        </Group>
        <Button onClick={() => setCreateModalOpen(true)}>Создать пользователя</Button>
      </Flex>

      <Box pos="relative">
        <LoadingOverlay visible={loading} overlayProps={{ radius: 'sm', blur: 2 }} />
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Имя</Table.Th>
              <Table.Th>Почта</Table.Th>
              <Table.Th>Роль</Table.Th>
              <Table.Th>Создан</Table.Th>
              <Table.Th>Действия</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {usersData?.data.map((user) => (
              <Table.Tr key={user.id}>
                <Table.Td>{user.username}</Table.Td>
                <Table.Td>{user.email}</Table.Td>
                <Table.Td>
                  <Badge color={user.role === 'admin' ? 'red' : user.role === 'moderator' ? 'blue' : 'gray'}>
                    {user.role}
                  </Badge>
                </Table.Td>
                <Table.Td>{new Date(user.created_at).toLocaleDateString()}</Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    <ActionIcon color="blue" onClick={() => handleEditClick(user)}><IconEdit size={16} /></ActionIcon>
                    <ActionIcon color="red" onClick={() => handleDeleteClick(user)}><IconTrash size={16} /></ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        {!loading && usersData?.data.length === 0 && <Text ta="center" mt="md" c="dimmed">Не найдены</Text>}
        <Flex justify="flex-end" mt="md">
          <Pagination value={page} onChange={setPage} total={totalPages} disabled={loading} />
        </Flex>
      </Box>

      {/* Create Modal */}
      <Modal opened={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Создание пользователя">
        <form onSubmit={createForm.onSubmit(handleCreateSubmit)}>
          <Stack>
            <TextInput label="Имя пользователя" {...createForm.getInputProps('username')} required />
            <TextInput label="Email" type="email" {...createForm.getInputProps('email')} required />
            <Select label="Роль" data={[{ value: 'user', label: 'Пользователь' }, { value: 'moderator', label: 'Модератор' }, { value: 'admin', label: 'Администратор' }]} {...createForm.getInputProps('role')} required />
            <TextInput label="Пароль" type="password" {...createForm.getInputProps('password')} required />
            <Button type="submit" loading={actionLoading} fullWidth mt="md">Создать</Button>
          </Stack>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal opened={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Редактирование: ${selectedUser?.username}`}>
        <form onSubmit={editForm.onSubmit(handleEditSubmit)}>
          <Stack>
            <TextInput label="Имя пользователя" {...editForm.getInputProps('username')} required />
            <TextInput label="Email" type="email" {...editForm.getInputProps('email')} required />
            <Select label="Роль" data={[{ value: 'user', label: 'Пользователь' }, { value: 'moderator', label: 'Модератор' }, { value: 'admin', label: 'Администратор' }]} {...editForm.getInputProps('role')} required />
            <TextInput label="Пароль" type="password" placeholder="Оставьте пустым, чтобы не менять" {...editForm.getInputProps('password')} />
            <Button type="submit" loading={actionLoading} fullWidth mt="md">Обновить</Button>
          </Stack>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal opened={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Подтверждение удаления">
        <Text mb="md">Вы уверены, что хотите удалить <b>{selectedUser?.username}</b>? Это действие необратимо.</Text>
        <Group>
          <Button variant="default" onClick={() => setDeleteModalOpen(false)}>Отмена</Button>
          <Button color="red" onClick={confirmDelete} loading={actionLoading}>Удалить</Button>
        </Group>
      </Modal>
    </Box>
  );
}