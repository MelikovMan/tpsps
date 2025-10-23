// src/components/Moderation/RevertCommitModal.tsx
import { Modal, Stack, Notification, Text, Card, Group, Button } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { type CommitWithDetails } from './useModerationData';
import { useRevertCommit } from '../../api/articles';

interface RevertCommitModalProps {
  opened: boolean;
  onClose: () => void;
  commit: CommitWithDetails | null;
  onSuccess: () => void;
}

export const RevertCommitModal = ({ opened, onClose, commit, onSuccess }: RevertCommitModalProps) => {
  const revertCommitMutation = useRevertCommit();

  const handleConfirm = () => {
    if (commit) {
      revertCommitMutation.mutate(commit.id, {
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
      title="Откат коммита"
      size="lg"
    >
      <Stack>
        <Notification icon={<IconAlertCircle size={18} />} color="orange" title="Внимание">
          Это действие создаст новый коммит, отменяющий изменения выбранного коммита.
        </Notification>
        
        <Text>Вы уверены, что хотите откатить коммит?</Text>
        <Card withBorder>
          <Text fw={500}>Сообщение: {commit?.message}</Text>
          <Text size="sm" c="dimmed">Статья: {commit?.article_title}</Text>
          <Text size="sm" c="dimmed">ID коммита: {commit?.id}</Text>
          <Text size="sm" c="dimmed">Дата: {commit && new Date(commit.created_at).toLocaleString('ru-RU')}</Text>
        </Card>

        <Group justify="flex-end">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button 
            color="orange" 
            onClick={handleConfirm}
            loading={revertCommitMutation.isPending}
          >
            Откатить коммит
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};