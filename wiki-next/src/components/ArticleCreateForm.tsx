'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container, Paper, Title, TextInput, Select, Button, Group, Stack,
  Box, Text, LoadingOverlay, MultiSelect,
  Skeleton,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconDeviceFloppy, IconEye } from '@tabler/icons-react';
import dynamic from 'next/dynamic';
import type { RichTextEditorRef } from '@/components/RichTextEditor';
import { createArticle } from '@/app/actions/article';
import { htmlToMarkdown } from '@/lib/markdown';
import type { TemplateResponse } from '@/lib/api/types/templates';
import { CategoryResponse } from '@/lib/api/types/categories';

// Динамический импорт редактора (отключаем SSR)
const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  ssr: false,
  loading: () => <Skeleton>Загрузка редактора...</Skeleton>,
});

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

interface ArticleCreateFormProps {
  initialCategories: CategoryResponse[];
  initialTemplates: TemplateResponse[];
}

export default function ArticleCreateForm({ initialCategories, initialTemplates }: ArticleCreateFormProps) {
  const router = useRouter();
  const editorRef = useRef<RichTextEditorRef>(null);
  const [content, setContent] = useState('');
  const [contentError, setContentError] = useState('');
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    initialValues: {
      title: '',
      status: 'draft',
      article_type: 'article',
      message: 'Создание новой статьи',
      categoryIds: [] as string[],
    },
    validate: {
      title: (v) => (!v.trim() ? 'Заголовок обязателен' : null),
      message: (v) => (!v.trim() ? 'Сообщение коммита обязательно' : null),
    },
  });

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    if (contentError && newContent.trim()) setContentError('');
  };

  const validateContent = () => {
    const textContent = editorRef.current?.getContent()?.replace(/<[^>]*>/g, '').trim();
    if (!textContent) {
      setContentError('Содержимое статьи обязательно');
      return false;
    }
    return true;
  };

  const handleSubmit = async (values: typeof form.values) => {
    if (!validateContent()) {
      editorRef.current?.focus();
      return;
    }

    const html = editorRef.current?.getContent() || '';
    const markdown = htmlToMarkdown(html);
    if (!markdown.trim()) {
      setContentError('Содержимое статьи обязательно');
      return;
    }

    startTransition(async () => {
      try {
        await createArticle({
          title: values.title.trim(),
          content: markdown,
          status: values.status,
          article_type: values.article_type,
          message: values.message.trim(),
        });
        // После успешного создания redirect произойдёт в Server Action
      } catch (error: any) {
        notifications.show({
          title: 'Ошибка',
          message: error.message || 'Произошла ошибка при создании статьи',
          color: 'red',
        });
      }
    });
  };

  const handlePreview = () => {
    if (!form.values.title.trim()) {
      notifications.show({ title: 'Внимание', message: 'Введите заголовок для предпросмотра', color: 'yellow' });
      return;
    }
    // Можно открыть модалку или новую вкладку с предпросмотром
    console.log('Preview:', { title: form.values.title, content });
  };

  const handleCancel = () => {
    if (form.values.title.trim() || content.trim()) {
      if (window.confirm('У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?')) {
        router.back();
      }
    } else {
      router.back();
    }
  };

  const categoryOptions = initialCategories.map(c => ({ value: c.id, label: c.name }));

  return (
    <Container size="lg" py="xl">
      <Paper shadow="sm" radius="md" p="xl" pos="relative">
        <LoadingOverlay visible={isPending} />
        <Title order={2} mb="lg">Создание новой статьи</Title>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput label="Заголовок" required {...form.getInputProps('title')} />
            <Group grow>
              <Select label="Статус" data={statusOptions} {...form.getInputProps('status')} />
              <Select label="Тип статьи" data={typeOptions} {...form.getInputProps('article_type')} />
            </Group>
            <Box>
              <Text size="sm" fw={500} mb="xs">Содержимое *</Text>
              <RichTextEditor
                ref={editorRef}
                content={content}
                onChange={handleContentChange}
                placeholder="Начните писать вашу статью..."
                minHeight={300}
                error={contentError}
                //templates={initialTemplates}
              />
            </Box>
            <TextInput label="Сообщение коммита" required {...form.getInputProps('message')} />
            <MultiSelect
              label="Категории"
              data={categoryOptions}
              {...form.getInputProps('categoryIds')}
              searchable
              clearable
            />
            <Group justify="flex-end" mt="xl">
              <Button variant="subtle" onClick={handleCancel} disabled={isPending}>Отмена</Button>
              <Button variant="light" leftSection={<IconEye size={16} />} onClick={handlePreview} disabled={isPending}>
                Предпросмотр
              </Button>
              <Button type="submit" leftSection={<IconDeviceFloppy size={16} />} loading={isPending}>
                Создать статью
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}