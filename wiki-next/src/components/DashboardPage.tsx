// app/dashboard/page.tsx (или ваш путь)
import { Card, Title, Text, SimpleGrid, Divider, Stack, Group, Paper, ThemeIcon, Code } from '@mantine/core';
import ArticleCard from './TestingCard'; // путь подкорректируйте

export default function DashboardPage() {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Title order={2} mb="xs">Панель управления</Title>
      <Text c="dimmed" mb="lg">
        Добро пожаловать в вашу вики-систему! Здесь вы найдёте тестовые статьи и учётные данные.
      </Text>

      <Divider my="md" label="Тестовые статьи" labelPosition="center" />

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="xl">
        <ArticleCard
          href="/articles/550e8400-e29b-41d4-a716-446655440001"
          title="FastApi"
          description="Python фреймворк"
          color="blue"
        />
        <ArticleCard
          href="/articles/550e8400-e29b-41d4-a716-446655440002"
          title="PostgreSQL"
          description="Реляционная СУБД"
          color="grape"
        />
        <ArticleCard
          href="/articles/550e8400-e29b-41d4-a716-446655440003"
          title="Machine Learning"
          description="Искусственный интеллект"
          color="green"
        />
      </SimpleGrid>

      <Divider my="md" label="Тестовые пользователи" labelPosition="center" />

      <Stack gap="sm">
        <Paper p="sm" withBorder radius="md">
          <Group gap="xs" mb={4}>
            <Text fw={600} size="sm">Администратор</Text>
          </Group>
          <Text component="span" size="sm" ff="monospace" c="dimmed">
            Логин: <Code>admin</Code> Пароль: <Code>admin123</Code>
          </Text>
        </Paper>

        <Paper p="sm" withBorder radius="md">
          <Group gap="xs" mb={4}>
            <Text fw={600} size="sm">Модератор</Text>
          </Group>
          <Text component="span" size="sm" ff="monospace" c="dimmed">
            Логин: <Code>editor</Code> Пароль: <Code>editor123</Code>
          </Text>
        </Paper>

        <Paper p="sm" withBorder radius="md">
          <Group gap="xs" mb={4}>
            <Text fw={600} size="sm">Простой пользователь</Text>
          </Group>
          <Text component="span" size="sm" ff="monospace" c="dimmed">
            Логин: <Code>author</Code> Пароль: <Code>author123</Code>
          </Text>
        </Paper>
      </Stack>
    </Card>
  );
}