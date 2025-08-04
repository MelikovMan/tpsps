import { useState, useRef } from 'react';
import { 
  Button, Group, Text, Card, 
  Container, Progress, Stack, Title, Box, Image, 
  SimpleGrid, ActionIcon, Badge, Center, LoadingOverlay
} from '@mantine/core';
import { Dropzone, type FileWithPath } from '@mantine/dropzone';
import { IconUpload, IconX, IconPhoto, IconTrash, IconFile } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { uploadMedia } from '../api/media';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';

// Типы для предпросмотра файлов
interface PreviewFile {
  id: string;
  file: FileWithPath;
  previewUrl: string;
  type: 'image' | 'video' | 'document' | 'other';
}

export default function MediaUploadPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const handleAddFiles = (newFiles: FileWithPath[]) => {
    const previewFiles = newFiles.map(file => {
      const type = getFileType(file.type);
      let previewUrl = '';
      
      if (type === 'image' || type === 'video') {
        previewUrl = URL.createObjectURL(file);
      }
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        file,
        previewUrl,
        type
      };
    });
    
    setFiles(prev => [...prev, ...previewFiles as PreviewFile[]]);
  };

  const getFileType = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('application/') || mimeType.startsWith('text/')) return 'document';
    return 'other';
  };

  const removeFile = (id: string) => {
    const fileToRemove = files.find(f => f.id === id);
    if (fileToRemove && fileToRemove.previewUrl) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }
    setFiles(files.filter(f => f.id !== id));
  };

  const handleUpload = async () => {
    if (!files.length || !user) return;
    
    setIsUploading(true);
    setProgress(0);
    
    try {
      const totalFiles = files.length;
      let uploadedCount = 0;
      
      for (const previewFile of files) {
        const result = await uploadMedia(previewFile.file);
        uploadedCount++;
        setProgress(Math.round((uploadedCount / totalFiles) * 100));
        
        notifications.show({
          title: 'Файл загружен',
          message: `Файл "${previewFile.file.name}" успешно загружен`,
          color: 'green',
        });
      }
      
      // Освобождаем объекты URL
      files.forEach(file => {
        if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
      });
      
      setFiles([]);
      notifications.show({
        title: 'Загрузка завершена',
        message: `Все файлы успешно загружены`,
        color: 'green',
      });
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

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <IconPhoto size={40} />;
      case 'video': return <IconFile size={40} />;
      case 'document': return <IconFile size={40} />;
      default: return <IconFile size={40} />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} байт`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  };

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="xl" ta="center">
        Загрузка медиафайлов
      </Title>
      
      <Card withBorder shadow="sm" radius="md" mb="xl">
        <Stack>
          <Dropzone 
            onDrop={(newFiles)=>handleAddFiles(newFiles)}
            onReject={() => notifications.show({
              title: 'Ошибка',
              message: 'Неподдерживаемый тип файла или слишком большой размер',
              color: 'red',
            })}
            maxSize={10 * 1024 ** 2} // 10MB
            multiple
            disabled={isUploading}
            ref={dropzoneRef}
            activateOnClick={true}
            styles={{
              root: { cursor: 'pointer' }
            }}
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
                <Text size="sm" color="dimmed" inline mt={7} ta="center">
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
              
              <SimpleGrid 
                cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
                spacing="md"
                verticalSpacing="md"
              >
                {files.map((previewFile) => (
                  <Card 
                    key={previewFile.id} 
                    shadow="sm" 
                    padding="sm" 
                    radius="md" 
                    withBorder
                    style={{ position: 'relative' }}
                  >
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
                      <Image
                        src={previewFile.previewUrl}
                        height={120}
                        alt={previewFile.file.name}
                        fit="cover"
                        radius="sm"
                      />
                    ) : previewFile.type === 'video' ? (
                      <Box 
                        style={{ 
                          height: 120, 
                          backgroundColor: '#f8f9fa',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 'var(--mantine-radius-sm)'
                        }}
                      >
                        <video 
                          src={previewFile.previewUrl} 
                          style={{ maxHeight: '100%', maxWidth: '100%' }}
                        />
                      </Box>
                    ) : (
                      <Center 
                        style={{ 
                          height: 120, 
                          backgroundColor: '#f8f9fa',
                          borderRadius: 'var(--mantine-radius-sm)'
                        }}
                      >
                        {getFileIcon(previewFile.type)}
                        <Text ml="sm" fw={500} size="sm">
                          {previewFile.file.name}
                        </Text>
                      </Center>
                    )}
                    
                    <Text size="sm" fw={500} mt="sm" truncate>
                      {previewFile.file.name}
                    </Text>
                    
                    <Group justify="space-between" mt={5}>
                      <Badge variant="light" color={getBadgeColor(previewFile.type)}>
                        {previewFile.type === 'image' ? 'Изображение' : 
                         previewFile.type === 'video' ? 'Видео' : 
                         previewFile.type === 'document' ? 'Документ' : 'Файл'}
                      </Badge>
                      <Text size="xs" c="dimmed">
                        {formatFileSize(previewFile.file.size)}
                      </Text>
                    </Group>
                  </Card>
                ))}
              </SimpleGrid>
              
              <Group justify="space-between" mt="md">
                <Text size="sm" c="dimmed">
                  Всего файлов: {files.length} | Общий размер: {formatFileSize(
                    files.reduce((sum, file) => sum + file.file.size, 0)
                  )}
                </Text>
                
                <Button 
                  variant="outline" 
                  color="red"
                  onClick={() => {
                    files.forEach(file => {
                      if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
                    });
                    setFiles([]);
                  }}
                  disabled={isUploading}
                  leftSection={<IconTrash size={16} />}
                >
                  Очистить все
                </Button>
              </Group>
              
              {isUploading && (
                <Box mt="md">
                  <LoadingOverlay visible={isUploading} overlayProps={{ blur: 2 }} />
                  <Progress 
                    value={progress}  
                    size="lg" 
                    radius="xl" 
                    striped 
                    animated 
                  />
                  <Text size="sm" mt="xs" ta="center" c="dimmed">
                    Загружаем файлы, пожалуйста подождите...
                  </Text>
                </Box>
              )}
              
              <Group justify="flex-end" mt="md">
                <Button 
                  variant="default"
                  onClick={() => navigate('/articles')}
                  disabled={isUploading}
                >
                  Отмена
                </Button>
                <Button 
                  onClick={handleUpload} 
                  loading={isUploading}
                  disabled={files.length === 0 || isUploading}
                  leftSection={<IconUpload size={20} />}
                >
                  Загрузить файлы
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Card>
      
      <Group mt="xl" justify="center">
        <Button variant="subtle" onClick={() => navigate('/articles')}>
          Вернуться к статьям
        </Button>
      </Group>
    </Container>
  );
}

// Вспомогательная функция для цвета бейджа
const getBadgeColor = (type: string) => {
  switch (type) {
    case 'image': return 'blue';
    case 'video': return 'red';
    case 'document': return 'green';
    default: return 'gray';
  }
};