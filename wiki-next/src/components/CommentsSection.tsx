'use client';

import { useState, useEffect } from 'react';
import {
  Box, Card, Text, Button, Textarea, Group, Avatar, Stack, ActionIcon, Menu,
  Alert, Skeleton, Divider, Badge
} from '@mantine/core';
import { IconMessage, IconDots, IconEdit, IconTrash, IconSend, IconAlertCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/context/AuthContext';
import { commentsApi } from '@/lib/api/comments';
import { addComment, editComment, removeComment } from '@/app/actions/comment';
import type { CommentResponse } from '@/lib/api/types/comment';

interface CommentsSectionProps {
  articleId: string;
  initialComments: CommentResponse[];
}

export default function CommentsSection({ articleId, initialComments }: CommentsSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentResponse[]>(initialComments);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await commentsApi.getByArticle(articleId);
      setComments(data);
    } catch (err: any) {
      notifications.show({ title: 'Ошибка', message: err.message, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  // Серверные экшены обновляют кэш автоматически, но можно сразу обновить локально
  const handleCreate = async (content: string, replyTo?: string) => {
    await addComment({ article_id: articleId, content, reply_to_id: replyTo });
    refresh(); // или оптимистичное обновление
  };

  const handleEdit = async (commentId: string, content: string) => {
    await editComment(commentId, { content });
    refresh();
  };

  const handleDelete = async (commentId: string) => {
    await removeComment(commentId);
    refresh();
  };

  return (
    <Stack gap="lg">
      <Group>
        <IconMessage size="1.2rem" />
        <Text size="lg" fw={600}>
          Комментарии ({comments.length + comments.reduce((acc, c) => acc + (c.replies?.length ?? 0), 0)})
        </Text>
      </Group>

      {user && <CommentForm onSubmit={content => handleCreate(content)} />}
      <Divider />

      {loading ? (
        <>{[...Array(3)].map((_, i) => <Skeleton key={i} height={100} />)}</>
      ) : comments.length === 0 ? (
        <Card withBorder p="xl" radius="md"><Text ta="center" c="dimmed">Нет комментариев</Text></Card>
      ) : (
        <Stack gap="md">
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} articleId={articleId} onEdit={handleEdit} onDelete={handleDelete} onReply={handleCreate} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function CommentForm({ onSubmit, replyTo, onCancel }: { onSubmit: (content: string) => void; replyTo?: string; onCancel?: () => void }) {
  const [content, setContent] = useState('');
  const handleSubmit = () => {
    onSubmit(content);
    setContent('');
    onCancel?.();
  };
  return (
    <Card withBorder p="md" radius="md">
      <Stack gap="sm">
        <Textarea placeholder={replyTo ? 'Ваш ответ...' : 'Написать комментарий...'} value={content} onChange={e => setContent(e.target.value)} minRows={3} autosize />
        <Group justify="flex-end">
          {onCancel && <Button variant="subtle" onClick={onCancel}>Отмена</Button>}
          <Button leftSection={<IconSend size="1rem" />} onClick={handleSubmit} disabled={!content.trim()}>Отправить</Button>
        </Group>
      </Stack>
    </Card>
  );
}

function CommentItem({ comment, depth = 0, maxDepth = 3, onEdit, onDelete, onReply }: any) {
  const { user } = useAuth();
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const isOwner = user?.id === comment.user_id;
  const canReply = depth < maxDepth;

  return (
    <Box ml={depth > 0 ? 'md' : 0}>
      <Card withBorder p="md" radius="md">
        <Group justify="space-between" align="flex-start" mb="sm">
          <Group>
            <Avatar size="sm" color="blue">{comment.user_id.slice(0, 2).toUpperCase()}</Avatar>
            <Box>
              <Text size="sm" fw={500}>Пользователь {comment.user_id.slice(0, 8)}</Text>
              <Text size="xs" c="dimmed">{new Date(comment.created_at).toLocaleString()}</Text>
            </Box>
            {depth > 0 && <Badge size="xs" variant="outline" color="gray">Ответ</Badge>}
          </Group>
          {(isOwner || user?.role === 'admin') && (
            <Menu>
              <Menu.Target><ActionIcon variant="subtle" size="sm"><IconDots size="1rem" /></ActionIcon></Menu.Target>
              <Menu.Dropdown>
                {isOwner && <Menu.Item leftSection={<IconEdit size="1rem" />} onClick={() => setEditing(true)}>Редактировать</Menu.Item>}
                <Menu.Item leftSection={<IconTrash size="1rem" />} color="red" onClick={() => onDelete(comment.id)}>Удалить</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>

        {editing ? (
          <Stack gap="sm">
            <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} minRows={3} autosize />
            <Group justify="flex-end">
              <Button variant="subtle" onClick={() => { setEditing(false); setEditContent(comment.content); }}>Отмена</Button>
              <Button onClick={() => { onEdit(comment.id, editContent); setEditing(false); }} disabled={!editContent.trim()}>Сохранить</Button>
            </Group>
          </Stack>
        ) : (
          <Text size="sm" style={{ whiteSpace: 'pre-wrap' }} mb="sm">{comment.content}</Text>
        )}

        {!editing && user && canReply && (
          <Button variant="subtle" size="xs" onClick={() => setReplying(!replying)}>Ответить</Button>
        )}
      </Card>

      {replying && (
        <Box mt="sm" ml="md">
          <CommentForm
            replyTo={comment.id}
            onSubmit={onReply}
            onCancel={() => setReplying(false)}
          />
        </Box>
      )}

      {comment.replies?.map((reply: CommentResponse) => (
        <CommentItem key={reply.id} comment={reply} depth={depth + 1} maxDepth={maxDepth} onEdit={onEdit} onDelete={onDelete} onReply={onReply} />
      ))}
    </Box>
  );
}