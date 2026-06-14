'use client'
import { useState } from 'react';
import { 
    Box, 
    Title, 
    Tabs, 
    Card, 
    Text, 
    Group, 
    Badge,
    Stack,
    Button,
    SimpleGrid,
    Flex,
    Divider
} from '@mantine/core';
import { 
    IconUsers, 
    IconFileText, 
    IconTags, 
    IconFolder,
    IconShield,
    IconSettings,
    IconChartBar,
    IconDatabase,
    IconBell,
    IconActivity
} from '@tabler/icons-react';
import StatsCard from '@/components/StatsCard';
import UserListClient from '../users/UserListClient';



// Компонент обзора системы
function SystemOverview() {
    return (
        <Stack gap="lg">
            <Title order={2}>Обзор системы</Title>
            
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
                <StatsCard
                    title="Пользователи"
                    value="1,234"
                    description="Активных пользователей"
                    icon={<IconUsers size={18} />}
                    color="blue"
                />
                <StatsCard
                    title="Статьи"
                    value="456"
                    description="Опубликованных статей"
                    icon={<IconFileText size={18} />}
                    color="green"
                />
                <StatsCard
                    title="Коммиты"
                    value="2,891"
                    description="Всего изменений"
                    icon={<IconActivity size={18} />}
                    color="orange"
                />
                <StatsCard
                    title="Модерация"
                    value="23"
                    description="Ожидают проверки"
                    icon={<IconShield size={18} />}
                    color="red"
                />
            </SimpleGrid>

            <Title order={3} mt="xl">Быстрые действия</Title>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                <Button
                    variant="light"
                    leftSection={<IconBell size={16} />}
                    size="md"
                    fullWidth
                >
                    Отправить уведомление
                </Button>
                <Button
                    variant="light"
                    leftSection={<IconDatabase size={16} />}
                    size="md"
                    fullWidth
                >
                    Резервная копия
                </Button>
                <Button
                    variant="light"
                    leftSection={<IconChartBar size={16} />}
                    size="md"
                    fullWidth
                >
                    Генерировать отчет
                </Button>
            </SimpleGrid>
        </Stack>
    );
}

// Компонент управления статьями
function ArticleManagement() {
    return (
        <Stack gap="lg">
            <Flex justify="space-between" align="center">
                <Title order={2}>Управление статьями</Title>
                <Button leftSection={<IconFileText size={16} />}>
                    Новая статья
                </Button>
            </Flex>
            
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Stack gap="sm">
                        <Group justify="space-between">
                            <Text fw={500}>Статистика статей</Text>
                            <Badge color="blue">Активно</Badge>
                        </Group>
                        <Text c="dimmed" size="sm">
                            Опубликовано: 456 статей
                        </Text>
                        <Text c="dimmed" size="sm">
                            Черновики: 78 статей
                        </Text>
                        <Text c="dimmed" size="sm">
                            На модерации: 12 статей
                        </Text>
                    </Stack>
                </Card>

                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Stack gap="sm">
                        <Group justify="space-between">
                            <Text fw={500}>Последние изменения</Text>
                        </Group>
                        <Text c="dimmed" size="sm">
                            Сегодня: 23 коммита
                        </Text>
                        <Text c="dimmed" size="sm">
                            Эта неделя: 156 коммитов
                        </Text>
                        <Text c="dimmed" size="sm">
                            Этот месяц: 567 коммитов
                        </Text>
                    </Stack>
                </Card>
            </SimpleGrid>
        </Stack>
    );
}

// Компонент управления категориями
function CategoryManagement() {
    return (
        <Stack gap="lg">
            <Flex justify="space-between" align="center">
                <Title order={2}>Управление категориями</Title>
                <Button leftSection={<IconFolder size={16} />}>
                    Новая категория
                </Button>
            </Flex>
            
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Text>
                    Здесь будет интерфейс для управления категориями статей, 
                    создания новых категорий и настройки иерархии.
                </Text>
            </Card>
        </Stack>
    );
}

