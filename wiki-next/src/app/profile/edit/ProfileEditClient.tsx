'use client';

import { useState, useEffect } from 'react';
import {
  Container, Paper, Title, Text, Group, Button, TextInput, Textarea,
  Stack, Box, ActionIcon, Card, SimpleGrid, Select
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import {
  IconDeviceFloppy, IconArrowLeft, IconTrash, IconPlus,
  IconBrandGithub, IconBrandTwitter, IconBrandLinkedin, IconWorld,
  IconCheck, IconX
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { profileApi } from '@/lib/api/profile';
import { createProfile, updateProfile, deleteProfile } from '@/app/actions/profile';
import type { UserProfile, CreateProfileData, UpdateProfileData, SocialLink } from '@/lib/api/types/profile';

const SOCIAL_PLATFORMS = [
  { value: 'github', label: 'GitHub', icon: IconBrandGithub },
  { value: 'twitter', label: 'Twitter/X', icon: IconBrandTwitter },
  { value: 'linkedin', label: 'LinkedIn', icon: IconBrandLinkedin },
  { value: 'website', label: 'Личный сайт', icon: IconWorld },
];

export default function ProfileEditClient({
  initialProfile,
  isCreating: initialIsCreating
}: {
  initialProfile: UserProfile | null;
  isCreating: boolean;
}) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(initialIsCreating);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<CreateProfileData | UpdateProfileData>({
    initialValues: {
      bio: '',
      avatar_url: '',
      social_links: {},
    },
    validate: {
      bio: (value) => (value && value.length > 1000 ? 'Описание не должно превышать 1000 символов' : null),
      avatar_url: (value) => {
        if (value && value.length > 0) {
          try {
            new URL(value);
            return null;
          } catch {
            return 'Введите корректный URL для аватара';
          }
        }
        return null;
      },
    },
  });

  useEffect(() => {
    if (!initialIsCreating && initialProfile) {
      form.setValues({
        bio: initialProfile.bio || '',
        avatar_url: initialProfile.avatar_url || '',
        social_links: initialProfile.social_links || {},
      });
      if (initialProfile.social_links) {
        const links = Object.entries(initialProfile.social_links).map(([platform, url]) => ({
          platform,
          url,
          label: SOCIAL_PLATFORMS.find(p => p.value === platform)?.label || platform,
        }));
        setSocialLinks(links);
      }
    }
  }, [initialProfile, initialIsCreating]);

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { platform: '', url: '', label: '' }]);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const updateSocialLink = (index: number, field: keyof SocialLink, value: string) => {
    const newLinks = [...socialLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    if (field === 'platform') {
      const platformData = SOCIAL_PLATFORMS.find(p => p.value === value);
      newLinks[index].label = platformData?.label || value;
    }
    setSocialLinks(newLinks);
  };

  const handleSubmit = async (values: CreateProfileData | UpdateProfileData) => {
    const socialLinksObject = socialLinks.reduce((acc, link) => {
      if (link.platform && link.url) {
        acc[link.platform] = link.url;
      }
      return acc;
    }, {} as Record<string, string>);

    const profileData = {
      ...values,
      social_links: Object.keys(socialLinksObject).length > 0 ? socialLinksObject : undefined,
    };

    setLoading(true);
    try {
      if (isCreating) {
        await createProfile(profileData);
        notifications.show({ title: 'Успешно!', message: 'Профиль создан', color: 'green', icon: <IconCheck size="1rem" /> });
      } else {
        await updateProfile(profileData);
        notifications.show({ title: 'Успешно!', message: 'Профиль обновлён', color: 'green', icon: <IconCheck size="1rem" /> });
      }
      router.push('/profile');
    } catch (err: any) {
      notifications.show({
        title: 'Ошибка',
        message: err.message || 'Произошла ошибка при сохранении профиля',
        color: 'red',
        icon: <IconX size="1rem" />,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = () => {
    modals.openConfirmModal({
      title: 'Удаление профиля',
      children: <Text>Вы уверены, что хотите удалить свой профиль? Это действие нельзя отменить.</Text>,
      labels: { confirm: 'Удалить', cancel: 'Отмена' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        setLoading(true);
        try {
          await deleteProfile();
          notifications.show({ title: 'Успешно!', message: 'Профиль удалён', color: 'green' });
          router.push('/profile');
        } catch (err: any) {
          notifications.show({ title: 'Ошибка', message: err.message || 'Не удалось удалить профиль', color: 'red' });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <Container size="md">
      <Group justify="space-between" mb="xl">
        <Group>
          <Button component={Link} href="/profile" variant="subtle" leftSection={<IconArrowLeft size="1rem" />}>
            Назад
          </Button>
          <Title order={1}>{isCreating ? 'Создание профиля' : 'Редактирование профиля'}</Title>
        </Group>
        {!isCreating && (
          <Button color="red" variant="light" leftSection={<IconTrash size="1rem" />} onClick={handleDeleteProfile} loading={loading}>
            Удалить профиль
          </Button>
        )}
      </Group>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section withBorder inheritPadding py="xs">
              <Text fw={500}>Основная информация</Text>
            </Card.Section>
            <Stack mt="md">
              <TextInput label="URL аватара" placeholder="https://example.com/avatar.jpg" {...form.getInputProps('avatar_url')} />
              <Textarea label="О себе" placeholder="Расскажите о себе..." minRows={4} maxRows={8} {...form.getInputProps('bio')} />
            </Stack>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section withBorder inheritPadding py="xs">
              <Group justify="space-between">
                <Text fw={500}>Социальные сети</Text>
                <Button size="xs" variant="light" leftSection={<IconPlus size="0.8rem" />} onClick={addSocialLink}>
                  Добавить
                </Button>
              </Group>
            </Card.Section>
            <Stack mt="md" gap="sm">
              {socialLinks.map((link, index) => (
                <Paper key={index} p="sm" withBorder>
                  <Group align="flex-end">
                    <Box style={{ flex: 1 }}>
                      <Text size="xs" fw={500} mb="xs">Платформа</Text>
                      <Select
                        data={SOCIAL_PLATFORMS.map(p => ({ value: p.value, label: p.label }))}
                        value={link.platform}
                        onChange={(value) => updateSocialLink(index, 'platform', value || '')}
                        placeholder="Выберите платформу"
                      />
                    </Box>
                    <TextInput
                      placeholder="https://..."
                      value={link.url}
                      onChange={(e) => updateSocialLink(index, 'url', e.currentTarget.value)}
                      style={{ flex: 2 }}
                      label="URL"
                    />
                    <ActionIcon color="red" variant="subtle" onClick={() => removeSocialLink(index)}>
                      <IconTrash size="1rem" />
                    </ActionIcon>
                  </Group>
                </Paper>
              ))}
              {socialLinks.length === 0 && (
                <Text size="sm" c="dimmed" ta="center" py="md">Нет добавленных социальных ссылок</Text>
              )}
            </Stack>
          </Card>
        </SimpleGrid>

        <Paper p="md" mt="xl" withBorder>
          <Group justify="center">
            <Button type="submit" leftSection={<IconDeviceFloppy size="1rem" />} loading={loading}>
              {isCreating ? 'Создать профиль' : 'Сохранить изменения'}
            </Button>
            <Button component={Link} href="/profile" variant="light">
              Отмена
            </Button>
          </Group>
        </Paper>
      </form>
    </Container>
  );
}