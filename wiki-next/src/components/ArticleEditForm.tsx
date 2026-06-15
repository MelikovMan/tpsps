'use client';

import { useState, useRef, useEffect, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container, Paper, Title, TextInput, Select, Button, Group, Stack,
  Box, Text, LoadingOverlay, Alert, Badge, Breadcrumbs, Anchor, MultiSelect, Loader,
  Skeleton,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconDeviceFloppy, IconEye, IconGitBranch, IconArrowLeft, IconAlertCircle } from '@tabler/icons-react';
import dynamic from 'next/dynamic';
import type { RichTextEditorRef } from '@/components/RichTextEditor';
import { updateArticle, createBranchFromCommit, addArticleCategory, removeArticleCategory } from '@/app/actions/article';
import { htmlToMarkdown, markdownToHtml } from '@/lib/markdown';
import type { ArticleFullResponse, BranchResponse } from '@/lib/api/types/article';
import { CategoryResponse } from '@/lib/api/types/categories';
import { TemplateResponse } from '@/lib/api/types/templates';

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

interface ArticleEditFormProps {
  article: ArticleFullResponse;
  branches: BranchResponse[];
  articleCategories: CategoryResponse[];
  allCategories: CategoryResponse[];
  templates: TemplateResponse[];
  currentBranch: string;
}

