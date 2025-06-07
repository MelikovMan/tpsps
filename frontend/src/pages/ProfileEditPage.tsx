// pages/ProfileEditPage.tsx
import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Button,
  TextInput,
  Textarea,
  Stack,
  Box,
  ActionIcon,
  Card,
  SimpleGrid
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconDeviceFloppy,
  IconArrowLeft,
  IconTrash,
  IconPlus,
  IconBrandGithub,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconWorld,
  IconCheck,
  IconX
} from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { type CreateProfileData, type UpdateProfileData, type SocialLink } from '../api/types/profile.ts';
import { useMyProfile, useCreateProfile, useUpdateProfile, useDeleteProfile } from '../api/profiles.tsx';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion } from 'framer-motion';
import { modals } from '@mantine/modals';

const SOCIAL_PLATFORMS = [
  { value: 'github', label: 'GitHub', icon: IconBrandGithub },
  { value: 'twitter', label: 'Twitter/X', icon: IconBrandTwitter },
  { value: 'linkedin', label: 'LinkedIn', icon: IconBrandLinkedin },
  { value: 'website', label: 'Личный сайт', icon: IconWorld },
];

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const { data: profile, isLoading, error } = useMyProfile();
  const createProfile = useCreateProfile();
  const updateProfile = useUpdateProfile();
  const deleteProfile = useDeleteProfile();

  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<CreateProfileData | UpdateProfileData>({
    initialValues: {
      bio: '',
      avatar_url: '',
      social_links: {},
    },
    validate: {
      bio: (value) => 
        value && value.length > 1000 ? 'Описание не должно превышать 1000 символов' : null,
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
    if (error?.response?.status === 404) {
      setIsCreating(true);
    } else if (profile) {
      form.setValues({
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
        social_links: profile.social_links || {},
      });

      // Преобразуем social_links в массив для редактирования
      if (profile.social_links) {
        const links = Object.entries(profile.social_links).map(([platform, url]) => ({
          platform,
          url,
          label: SOCIAL_PLATFORMS.find(p => p.value === platform)?.label || platform,
        }));
        setSocialLinks(links);
      }
    }
  }, [profile, error]);

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
    // Преобразуем массив социальных ссылок в объект
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

    try {
      if (isCreating) {
        await createProfile.mutateAsync(profileData);
        notifications.show({
          title: 'Успешно!',
          message: 'Профиль создан',
          color: 'green',
          icon: <IconCheck size="1rem" />,
        });
      } else {
        await updateProfile.mutateAsync(profileData);
        notifications.show({
          title: 'Успешно!',
          message: 'Профиль обновлен',
          color: 'green',
          icon: <IconCheck size="1rem" />,
        });
      }
      navigate('/profile');
    } catch (error: any) {
      notifications.show({
        title: 'Ошибка',
        message: error.response?.data?.detail || 'Произошла ошибка при сохранении профиля',
        color: 'red',
        icon: <IconX size="1rem" />,
      });
    }
  };

  const handleDeleteProfile = () => {
    modals.openConfirmModal({
      title: 'Удаление профиля',
      children: (
        <Text>
          Вы уверены, что хотите удалить свой профиль? Это действие нельзя отменить.
          Вся информация о профиле будет удалена безвозвратно.
        </Text>
      ),
      labels: { confirm: 'Удалить', cancel: 'Отмена' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await deleteProfile.mutateAsync();
          notifications.show({
            title: 'Успешно!',
            message: 'Профиль удален',
            color: 'green',
            icon: <IconCheck size="1rem" />,
          });
          navigate('/profile');
        } catch (error: any) {
          notifications.show({
            title: 'Ошибка',
            message: error.response?.data?.detail || 'Произошла ошибка при удалении профиля',
            color: 'red',
            icon: <IconX size="1rem" />,
          });
        }
      },
    });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Container size="md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Group justify="space-between" mb="xl">
          <Group>
            <Button
              component={Link}
              to="/profile"
              variant="subtle"
              leftSection={<IconArrowLeft size="1rem" />}
            >
              Назад
            </Button>
            <Title order={1}>
              {isCreating ? 'Создание профиля' : 'Редактирование профиля'}
            </Title>
          </Group>
          
          {!isCreating && (
            <Button
              color="red"
              variant="light"
              leftSection={<IconTrash size="1rem" />}
              onClick={handleDeleteProfile}
              loading={deleteProfile.isPending}
            >
              Удалить профиль
            </Button>
          )}
        </Group>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {/* Основная информация */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Card.Section withBorder inheritPadding py="xs">
                <Text fw={500}>Основная информация</Text>
              </Card.Section>

              <Stack mt="md">
                <TextInput
                  label="URL аватара"
                  placeholder="https://example.com/avatar.jpg"
                  {...form.getInputProps('avatar_url')}
                />

                <Textarea
                  label="О себе"
                  placeholder="Расскажите о себе..."
                  minRows={4}
                  maxRows={8}
                  {...form.getInputProps('bio')}
                />
              </Stack>
            </Card>

            {/* Социальные ссылки */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Card.Section withBorder inheritPadding py="xs">
                <Group justify="space-between">
                  <Text fw={500}>Социальные сети</Text>
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconPlus size="0.8rem" />}
                    onClick={addSocialLink}
                  >
                    Добавить
                  </Button>
                </Group>
              </Card.Section>

              <Stack mt="md" gap="sm">
                {socialLinks.map((link, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Paper p="sm" withBorder>
                      <Group align="flex-end">
                        <Box style={{ flex: 1 }}>
                          <Text size="xs" fw={500} mb="xs">Платформа</Text>
                          <select
                            style={{
                              width: '100%',
                              padding: '8px',
                              borderRadius: '4px',
                              border: '1px solid #ccc',
                            }}
                            value={link.platform}
                            onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                          >
                            <option value="">Выберите платформу</option>
                            {SOCIAL_PLATFORMS.map((platform) => (
                              <option key={platform.value} value={platform.value}>
                                {platform.label}
                              </option>
                            ))}
                          </select>
                        </Box>
                        
                        <TextInput
                          placeholder="https://..."
                          value={link.url}
                          onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                          style={{ flex: 2 }}
                          label="URL"
                        />
                        
                        <ActionIcon
                          color="red"
                          variant="subtle"
                          onClick={() => removeSocialLink(index)}
                        >
                          <IconTrash size="1rem" />
                        </ActionIcon>
                      </Group>
                    </Paper>
                  </motion.div>
                ))}

                {socialLinks.length === 0 && (
                  <Text size="sm" c="dimmed" ta="center" py="md">
                    Нет добавленных социальных ссылок
                  </Text>
                )}
              </Stack>
            </Card>
          </SimpleGrid>

          {/* Кнопки действий */}
          <Paper p="md" mt="xl" withBorder>
            <Group justify="center">
              <Button
                type="submit"
                leftSection={<IconDeviceFloppy size="1rem" />}
                loading={createProfile.isPending || updateProfile.isPending}
                size="md"
              >
                {isCreating ? 'Создать профиль' : 'Сохранить изменения'}
              </Button>
              
              <Button
                component={Link}
                to="/profile"
                variant="light"
                size="md"
              >
                Отмена
              </Button>
            </Group>
          </Paper>
        </form>
      </motion.div>
    </Container>
  );
}