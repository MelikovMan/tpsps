import { useState } from 'react';
import {
  Box,
  Card,
  Text,
  Button,
  Textarea,
  Group,
  Avatar,
  Stack,
  ActionIcon,
  Menu,
  Alert,
  Skeleton,
  Divider,
  Badge,
} from '@mantine/core';
import {
  IconMessage,
  IconDots,
  IconEdit,
  IconTrash,
  IconSend,
  IconAlertCircle,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../context/AuthContext';
import { useArticleComments, useCreateComment, useUpdateComment, useDeleteComment } from '../api/comment.tsx';
import { type CommentResponse } from '../api/comment.ts';
import { useUsers } from '../api/users.tsx';

interface CommentsSectionProps {
  articleId: string;
}

interface CommentItemProps {
  comment: CommentResponse;
  articleId: string;
  depth?: number;
  maxDepth?: number;
  usersMap?: Record<string, { username: string; full_name?: string }>;
}

interface ReplyFormProps {
  articleId: string;
  parentCommentId?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}

// Форма для ответа/создания комментария
function ReplyForm({ articleId, parentCommentId, onCancel, onSuccess }: ReplyFormProps) {
  const [content, setContent] = useState('');
  const { mutate: createComment, isPending } = useCreateComment();

  const handleSubmit = () => {
    if (!content.trim()) return;

    createComment(
      {
        article_id: articleId,
        content: content.trim(),
        reply_to_id: parentCommentId,
      },
      {
        onSuccess: () => {
          setContent('');
          onSuccess?.();
          notifications.show({
            title: 'Успешно',
            message: 'Комментарий добавлен',
            color: 'green',
          });
        },
        onError: () => {
          notifications.show({
            title: 'Ошибка',
            message: 'Не удалось добавить комментарий',
            color: 'red',
          });
        },
      }
    );
  };

  return (
    <Card withBorder p="md" radius="md">
      <Stack gap="sm">
        <Textarea
          placeholder={parentCommentId ? "Написать ответ..." : "Написать комментарий..."}
          value={content}
          onChange={(event) => setContent(event.currentTarget.value)}
          minRows={3}
          maxRows={8}
          autosize
        />
        <Group justify="flex-end">
          {onCancel && (
            <Button variant="subtle" onClick={onCancel}>
              Отмена
            </Button>
          )}
          <Button
            leftSection={<IconSend size="1rem" />}
            onClick={handleSubmit}
            disabled={!content.trim()}
            loading={isPending}
          >
            {parentCommentId ? 'Ответить' : 'Отправить'}
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}

// Отдельный комментарий
function CommentItem({ comment, articleId, depth = 0, maxDepth = 3, usersMap }: CommentItemProps) {
  const { user } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const { mutate: updateComment, isPending: isUpdating } = useUpdateComment();
  const { mutate: deleteComment, isPending: isDeleting } = useDeleteComment();

  const isOwner = user?.id === comment.user_id;
  const canReply = depth < maxDepth;
  
  // Получаем информацию о пользователе
  const commentUser = usersMap?.[comment.user_id];
  const displayName = commentUser?.full_name || commentUser?.username || `User ${comment.user_id.slice(0, 8)}`;
  const avatarText = commentUser?.username?.slice(0, 2).toUpperCase() || comment.user_id.slice(0, 2).toUpperCase();

  const handleEdit = () => {
    if (!editContent.trim()) return;

    updateComment(
      {
        commentId: comment.id,
        updateData: { content: editContent.trim() },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          notifications.show({
            title: 'Успешно',
            message: 'Комментарий обновлен',
            color: 'green',
          });
        },
        onError: () => {
          notifications.show({
            title: 'Ошибка',
            message: 'Не удалось обновить комментарий',
            color: 'red',
          });
        },
      }
    );
  };

  const handleDelete = () => {
    deleteComment(comment.id, {
      onSuccess: () => {
        notifications.show({
          title: 'Успешно',
          message: 'Комментарий удален',
          color: 'green',
        });
      },
      onError: () => {
        notifications.show({
          title: 'Ошибка',
          message: 'Не удалось удалить комментарий',
          color: 'red',
        });
      },
    });
  };

  return (
    <Box ml={depth > 0 ? 'md' : 0}>
      <Card withBorder p="md" radius="md">
        <Group justify="space-between" align="flex-start" mb="sm">
          <Group>
            <Avatar size="sm" color="blue">
              {comment.user_id.slice(0, 2).toUpperCase()}
            </Avatar>
            <Box>
              <Text size="sm" fw={500}>
                Пользователь {comment.user_id.slice(0, 8)}
              </Text>
              <Text size="xs" c="dimmed">
                {new Date(comment.created_at).toLocaleString()}
              </Text>
            </Box>
            {depth > 0 && (
              <Badge size="xs" variant="outline" color="gray">
                Ответ
              </Badge>
            )}
          </Group>

          {(isOwner || user?.role === 'admin') && (
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon variant="subtle" size="sm">
                  <IconDots size="1rem" />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                {isOwner && (
                  <Menu.Item
                    leftSection={<IconEdit size="1rem" />}
                    onClick={() => setIsEditing(true)}
                  >
                    Редактировать
                  </Menu.Item>
                )}
                <Menu.Item
                  leftSection={<IconTrash size="1rem" />}
                  color="red"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  Удалить
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>

        {isEditing ? (
          <Stack gap="sm">
            <Textarea
              value={editContent}
              onChange={(event) => setEditContent(event.currentTarget.value)}
              minRows={3}
              autosize
            />
            <Group justify="flex-end">
              <Button
                variant="subtle"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
              >
                Отмена
              </Button>
              <Button
                onClick={handleEdit}
                disabled={!editContent.trim()}
                loading={isUpdating}
              >
                Сохранить
              </Button>
            </Group>
          </Stack>
        ) : (
          <Text size="sm" style={{ whiteSpace: 'pre-wrap' }} mb="sm">
            {comment.content}
          </Text>
        )}

        {!isEditing && user && canReply && (
          <Group>
            <Button
              variant="subtle"
              size="xs"
              onClick={() => setIsReplying(!isReplying)}
            >
              Ответить
            </Button>
          </Group>
        )}
      </Card>

      {isReplying && (
        <Box mt="sm" ml="md">
          <ReplyForm
            articleId={articleId}
            parentCommentId={comment.id}
            onCancel={() => setIsReplying(false)}
            onSuccess={() => setIsReplying(false)}
          />
        </Box>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <Stack gap="sm" mt="sm">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              articleId={articleId}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}

// Основной компонент секции комментариев
export default function CommentsSection({ articleId }: CommentsSectionProps) {
  const { user } = useAuth();
  const { data: comments, isLoading, error } = useArticleComments(articleId);

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size="1rem" />} title="Ошибка" color="red">
        Не удалось загрузить комментарии
      </Alert>
    );
  }
  return (
    <Stack gap="lg">
      <Group>
        <IconMessage size="1.2rem" />
        <Text size="lg" fw={600}>
          Комментарии
          {comments && (
            <Text component="span" c="dimmed" fw={400}>
              {' '}
              ({comments.reduce(
                (prevValue,curValue)=>
                prevValue+1+(curValue.replies?.length ?? 0)
                
                ,0)})
            </Text>
          )}
        </Text>
      </Group>

      {user && (
        <>
          <ReplyForm articleId={articleId} />
          <Divider />
        </>
      )}

      {isLoading ? (
        <Stack gap="md">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} withBorder p="md">
              <Group mb="sm">
                <Skeleton height={32} circle />
                <Box style={{ flex: 1 }}>
                  <Skeleton height={16} width="30%" mb={4} />
                  <Skeleton height={12} width="20%" />
                </Box>
              </Group>
              <Skeleton height={60} />
            </Card>
          ))}
        </Stack>
      ) : comments && comments.length > 0 ? (
        <Stack gap="md">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              articleId={articleId}
            />
          ))}
        </Stack>
      ) : (
        <Card withBorder p="xl" radius="md">
          <Text ta="center" c="dimmed">
            {user 
              ? "Пока нет комментариев. Будьте первым!" 
              : "Пока нет комментариев. Войдите, чтобы оставить комментарий."
            }
          </Text>
        </Card>
      )}
    </Stack>
  );
}