export default function ArticleEditForm({
  article,
  branches,
  articleCategories,
  allCategories,
  templates,
  currentBranch,
}: ArticleEditFormProps) {
  const router = useRouter();
  const editorRef = useRef<RichTextEditorRef>(null);
  const [content, setContent] = useState('');
  const [contentError, setContentError] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [conflict, setConflict] = useState<{ headCommitId?: string } | null>(null);
  const [creatingBranch, setCreatingBranch] = useState(false);

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(articleCategories.map(c => c.id));
  const [categoryUpdatePending, setCategoryUpdatePending] = useState(false);

  const form = useForm({
    initialValues: {
      title: article.title,
      status: article.status,
      article_type: article.article_type,
      message: `Обновление статьи "${article.title}"`,
    },
    validate: {
      title: (v) => (!v.trim() ? 'Заголовок обязателен' : null),
      message: (v) => (!v.trim() ? 'Сообщение коммита обязательно' : null),
    },
  });

  // Конвертируем Markdown из article.content в HTML для редактора
  useEffect(() => {
    let cancelled = false;
    markdownToHtml(article.content).then(html => {
      if (!cancelled) {
        setContent(html);
        setTimeout(() => editorRef.current?.setContent(html), 100);
      }
    });
    return () => { cancelled = true; };
  }, [article.content]);

  // Отслеживаем изменения
  useEffect(() => {
    const hasChanges =
      form.values.title !== article.title ||
      form.values.status !== article.status ||
      form.values.article_type !== article.article_type ||
      content !== article.content ||
      JSON.stringify(selectedCategoryIds) !== JSON.stringify(articleCategories.map(c => c.id));
    setHasUnsavedChanges(hasChanges);
  }, [form.values, content, selectedCategoryIds, article, articleCategories]);

  // Предупреждение при закрытии
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

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
        await updateArticle(article.id, currentBranch, {
          content: markdown,
          message: values.message.trim(),
        });
        // redirect произойдёт в server action
      } catch (error: any) {
        if (error.message === 'CONFLICT') {
          setConflict({ headCommitId: undefined });
          // Попытаемся получить head commit id (можно через дополнительный запрос)
          try {
            const branchResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/branches/article/${article.id}/by-name/${currentBranch}`, {
              credentials: 'include',
            });
            if (branchResp.ok) {
              const branchData = await branchResp.json();
              setConflict({ headCommitId: branchData.head_commit_id });
            }
          } catch { /* ignore */ }
        } else {
          notifications.show({ title: 'Ошибка', message: error.message, color: 'red' });
        }
      }
    });
  };

  const handleCreateBranchFromCommit = async () => {
    if (!conflict?.headCommitId) return;
    setCreatingBranch(true);
    try {
      const newBranchName = `${currentBranch}-conflict-${Date.now()}`;
      await createBranchFromCommit(article.id, conflict.headCommitId, newBranchName, `Ветка для разрешения конфликта из ${currentBranch}`);
      router.push(`/articles/${article.id}/edit?branch=${encodeURIComponent(newBranchName)}`);
    } catch (err: any) {
      notifications.show({ title: 'Ошибка', message: err.message, color: 'red' });
    } finally {
      setCreatingBranch(false);
    }
  };

  const handleCategoryChange = async (newIds: string[]) => {
    const oldIds = selectedCategoryIds;
    const added = newIds.filter(id => !oldIds.includes(id));
    const removed = oldIds.filter(id => !newIds.includes(id));

    // Оптимистичное обновление
    setSelectedCategoryIds(newIds);
    setCategoryUpdatePending(true);

    try {
      for (const catId of added) {
        await addArticleCategory(article.id, catId);
      }
      for (const catId of removed) {
        await removeArticleCategory(article.id, catId);
      }
      notifications.show({ message: 'Категории обновлены', color: 'green' });
    } catch (error: any) {
      // Откат
      setSelectedCategoryIds(oldIds);
      notifications.show({ title: 'Ошибка', message: error.message, color: 'red' });
    } finally {
      setCategoryUpdatePending(false);
    }
  };

  const handlePreview = () => {
    if (!form.values.title.trim()) {
      notifications.show({ title: 'Внимание', message: 'Введите заголовок для предпросмотра', color: 'yellow' });
      return;
    }
    console.log('Preview:', { title: form.values.title, content });
  };

  const handleCancel = () => {
    if (hasUnsavedChanges && !window.confirm('У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?')) {
      return;
    }
    const branchParam = currentBranch !== 'main' ? `?branch=${currentBranch}` : '';
    router.push(`/articles/${article.id}${branchParam}`);
  };

  const getBranchLabel = () => branches.find(b => b.name === currentBranch)?.name || currentBranch;
  const getBranchColor = () => currentBranch === 'main' ? 'blue' : 'grape';

  const categoryOptions = useMemo(() => allCategories.map(c => ({ value: c.id, label: c.name })), [allCategories]);
  const branchParam = currentBranch !== 'main' ? `?branch=${currentBranch}` : '';

  return (
    <Container size="lg" py="xl">
      <Paper shadow="sm" radius="md" p="xl" pos="relative">
        <LoadingOverlay visible={isPending || creatingBranch} />
        <Breadcrumbs mb="md">
          <Anchor component="button" onClick={() => router.push('/articles')}>Статьи</Anchor>
          <Anchor component="button" onClick={() => router.push(`/articles/${article.id}${branchParam}`)}>{article.title}</Anchor>
          <Text>Редактирование</Text>
        </Breadcrumbs>

        <Group justify="space-between" align="flex-start" mb="lg">
          <div>
            <Title order={2} mb="xs">Редактирование статьи</Title>
            <Group gap="xs">
              <Badge leftSection={<IconGitBranch size={12} />} color={getBranchColor()} variant="light">
                {getBranchLabel()}
              </Badge>
              {hasUnsavedChanges && <Badge color="orange">Есть несохраненные изменения</Badge>}
            </Group>
          </div>
        </Group>

        {currentBranch !== 'main' && (
          <Alert icon={<IconGitBranch size={16} />} title="Редактирование в ветке" color="blue" mb="md">
            Вы редактируете статью в ветке "{currentBranch}". Изменения будут сохранены в эту ветку.
          </Alert>
        )}

        {conflict && (
          <Alert color="red" title="Конфликт версий" icon={<IconAlertCircle size={16} />} mb="md">
            <Text>{conflict.headCommitId ? 'Ветка была обновлена другим пользователем. Вы можете создать новую ветку из последней версии.' : 'Конфликт при сохранении.'}</Text>
            <Group mt="md">
              <Button color="blue" onClick={handleCreateBranchFromCommit} disabled={!conflict.headCommitId || creatingBranch}>
                Создать новую ветку из текущей версии
              </Button>
              <Button variant="light" onClick={() => router.push(`/articles/${article.id}${branchParam}`)}>
                Отменить изменения и вернуться к статье
              </Button>
            </Group>
          </Alert>
        )}

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
                onChange={setContent}
                placeholder="Начните писать вашу статью..."
                minHeight={400}
                error={contentError}
                //templates={templates}}
              />
            </Box>
            <TextInput label="Сообщение коммита" required {...form.getInputProps('message')} />
            <MultiSelect
              label="Категории"
              data={categoryOptions}
              value={selectedCategoryIds}
              onChange={handleCategoryChange}
              searchable
              clearable
              disabled={categoryUpdatePending}
              rightSection={categoryUpdatePending && <Loader size="xs" />}
            />
            <Group justify="flex-end" mt="xl">
              <Button variant="subtle" onClick={handleCancel} disabled={isPending}>Отмена</Button>
              <Button variant="light" leftSection={<IconEye size={16} />} onClick={handlePreview} disabled={isPending}>
                Предпросмотр
              </Button>
              <Button type="submit" leftSection={<IconDeviceFloppy size={16} />} loading={isPending} disabled={!hasUnsavedChanges}>
                Сохранить изменения
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}