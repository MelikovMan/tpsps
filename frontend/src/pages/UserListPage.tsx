import { useState } from 'react';
import { 
    useQuery, 
    useMutation, 
    useQueryClient 
} from '@tanstack/react-query';
import { 
    Box, 
    Button, 
    TextInput, 
    Select, 
    Table, 
    Group, 
    ActionIcon, 
    Modal, 
    Text, 
    Flex,
    Pagination,
    LoadingOverlay,
    Title,
    Badge,
    Stack
} from '@mantine/core';
import { 
    IconEdit, 
    IconTrash, 
} from '@tabler/icons-react';
import apiClient from '../api/client';
import { type UserResponse } from '../api/users';
import { useDebouncedValue } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';

const PAGE_SIZE = 10;

export default function UserListPage() {
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string | null>(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
    
    const [debouncedSearch] = useDebouncedValue(searchTerm, 500);
    
    const queryClient = useQueryClient();

    // Fetch users with pagination and filtering
    const { data, isLoading } = useQuery({
        queryKey: ['users', page, debouncedSearch, roleFilter],
        queryFn: async () => {
            const response = await apiClient.get('/users/search', {
                params: {
                    q: debouncedSearch,
                    role: roleFilter,
                    skip: (page - 1) * PAGE_SIZE,
                    limit: PAGE_SIZE
                }
            });
            return response.data;
        },
    });

    // Create user mutation
    const createUserMutation = useMutation({
        mutationFn: (userData: any) => apiClient.post('/users', userData),
        onSuccess: () => {
            notifications.show({
                title: 'User created',
                message: 'User has been created successfully',
                color: 'green'
            });
            queryClient.invalidateQueries({queryKey:['users']});
            setCreateModalOpen(false);
        }
    });

    // Update user mutation
    const updateUserMutation = useMutation({
        mutationFn: (data: { userId: string, userData: any }) => 
            apiClient.put(`/users/${data.userId}`, data.userData),
        onSuccess: () => {
            notifications.show({
                title: 'User updated',
                message: 'User has been updated successfully',
                color: 'teal'
            });
            queryClient.invalidateQueries({queryKey:['users']});
            setEditModalOpen(false);
        }
    });

    // Delete user mutation
    const deleteUserMutation = useMutation({
        mutationFn: (userId: string) => apiClient.delete(`/users/${userId}`),
        onSuccess: () => {
            notifications.show({
                title: 'User deleted',
                message: 'User has been deleted successfully',
                color: 'red'
            });
            queryClient.invalidateQueries({queryKey:['users']});
            setDeleteModalOpen(false);
        }
    });

    // Create form
    const createForm = useForm({
        initialValues: {
            username: '',
            email: '',
            role: 'user',
            password: ''
        },
        validate: {
            username: (value) => value.length < 3 ? 'Username must be at least 3 characters' : null,
            email: (value) => !/^\S+@\S+$/.test(value) ? 'Invalid email' : null,
            password: (value) => value.length < 8 ? 'Password must be at least 8 characters' : null
        }
    });

    // Edit form
    const editForm = useForm({
        initialValues: {
            username: '',
            email: '',
            role: 'user',
            password: ''
        }
    });

    // Handle edit button click
    const handleEditClick = (user: UserResponse) => {
        setSelectedUser(user);
        editForm.setValues({
            username: user.username,
            email: user.email,
            role: user.role,
            password: ''
        });
        setEditModalOpen(true);
    };

    // Handle delete button click
    const handleDeleteClick = (user: UserResponse) => {
        setSelectedUser(user);
        setDeleteModalOpen(true);
    };

    // Submit create form
    const handleCreateSubmit = (values: any) => {
        createUserMutation.mutate(values);
    };

    // Submit edit form
    const handleEditSubmit = (values: any) => {
        if (selectedUser) {
            updateUserMutation.mutate({
                userId: selectedUser.id,
                userData: values
            });
        }
    };

    // Confirm delete
    const confirmDelete = () => {
        if (selectedUser) {
            deleteUserMutation.mutate(selectedUser.id);
        }
    };

    return (
        <Box p="md">
            <Title order={1} mb="xl">Управление пользователями</Title>
            
            <Flex justify="space-between" mb="md">
                <Group>
                    <TextInput
                        placeholder="Поиск пользователей..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.currentTarget.value)}
                    />
                    <Select
                        placeholder="Filter by role"
                        data={[
                            { value: 'user', label: 'User' },
                            { value: 'moderator', label: 'Moderator' },
                            { value: 'admin', label: 'Admin' }
                        ]}
                        value={roleFilter}
                        onChange={setRoleFilter}
                        clearable
                    />
                </Group>
                
                <Button 

                    onClick={() => setCreateModalOpen(true)}
                >
                    Создать пользователя
                </Button>
            </Flex>
            
            <Box pos="relative">
                <LoadingOverlay visible={isLoading} overlayProps={{ radius: "sm", blur: 2 }}/>
                
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
                        {data?.map((user: UserResponse) => (
                            <Table.Tr key={user.id}>
                                <Table.Td>{user.username}</Table.Td>
                                <Table.Td>{user.email}</Table.Td>
                                <Table.Td>
                                    <Badge 
                                        color={
                                            user.role === 'admin' ? 'red' : 
                                            user.role === 'moderator' ? 'blue' : 'gray'
                                        }
                                    >
                                        {user.role}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>{new Date(user.created_at).toLocaleDateString()}</Table.Td>
                                <Table.Td>
                                    <Group gap={4}>
                                        <ActionIcon
                                            color="blue"
                                            onClick={() => handleEditClick(user)}
                                        >
                                            <IconEdit size={16} />
                                        </ActionIcon>
                                        <ActionIcon
                                            color="red"
                                            onClick={() => handleDeleteClick(user)}
                                        >
                                            <IconTrash size={16} />
                                        </ActionIcon>
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
                
                {!isLoading && data?.length === 0 && (
                    <Text ta="center" mt="md" c="dimmed">
                        Не найдены
                    </Text>
                )}
                
                <Flex justify="flex-end" mt="md">
                    <Pagination
                        value={page}
                        onChange={setPage}
                        total={Math.ceil((data?.total || 0) / PAGE_SIZE)}
                        disabled={isLoading}
                    />
                </Flex>
            </Box>
            
            {/* Create User Modal */}
            <Modal
                opened={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title="Create New User"
            >
                <form onSubmit={createForm.onSubmit(handleCreateSubmit)}>
                    <Stack>
                        <TextInput
                            label="Username"
                            placeholder="Имя пользователя..."
                            {...createForm.getInputProps('username')}
                            required
                        />
                        <TextInput
                            label="Email"
                            placeholder="Эл. почта..."
                            type="email"
                            {...createForm.getInputProps('email')}
                            required
                        />
                        <Select
                            label="Role"
                            data={[
                                { value: 'user', label: 'Пользователь' },
                                { value: 'moderator', label: 'Модератор' },
                                { value: 'admin', label: 'Администратор' }
                            ]}
                            {...createForm.getInputProps('role')}
                            required
                        />
                        <TextInput
                            label="Password"
                            placeholder="Введите пароль"
                            type="password"
                            {...createForm.getInputProps('password')}
                            required
                        />
                        
                        <Button 
                            type="submit" 
                            loading={isLoading}
                            fullWidth
                            mt="md"
                        >
                            Создать пользователя
                        </Button>
                    </Stack>
                </form>
            </Modal>
            
            {/* Edit User Modal */}
            <Modal
                opened={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title={`Edit User: ${selectedUser?.username || ''}`}
            >
                <form onSubmit={editForm.onSubmit(handleEditSubmit)}>
                    <Stack>
                        <TextInput
                            label="Username"
                            placeholder="Имя пользователя..."
                            {...editForm.getInputProps('username')}
                            required
                        />
                        <TextInput
                            label="Email"
                            placeholder="Эл. почта..."
                            type="email"
                            {...editForm.getInputProps('email')}
                            required
                        />
                        <Select
                            label="Role"
                            data={[
                                { value: 'user', label: 'Пользователь' },
                                { value: 'moderator', label: 'Модератор' },
                                { value: 'admin', label: 'Администратор' }
                            ]}
                            {...editForm.getInputProps('role')}
                            required
                        />
                        <TextInput
                            label="Password"
                            placeholder="Оставьте без изменения"
                            type="password"
                            {...editForm.getInputProps('password')}
                        />
                        
                        <Button 
                            type="submit" 
                            loading={isLoading}
                            fullWidth
                            mt="md"
                        >
                            Обновить пользователя
                        </Button>
                    </Stack>
                </form>
            </Modal>
            
            {/* Delete Confirmation Modal */}
            <Modal
                opened={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Подтвердите удаление"
            >
                <Text mb="md">
                    Вы точно хотите удалить <b>{selectedUser?.username}</b>? 
                    Это действие нельзя отменить.
                </Text>
                
                <Group>
                    <Button 
                        variant="default" 
                        onClick={() => setDeleteModalOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button 
                        color="red" 
                        onClick={confirmDelete}
                        loading={isLoading}
                    >
                        Delete User
                    </Button>
                </Group>
            </Modal>
        </Box>
    );
}