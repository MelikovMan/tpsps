// src/components/Moderation/DeleteBranchModal.tsx
import { Modal, Stack, Notification, Text, Card, Group, Button } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { type BranchWithDetails } from './useModerationData';
import { useDeleteBranch } from '../../api/articles';

interface DeleteBranchModalProps {
  opened: boolean;
  onClose: () => void;
  branch: BranchWithDetails | null;
  onSuccess: () => void;
}

export const DeleteBranchModal = ({ opened, onClose, branch, onSuccess }: DeleteBranchModalProps) => {
  const deleteBranchMutation = useDeleteBranch();

  const handleConfirm = () => {
    if (branch) {
      deleteBranchMutation.mutate(branch.id, {
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
      title="Удаление ветки"
    >
      <Stack>
        <Notification icon={<IconAlertCircle size={18} />} color="red" title="Внимание">
          Это действие невозможно отменить. Все коммиты, существующие только в этой ветке, будут потеряны.
        </Notification>
        
        <Text>Вы уверены, что хотите удалить ветку?</Text>
        <Card withBorder>
          <Text fw={500}>Ветка: {branch?.name}</Text>
          <Text size="sm" c="dimmed">Статья: {branch?.article_title}</Text>
          <Text size="sm" c="dimmed">Описание: {branch?.description || '—'}</Text>
          <Text size="sm" c="dimmed">ID ветки: {branch?.id}</Text>
        </Card>

        <Group justify="flex-end">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button 
            color="red" 
            onClick={handleConfirm}
            loading={deleteBranchMutation.isPending}
          >
            Удалить ветку
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};