// Компонент управления тегами
function TagManagement() {
    return (
        <Stack gap="lg">
            <Flex justify="space-between" align="center">
                <Title order={2}>Управление тегами</Title>
                <Button leftSection={<IconTags size={16} />}>
                    Новый тег
                </Button>
            </Flex>
            
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Text>
                    Здесь будет интерфейс для управления тегами, 
                    настройки разрешений и ограничений доступа.
                </Text>
            </Card>
        </Stack>
    );
}

// Компонент настроек системы
function SystemSettings() {
    return (
        <Stack gap="lg">
            <Title order={2}>Настройки системы</Title>
            
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Stack gap="sm">
                        <Text fw={500}>Общие настройки</Text>
                        <Divider />
                        <Text c="dimmed" size="sm">
                            Название сайта, описание, контактная информация
                        </Text>
                        <Button variant="light" size="sm">
                            Изменить
                        </Button>
                    </Stack>
                </Card>

                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Stack gap="sm">
                        <Text fw={500}>Безопасность</Text>
                        <Divider />
                        <Text c="dimmed" size="sm">
                            Настройки аутентификации и авторизации
                        </Text>
                        <Button variant="light" size="sm">
                            Настроить
                        </Button>
                    </Stack>
                </Card>

                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Stack gap="sm">
                        <Text fw={500}>Интеграции</Text>
                        <Divider />
                        <Text c="dimmed" size="sm">
                            API ключи, внешние сервисы
                        </Text>
                        <Button variant="light" size="sm">
                            Управлять
                        </Button>
                    </Stack>
                </Card>

                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Stack gap="sm">
                        <Text fw={500}>Резервные копии</Text>
                        <Divider />
                        <Text c="dimmed" size="sm">
                            Автоматическое резервное копирование
                        </Text>
                        <Button variant="light" size="sm">
                            Настроить
                        </Button>
                    </Stack>
                </Card>
            </SimpleGrid>
        </Stack>
    );
}

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<string>('overview');
    //const initialData = await usersApi.search({ skip: 0, limit: 10 });


    return (
        <Box p="md">
            <Title order={1} mb="xl">Панель администратора</Title>
            
            <Tabs value={activeTab} onChange={(e)=>setActiveTab(`${e}`)}>
                <Tabs.List>
                    <Tabs.Tab 
                        value="overview" 
                        leftSection={<IconChartBar size={16} />}
                    >
                        Обзор
                    </Tabs.Tab>
                    <Tabs.Tab 
                        value="users" 
                        leftSection={<IconUsers size={16} />}
                    >
                        Пользователи
                    </Tabs.Tab>
                    <Tabs.Tab 
                        value="articles" 
                        leftSection={<IconFileText size={16} />}
                    >
                        Статьи
                    </Tabs.Tab>
                    <Tabs.Tab 
                        value="categories" 
                        leftSection={<IconFolder size={16} />}
                    >
                        Категории
                    </Tabs.Tab>
                    <Tabs.Tab 
                        value="tags" 
                        leftSection={<IconTags size={16} />}
                    >
                        Теги
                    </Tabs.Tab>
                    <Tabs.Tab 
                        value="settings" 
                        leftSection={<IconSettings size={16} />}
                    >
                        Настройки
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="overview" pt="md">
                    <SystemOverview />
                </Tabs.Panel>

                <Tabs.Panel value="users" pt="md">
                    <div>Panel</div>
                </Tabs.Panel>

                <Tabs.Panel value="articles" pt="md">
                    <ArticleManagement />
                </Tabs.Panel>

                <Tabs.Panel value="categories" pt="md">
                    <CategoryManagement />
                </Tabs.Panel>

                <Tabs.Panel value="tags" pt="md">
                    <TagManagement />
                </Tabs.Panel>

                <Tabs.Panel value="settings" pt="md">
                    <SystemSettings />
                </Tabs.Panel>
            </Tabs>
        </Box>
    );
}