import { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
  Alert,
  Badge,
  Breadcrumbs,
  Anchor,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { 
  IconCheck, 
  IconX, 
  IconDeviceFloppy, 
  IconEye, 
  IconGitBranch,
  IconArrowLeft,
  IconAlertCircle 
} from '@tabler/icons-react';
import RichTextEditor, { type RichTextEditorRef } from '../components/RichTextEditor';
import { useArticle, useEditArticle, useArticleBranches } from '../api/articles';
import TurndownService from 'turndown';
interface ArticleEditFormData {
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

export default function ArticleEditPage() {
  const navigate = useNavigate();
  const { articleId } = useParams<{ articleId: string }>();
  const [searchParams] = useSearchParams();
  const branch = searchParams.get('branch') || 'main';
  
  const editorRef = useRef<RichTextEditorRef>(null);
  const [content, setContent] = useState('');
  const [contentError, setContentError] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const { data: article, isLoading: articleLoading, error: articleError } = useArticle(articleId!, branch);
  const { data: branches } = useArticleBranches(articleId!);
  const editArticleMutation = useEditArticle();


  const form = useForm<ArticleEditFormData>({
    initialValues: {
      title: '',
      status: 'draft',
      article_type: 'article',
      message: '',
    },
    validate: {
      title: (value) => (!value.trim() ? 'Заголовок обязателен' : null),
      message: (value) => (!value.trim() ? 'Сообщение коммита обязательно' : null),
    },
  });

  // Инициализация формы данными статьи
  useEffect(() => {
    if (article) {
      form.setValues({
        title: article.title,
        status: article.status,
        article_type: article.article_type,
        message: `Обновление статьи "${article.title}"`,
      });
      setContent(article.content);
      
      // Устанавливаем контент в редактор после его инициализации
      setTimeout(() => {
        editorRef.current?.setContent(article.content);
      }, 100);
    }
  }, [article]);

  // Отслеживание изменений для предупреждения о несохраненных данных
  useEffect(() => {
    if (article) {
      const hasChanges = 
        form.values.title !== article.title ||
        form.values.status !== article.status ||
        form.values.article_type !== article.article_type ||
        content !== article.content;
      
      setHasUnsavedChanges(hasChanges);
    }
  }, [form.values, content, article]);

  // Предупреждение при закрытии страницы с несохраненными изменениями
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

  const handleSubmit = async (values: ArticleEditFormData) => {
    if (!validateContent()) {
      editorRef.current?.focus();
      return;
    }

    try {
      await editArticleMutation.mutateAsync({
        articleId: articleId!,
        branch,
        editData: {
          message: values.message.trim(),
          content,
        },
      });

      notifications.show({
        title: 'Успешно!',
        message: 'Статья обновлена успешно',
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      setHasUnsavedChanges(false);
      
      // Перенаправляем на страницу статьи
      const branchParam = branch !== 'main' ? `?branch=${branch}` : '';
      navigate(`/articles/${articleId}${branchParam}`);
    } catch (error: any) {
      console.error('Error updating article:', error);
      
      const errorMessage = error?.response?.data?.detail || 
                          error?.message || 
                          'Произошла ошибка при обновлении статьи';

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
    console.log('Preview:', { title: form.values.title, content });
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?')) {
        const branchParam = branch !== 'main' ? `?branch=${branch}` : '';
        navigate(`/articles/${articleId}${branchParam}`);
      }
    } else {
      const branchParam = branch !== 'main' ? `?branch=${branch}` : '';
      navigate(`/articles/${articleId}${branchParam}`);
    }
  };

  const getBranchLabel = () => {
    const currentBranch = branches?.find(b => b.name === branch);
    return currentBranch ? currentBranch.name : branch;
  };

  const getBranchColor = () => {
    return branch === 'main' ? 'blue' : 'grape';
  };

  if (articleLoading) {
    return (
      <Container size="lg" py="xl">
        <Paper shadow="sm" radius="md" p="xl">
          <LoadingOverlay visible />
          <Text>Загрузка статьи...</Text>
        </Paper>
      </Container>
    );
  }

  if (articleError || !article) {
    return (
      <Container size="lg" py="xl">
        <Paper shadow="sm" radius="md" p="xl">
          <Alert 
            icon={<IconAlertCircle size={16} />} 
            title="Ошибка загрузки" 
            color="red"
            mb="md"
          >
            Не удалось загрузить статью. Проверьте правильность ID статьи и ветки.
          </Alert>
          <Button 
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate('/articles')}
          >
            Вернуться к списку статей
          </Button>
        </Paper>
      </Container>
    );
  }

  const branchParam = branch !== 'main' ? `?branch=${branch}` : '';

  return (
    <Container size="lg" py="xl">
      <Paper shadow="sm" radius="md" p="xl" pos="relative">
        <LoadingOverlay visible={editArticleMutation.isPending} />
        
        {/* Breadcrumbs */}
        <Breadcrumbs mb="md">
          <Anchor onClick={() => navigate('/articles')}>Статьи</Anchor>
          <Anchor onClick={() => navigate(`/articles/${articleId}${branchParam}`)}>
            {article.title}
          </Anchor>
          <Text>Редактирование</Text>
        </Breadcrumbs>

        {/* Header */}
        <Group justify="space-between" align="flex-start" mb="lg">
          <div>
            <Title order={2} mb="xs">
              Редактирование статьи
            </Title>
            <Group gap="xs">
              <Badge 
                leftSection={<IconGitBranch size={12} />}
                color={getBranchColor()}
                variant="light"
              >
                {getBranchLabel()}
              </Badge>
              {hasUnsavedChanges && (
                <Badge color="orange" variant="light">
                  Есть несохраненные изменения
                </Badge>
              )}
            </Group>
          </div>
        </Group>

        {/* Branch warning */}
        {branch !== 'main' && (
          <Alert 
            icon={<IconGitBranch size={16} />} 
            title="Редактирование в ветке" 
            color="blue"
            mb="md"
          >
            Вы редактируете статью в ветке "{branch}". Изменения будут сохранены в эту ветку.
          </Alert>
        )}

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
                minHeight={400}
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
                disabled={editArticleMutation.isPending}
              >
                Отмена
              </Button>
              
              <Button
                variant="light"
                leftSection={<IconEye size={16} />}
                onClick={handlePreview}
                disabled={editArticleMutation.isPending}
              >
                Предпросмотр
              </Button>
              
              <Button
                type="submit"
                leftSection={<IconDeviceFloppy size={16} />}
                loading={editArticleMutation.isPending}
                disabled={!hasUnsavedChanges}
              >
                Сохранить изменения
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}