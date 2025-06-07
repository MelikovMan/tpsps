
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Button,
  Avatar,
  Box,
  Stack,
  Badge,
  Divider,
  Alert,
  ActionIcon,
  Tooltip,
  Card,
  SimpleGrid
} from '@mantine/core';
import { 
  IconEdit, 
  IconUser, 
  IconMail, 
  IconCalendar, 
  IconExternalLink,
  IconBrandGithub,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconWorld,
  IconInfoCircle
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useMyProfile } from '../api/profiles';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion } from 'framer-motion';

const getSocialIcon = (platform: string) => {
  const platformLower = platform.toLowerCase();
  if (platformLower.includes('github')) return <IconBrandGithub size="1rem" />;
  if (platformLower.includes('twitter') || platformLower.includes('x.com')) return <IconBrandTwitter size="1rem" />;
  if (platformLower.includes('linkedin')) return <IconBrandLinkedin size="1rem" />;
  return <IconWorld size="1rem" />;
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading, error } = useMyProfile();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const hasProfile = profile && !error;

  return (
    <Container size="md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Group justify="space-between" mb="xl">
          <Title order={1}>Мой профиль</Title>
          <Group>
            {hasProfile && (
              <Button
                component={Link}
                to="/profile/edit"
                leftSection={<IconEdit size="1rem" />}
                variant="light"
              >
                Редактировать
              </Button>
            )}
          </Group>
        </Group>

        {!hasProfile && error?.response?.status === 404 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Alert
              icon={<IconInfoCircle size="1rem" />}
              title="Профиль не создан"
              color="blue"
              mb="xl"
            >
              <Text mb="md">
                У вас пока нет профиля. Создайте его, чтобы рассказать о себе другим пользователям.
              </Text>
              <Button
                component={Link}
                to="/profile/edit"
                leftSection={<IconUser size="1rem" />}
              >
                Создать профиль
              </Button>
            </Alert>
          </motion.div>
        ) : null}

        {error && error.response?.status !== 404 && (
          <Alert color="red" mb="xl">
            Произошла ошибка при загрузке профиля: {error.message}
          </Alert>
        )}

        {hasProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              {/* Основная информация */}
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Card.Section withBorder inheritPadding py="xs">
                  <Group justify="space-between">
                    <Text fw={500}>Основная информация</Text>
                    <Badge color="blue" variant="light">
                      {user?.role === 'admin' ? 'Администратор' : 
                       user?.role === 'moderator' ? 'Модератор' : 'Пользователь'}
                    </Badge>
                  </Group>
                </Card.Section>

                <Stack mt="md" gap="md">
                  <Group>
                    <Avatar
                      src={profile.avatar_url}
                      size="xl"
                      radius="md"
                    />
                    <Box>
                      <Text size="xl" fw={600}>{user?.username}</Text>
                      <Group gap="xs" mt="xs">
                        <IconMail size="1rem" color="gray" />
                        <Text size="sm" c="dimmed">{user?.email}</Text>
                      </Group>
                      <Group gap="xs" mt="xs">
                        <IconCalendar size="1rem" color="gray" />
                        <Text size="sm" c="dimmed">
                        </Text>
                      </Group>
                    </Box>
                  </Group>

                  {profile.bio && (
                    <>
                      <Divider />
                      <Box>
                        <Text fw={500} mb="xs">О себе</Text>
                        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                          {profile.bio}
                        </Text>
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
                          <Text size="sm" fw={500} tt="capitalize">
                            {platform}
                          </Text>
                        </Group>
                        <Tooltip label={url}>
                          <ActionIcon
                            component="a"
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="subtle"
                            size="sm"
                          >
                            <IconExternalLink size="1rem" />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    ))
                  ) : (
                    <Text size="sm" c="dimmed" ta="center" py="xl">
                      Социальные ссылки не добавлены
                    </Text>
                  )}
                </Stack>
              </Card>
            </SimpleGrid>

            {/* Дополнительные действия */}
            <Paper p="md" mt="xl" withBorder>
              <Group justify="center">
                <Button
                  component={Link}
                  to="/profile/edit"
                  leftSection={<IconEdit size="1rem" />}
                  variant="filled"
                >
                  Редактировать профиль
                </Button>
              </Group>
            </Paper>
          </motion.div>
        )}
      </motion.div>
    </Container>
  );
}