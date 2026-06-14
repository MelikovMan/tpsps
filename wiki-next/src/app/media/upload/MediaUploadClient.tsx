'use client';

import { useState, useRef } from 'react';
import {
  Button, Group, Text, Card, Container, Progress, Stack, Title,
  Box, Image, SimpleGrid, ActionIcon, Badge, Center, LoadingOverlay
} from '@mantine/core';
import { Dropzone, type FileWithPath } from '@mantine/dropzone';
import { IconUpload, IconX, IconPhoto, IconTrash, IconFile } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { uploadMedia } from '@/app/actions/media';
import { getFileIcon, formatFileSize, getBadgeColor } from '@/lib/media-utils';

interface PreviewFile {
  id: string;
  file: FileWithPath;
  previewUrl: string;
  type: 'image' | 'video' | 'document' | 'other';
}

export default function MediaUploadClient() {
  const router = useRouter();
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const getFileTypeFromMime = (mimeType: string): PreviewFile['type'] => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('application/') || mimeType.startsWith('text/')) return 'document';
    return 'other';
  };

  const handleAddFiles = (newFiles: FileWithPath[]) => {
    const previewFiles: PreviewFile[] = newFiles.map(file => {
      const type = getFileTypeFromMime(file.type);
      let previewUrl = '';
      if (type === 'image' || type === 'video') {
        previewUrl = URL.createObjectURL(file);
      }
      return {
        id: Math.random().toString(36).substr(2, 9),
        file,
        previewUrl,
        type,
      };
    });
    setFiles(prev => [...prev, ...previewFiles]);
  };

  const removeFile = (id: string) => {
    const fileToRemove = files.find(f => f.id === id);
    if (fileToRemove?.previewUrl) URL.revokeObjectURL(fileToRemove.previewUrl);
    setFiles(files.filter(f => f.id !== id));
  };

  const clearAll = () => {
    files.forEach(file => {
      if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
    });
    setFiles([]);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setProgress(0);

    try {
      const total = files.length;
      let uploaded = 0;

      for (const previewFile of files) {
        const formData = new FormData();
        formData.append('file', previewFile.file);
        await uploadMedia(formData); // можно передать articleId/commitId при необходимости
        uploaded++;
        setProgress(Math.round((uploaded / total) * 100));
        notifications.show({
          title: 'Файл загружен',
          message: `Файл "${previewFile.file.name}" успешно загружен`,
          color: 'green',
        });
      }

      clearAll();
      notifications.show({
        title: 'Загрузка завершена',
        message: 'Все файлы успешно загружены',
        color: 'green',
      });
      router.push('/media');
    } catch (error) {
      notifications.show({
        title: 'Ошибка загрузки',
        message: 'Не удалось загрузить файлы',
        color: 'red',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="xl" ta="center">
        Загрузка медиафайлов
      </Title>

      <Card withBorder shadow="sm" radius="md" mb="xl">
        <Stack>
          <Dropzone
            onDrop={handleAddFiles}
            onReject={() =>
              notifications.show({
                title: 'Ошибка',
                message: 'Неподдерживаемый тип файла или слишком большой размер',
                color: 'red',
              })
            }
            maxSize={10 * 1024 ** 2}
            multiple
            disabled={isUploading}
            ref={dropzoneRef}
            activateOnClick
            style={{ cursor: 'pointer' }}
          >
            <Group justify="center" style={{ minHeight: 180, pointerEvents: 'none' }}>
              <Dropzone.Accept>
                <IconUpload size={50} />
              </Dropzone.Accept>
              <Dropzone.Reject>
                <IconX size={50} />
              </Dropzone.Reject>
              <Dropzone.Idle>
                <IconPhoto size={50} />
              </Dropzone.Idle>
              <Box>
                <Text size="xl" inline ta="center">
                  Перетащите файлы сюда или нажмите для выбора
                </Text>
                <Text size="sm" c="dimmed" inline mt={7} ta="center">
                  Поддерживаются изображения, видео, документы (макс. 10MB)
                </Text>
              </Box>
            </Group>
          </Dropzone>

          <Button
            variant="outline"
            fullWidth
            onClick={() => dropzoneRef.current?.click()}
            disabled={isUploading}
          >
            Выбрать файлы
          </Button>

          {files.length > 0 && (
            <>
              <Title order={4} mt="md">Выбранные файлы:</Title>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md" verticalSpacing="md">
                {files.map((previewFile) => (
                  <Card key={previewFile.id} shadow="sm" padding="sm" radius="md" withBorder style={{ position: 'relative' }}>
                    <ActionIcon
                      variant="filled"
                      color="red"
                      size="sm"
                      style={{ position: 'absolute', top: 5, right: 5, zIndex: 10 }}
                      onClick={() => removeFile(previewFile.id)}
                      disabled={isUploading}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>

                    {previewFile.type === 'image' ? (
                      <Image src={previewFile.previewUrl} height={120} alt={previewFile.file.name} fit="cover" radius="sm" />
                    ) : previewFile.type === 'video' ? (
                      <Center style={{ height: 120, backgroundColor: '#f8f9fa', borderRadius: 'var(--mantine-radius-sm)' }}>
                        <video src={previewFile.previewUrl} style={{ maxHeight: '100%', maxWidth: '100%' }} />
                      </Center>
                    ) : (
                      <Center style={{ height: 120, backgroundColor: '#f8f9fa', borderRadius: 'var(--mantine-radius-sm)' }}>
                        {getFileIcon(previewFile.file.type)}
                        <Text ml="sm" fw={500} size="sm">{previewFile.file.name}</Text>
                      </Center>
                    )}

                    <Text size="sm" fw={500} mt="sm" truncate>
                      {previewFile.file.name}
                    </Text>

                    <Group justify="space-between" mt={5}>
                      <Badge variant="light" color={getBadgeColor(previewFile.type)}>
                        {previewFile.type === 'image' ? 'Изображение' : previewFile.type === 'video' ? 'Видео' : previewFile.type === 'document' ? 'Документ' : 'Файл'}
                      </Badge>
                      <Text size="xs" c="dimmed">{formatFileSize(previewFile.file.size)}</Text>
                    </Group>
                  </Card>
                ))}
              </SimpleGrid>

              <Group justify="space-between" mt="md">
                <Text size="sm" c="dimmed">
                  Всего файлов: {files.length} | Общий размер: {formatFileSize(totalSize)}
                </Text>
                <Button variant="outline" color="red" onClick={clearAll} disabled={isUploading} leftSection={<IconTrash size={16} />}>
                  Очистить все
                </Button>
              </Group>

              {isUploading && (
                <Box mt="md">
                  <LoadingOverlay visible={isUploading} overlayProps={{ blur: 2 }} />
                  <Progress value={progress} size="lg" radius="xl" striped animated />
                  <Text size="sm" mt="xs" ta="center" c="dimmed">
                    Загружаем файлы, пожалуйста подождите...
                  </Text>
                </Box>
              )}

              <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={() => router.push('/media')} disabled={isUploading}>
                  Отмена
                </Button>
                <Button onClick={handleUpload} loading={isUploading} disabled={files.length === 0 || isUploading} leftSection={<IconUpload size={20} />}>
                  Загрузить файлы
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Card>

      <Group mt="xl" justify="center">
        <Button variant="subtle" onClick={() => router.push('/articles')}>
          Вернуться к статьям
        </Button>
      </Group>
    </Container>
  );
}