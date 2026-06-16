import { Container, Title, Text, Button, Group, Paper, Stack, Box } from '@mantine/core';
import { IconLock, IconHome, IconArrowBack, IconLogin, IconAlertOctagon } from '@tabler/icons-react';
import Link from 'next/link';
import { headers } from 'next/headers';
import BackButton from './components/BackButton';
import { Metadata } from 'next';

// Можно добавить метаданные для страницы
export const metadata: Metadata = {
  title: 'Доступ запрещён | Вики-Система',
  description: 'У вас недостаточно прав для просмотра этой страницы',
};

export default async function ForbiddenPage() {
  // Получаем referer, чтобы предложить вернуться назад (опционально)
  const headersList = await headers();
  const referer = headersList.get('referer');

  return (
    <Container size="sm" py="xl">
      <Paper
        shadow="xl"
        radius="lg"
        p="xl"
        withBorder
        style={{
          background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
          textAlign: 'center',
        }}
      >
        <Box mb="lg">
          <IconAlertOctagon
            size={80}
            style={{
              color: 'var(--mantine-color-red-6)',
              filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.1))',
            }}
          />
        </Box>
        <Title order={1} c="red" mb="xs">
          403
        </Title>
        <Title order={2} mb="md">
          Доступ запрещён
        </Title>
        <Text c="dimmed" mb="lg" size="lg">
          У вас недостаточно прав для просмотра этой страницы.
          <br />
          Если вы считаете, что это ошибка, обратитесь к администратору.
        </Text>

        <Stack gap="md" align="center">
          <Group justify="center" gap="md" wrap="wrap">
            <Button
              component={Link}
              href="/"
              leftSection={<IconHome size={18} />}
              variant="filled"
              color="blue"
              size="md"
            >
              На главную
            </Button>
            {referer && (
              <Button
                component="button"
                onClick={() => window.history.back()}
                leftSection={<IconArrowBack size={18} />}
                variant="light"
                size="md"
              >
                Вернуться назад
              </Button>
            )}
            <Button
              component={Link}
              href="/login"
              leftSection={<IconLogin size={18} />}
              variant="outline"
              size="md"
            >
              Войти под другим аккаунтом
            </Button>
            <BackButton />
          </Group>
          <Text size="sm" c="dimmed" mt="md">
            Нужны права? Обратитесь к администратору системы.
          </Text>
        </Stack>
      </Paper>
    </Container>
  );
}