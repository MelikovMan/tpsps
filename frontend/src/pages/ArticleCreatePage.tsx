import  { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  Box,
  Text,
  LoadingOverlay,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconDeviceFloppy, IconEye } from '@tabler/icons-react';
import RichTextEditor, { type RichTextEditorRef } from '../components/RichTextEditor';
import { useCreateArticle } from '../api/articles';

interface ArticleFormData {
  title: string;
  status: string;
  article_type: string;
  message: string;
}

const statusOptions = [
  { value: 'draft', label: 'Черновик' },
  { value: 'published', label: 'Опубликовано' },
  { value: 'archived', label: 'Архив' },
];

const typeOptions = [
  { value: 'article', label: 'Статья' },
  { value: 'news', label: 'Новость' },
  { value: 'tutorial', label: 'Руководство' },
  { value: 'blog', label: 'Блог' },
];

export default function ArticleCreatePage() {
  const navigate = useNavigate();
  const editorRef = useRef<RichTextEditorRef>(null);
  const [content, setContent] = useState('');
  const [contentError, setContentError] = useState('');
  
  const createArticleMutation = useCreateArticle();

  const form = useForm<ArticleFormData>({
    initialValues: {
      title: '',
      status: 'draft',
      article_type: 'article',
      message: 'Создание новой статьи',
    },
    validate: {
      title: (value) => (!value.trim() ? 'Заголовок обязателен' : null),
      message: (value) => (!value.trim() ? 'Сообщение коммита обязательно' : null),
    },
  });

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    if (contentError && newContent.trim()) {
      setContentError('');
    }
  };

  const validateContent = () => {
    const textContent = editorRef.current?.getContent()?.replace(/<[^>]*>/g, '').trim();
    if (!textContent) {
      setContentError('Содержимое статьи обязательно');
      return false;
    }
    return true;
  };

  const handleSubmit = async (values: ArticleFormData) => {
    if (!validateContent()) {
      editorRef.current?.focus();
      return;
    }

    try {
      const articleData = {
        title: values.title.trim(),
        content,
        status: values.status,
        article_type: values.article_type,
        message: values.message.trim(),
      };

      const result = await createArticleMutation.mutateAsync(articleData);

      notifications.show({
        title: 'Успешно!',
        message: 'Статья создана успешно',
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      // Перенаправляем на страницу созданной статьи
      navigate(`/articles/${result.id}`);
    } catch (error: any) {
      console.error('Error creating article:', error);
      
      const errorMessage = error?.response?.data?.detail || 
                          error?.message || 
                          'Произошла ошибка при создании статьи';

      notifications.show({
        title: 'Ошибка',
        message: errorMessage,
        color: 'red',
        icon: <IconX size={16} />,
      });
    }
  };

  const handlePreview = () => {
    if (!form.values.title.trim()) {
      notifications.show({
        title: 'Внимание',
        message: 'Введите заголовок для предварительного просмотра',
        color: 'yellow',
      });
      return;
    }

    // Можно реализовать модальное окно предварительного просмотра
    // или открыть в новой вкладке
    console.log('Preview:', { title: form.values.title, content });
  };

  const handleCancel = () => {
    if (form.values.title.trim() || content.trim()) {
      if (window.confirm('У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?')) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  return (
    <Container size="lg" py="xl">
      <Paper shadow="sm" radius="md" p="xl" pos="relative">
        <LoadingOverlay visible={createArticleMutation.isPending} />
        
        <Title order={2} mb="lg">
          Создание новой статьи
        </Title>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Заголовок"
              placeholder="Введите заголовок статьи"
              required
              {...form.getInputProps('title')}
            />

            <Group grow>
              <Select
                label="Статус"
                data={statusOptions}
                {...form.getInputProps('status')}
              />
              <Select
                label="Тип статьи"
                data={typeOptions}
                {...form.getInputProps('article_type')}
              />
            </Group>

            <Box>
              <Text size="sm" fw={500} mb="xs">
                Содержимое <span style={{ color: 'var(--mantine-color-error-6)' }}>*</span>
              </Text>
              <RichTextEditor
                ref={editorRef}
                content={content}
                onChange={handleContentChange}
                placeholder="Начните писать вашу статью..."
                minHeight={300}
                error={contentError}
              />
            </Box>

            <TextInput
              label="Сообщение коммита"
              placeholder="Описание изменений"
              required
              {...form.getInputProps('message')}
            />

            <Group justify="flex-end" mt="xl">
              <Button
                variant="subtle"
                onClick={handleCancel}
                disabled={createArticleMutation.isPending}
              >
                Отмена
              </Button>
              
              <Button
                variant="light"
                leftSection={<IconEye size={16} />}
                onClick={handlePreview}
                disabled={createArticleMutation.isPending}
              >
                Предпросмотр
              </Button>
              
              <Button
                type="submit"
                leftSection={<IconDeviceFloppy size={16} />}
                loading={createArticleMutation.isPending}
              >
                Создать статью
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}