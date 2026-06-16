'use client';

import { useState, useEffect } from 'react';
import {
  Container, Paper, Title, Text, Group, Button, Avatar, Box, Stack,
  Badge, Divider, Alert, ActionIcon, Tooltip, Card, SimpleGrid
} from '@mantine/core';
import {
  IconEdit, IconUser, IconMail, IconCalendar, IconExternalLink,
  IconBrandGithub, IconBrandTwitter, IconBrandLinkedin, IconWorld, IconInfoCircle
} from '@tabler/icons-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { profileApi } from '@/lib/api/profile';
import type { UserProfile } from '@/lib/api/types/profile';
import { notifications } from '@mantine/notifications';

const getSocialIcon = (platform: string) => {
  const p = platform.toLowerCase();
  if (p.includes('github')) return <IconBrandGithub size="1rem" />;
  if (p.includes('twitter') || p.includes('x.com')) return <IconBrandTwitter size="1rem" />;
  if (p.includes('linkedin')) return <IconBrandLinkedin size="1rem" />;
  return <IconWorld size="1rem" />;
};

export default function ProfileClient({
  initialProfile,
  errorStatus
}: {
  initialProfile: UserProfile | null;
  errorStatus: number | null;
}) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  const [loading, setLoading] = useState(!initialProfile && errorStatus !== 404);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Если профиль уже загружен или мы знаем, что его нет (404), не запрашиваем
    if (initialProfile !== null) return;
    if (errorStatus === 404) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const data = await profileApi.getMyProfile();
        setProfile(data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          // Профиль не найден – это нормально
          setProfile(null);
        } else {
          setError(err.message || 'Ошибка загрузки профиля');
          notifications.show({ title: 'Ошибка', message: 'Не удалось загрузить профиль', color: 'red' });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [initialProfile, errorStatus]);

  if (loading) return <div>Загрузка...</div>;

  const hasProfile = profile !== null;

  return (
    <Container size="md">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Мой профиль</Title>
        {hasProfile && (
          <Button component={Link} href="/profile/edit" leftSection={<IconEdit size="1rem" />} variant="light">
            Редактировать
          </Button>
        )}
      </Group>

      {!hasProfile && (
        <Alert icon={<IconInfoCircle size="1rem" />} title="Профиль не создан" color="blue" mb="xl">
          <Text mb="md">У вас пока нет профиля. Создайте его, чтобы рассказать о себе другим пользователям.</Text>
          <Button component={Link} href="/profile/edit" leftSection={<IconUser size="1rem" />}>
            Создать профиль
          </Button>
        </Alert>
      )}

      {error && <Alert color="red" mb="xl">{error}</Alert>}

      {hasProfile && (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          {/* Основная информация */}
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section withBorder inheritPadding py="xs">
              <Group justify="space-between">
                <Text fw={500}>Основная информация</Text>
                <Badge color="blue" variant="light">
                  {user?.role === 'admin' ? 'Администратор' : user?.role === 'moderator' ? 'Модератор' : 'Пользователь'}
                </Badge>
              </Group>
            </Card.Section>
            <Stack mt="md" gap="md">
              <Group>
                <Avatar src={profile.avatar_url} size="xl" radius="md" />
                <Box>
                  <Text size="xl" fw={600}>{user?.username}</Text>
                  <Group gap="xs" mt="xs">
                    <IconMail size="1rem" color="gray" />
                    <Text size="sm" c="dimmed">{user?.email}</Text>
                  </Group>
                </Box>
              </Group>
              {profile.bio && (
                <>
                  <Divider />
                  <Box>
                    <Text fw={500} mb="xs">О себе</Text>
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{profile.bio}</Text>
                  </Box>
                </>
              )}
            </Stack>
          </Card>

          {/* Социальные ссылки */}
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section withBorder inheritPadding py="xs">
              <Text fw={500}>Социальные сети</Text>
            </Card.Section>
            <Stack mt="md" gap="sm">
              {profile.social_links && Object.keys(profile.social_links).length > 0 ? (
                Object.entries(profile.social_links).map(([platform, url]) => (
                  <Group key={platform} justify="space-between">
                    <Group gap="xs">
                      {getSocialIcon(platform)}
                      <Text size="sm" fw={500} tt="capitalize">{platform}</Text>
                    </Group>
                    <Tooltip label={url}>
                      <ActionIcon component="a" href={url} target="_blank" rel="noopener noreferrer" variant="subtle" size="sm">
                        <IconExternalLink size="1rem" />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                ))
              ) : (
                <Text size="sm" c="dimmed" ta="center" py="xl">Социальные ссылки не добавлены</Text>
              )}
            </Stack>
          </Card>
        </SimpleGrid>
      )}
    </Container>
  );
}