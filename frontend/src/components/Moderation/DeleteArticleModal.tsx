// src/components/Moderation/DeleteArticleModal.tsx
import { Modal, Stack, Notification, Text, Card, Group, Button } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { type ArticleResponse } from '../../api/article';
import { useDeleteArticle } from '../../api/articles';

interface DeleteArticleModalProps {
  opened: boolean;
  onClose: () => void;
  article: ArticleResponse | null;
  onSuccess: () => void;
}

export const DeleteArticleModal = ({ opened, onClose, article, onSuccess }: DeleteArticleModalProps) => {
  const deleteArticleMutation = useDeleteArticle();

  const handleConfirm = () => {
    if (article) {
      deleteArticleMutation.mutate(article.id, {
        onSuccess: () => {
          onClose();
          onSuccess();
        }
      });
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Удаление статьи"
      size="lg"
    >
      <Stack>
        <Notification icon={<IconAlertCircle size={18} />} color="red" title="Критическое действие">
          Это действие невозможно отменить. Будут удалены все версии статьи, все коммиты и ветки.
        </Notification>
        
        <Text>Вы уверены, что хотите удалить статью?</Text>
        <Card withBorder>
          <Text fw={500}>Название: {article?.title}</Text>
          <Text size="sm" c="dimmed">Статус: {article?.status}</Text>
          <Text size="sm" c="dimmed">Тип: {article?.article_type}</Text>
          <Text size="sm" c="dimmed">ID статьи: {article?.id}</Text>
          <Text size="sm" c="dimmed">
            Последнее обновление: {article && new Date(article.updated_at).toLocaleString('ru-RU')}
          </Text>
        </Card>

        <Group justify="flex-end">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button 
            color="red" 
            onClick={handleConfirm}
            loading={deleteArticleMutation.isPending}
          >
            Удалить статью
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};