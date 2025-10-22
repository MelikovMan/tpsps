// MediaListPage.tsx
import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Grid,
  Card,
  Image,
  Text,
  Group,
  Badge,
  Stack,
  Pagination,
  Select,
  TextInput,
  ActionIcon,
  Tooltip,
  Modal,
  Button,
  LoadingOverlay,
  Center
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconSearch,
  IconDownload,
  IconInfoCircle,
  IconFile,
  IconPhoto,
  IconVideo,
  IconMusic
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

interface MediaFile {
  id: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  public_url: string;
  uploaded_at: string;
  storage_path: string;
  bucket_name: string;
  object_key: string;
}

interface MediaResponse {
  data: MediaFile[];
  total: number;
  page: number;
  pages: number;
}

const ITEMS_PER_PAGE = 12;

export default function MediaListPage() {
  const { isAuthenticated } = useAuth();
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: mediaData, isLoading, error } = useQuery({
    queryKey: ['media', currentPage, searchTerm, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(typeFilter !== 'all' && { type: typeFilter })
      });

      const response = await fetch(`/api/media?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch media files');
      }
      return response.json() as Promise<MediaResponse>;
    },
    enabled: isAuthenticated,
  });

  const handleMediaClick = (media: MediaFile) => {
    setSelectedMedia(media);
    open();
  };

  const handleDownload = async (mediaId: string, filename: string) => {
    try {
      const response = await fetch(`/api/media/${mediaId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        notifications.show({
          title: 'Download started',
          message: `Downloading ${filename}`,
          color: 'green',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Download failed',
        message: 'Failed to download file',
        color: 'red',
      });
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <IconPhoto size={20} />;
    if (mimeType.startsWith('video/')) return <IconVideo size={20} />;
    if (mimeType.startsWith('audio/')) return <IconMusic size={20} />;
    return <IconFile size={20} />;
  };

  const getFileType = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType.startsWith('video/')) return 'Video';
    if (mimeType.startsWith('audio/')) return 'Audio';
    if (mimeType.startsWith('application/pdf')) return 'PDF';
    if (mimeType.startsWith('text/')) return 'Text';
    return 'Document';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return (
      <Container size="lg">
        <Center style={{ height: '60vh' }}>
          <Text size="xl" color="dimmed">
            Please log in to view media files
          </Text>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={1}>Media Library</Title>
          <Button 
            component="a" 
            href="/media/upload"
            variant="filled"
          >
            Upload New Media
          </Button>
        </Group>

        <Group grow>
          <TextInput
            placeholder="Search media files..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            leftSection={<IconSearch size={16} />}
          />
          <Select
            placeholder="Filter by type"
            value={typeFilter}
            onChange={(value) => {
              setTypeFilter(value || 'all');
              setCurrentPage(1);
            }}
            data={[
              { value: 'all', label: 'All Types' },
              { value: 'image', label: 'Images' },
              { value: 'video', label: 'Videos' },
              { value: 'audio', label: 'Audio' },
              { value: 'document', label: 'Documents' },
            ]}
          />
        </Group>

        <div style={{ position: 'relative', minHeight: 400 }}>
          <LoadingOverlay visible={isLoading} />
          
          {error && (
            <Center style={{ height: 200 }}>
              <Text color="red">Failed to load media files</Text>
            </Center>
          )}

          {mediaData && mediaData.data.length === 0 && (
            <Center style={{ height: 200 }}>
              <Text color="dimmed">No media files found</Text>
            </Center>
          )}

          <Grid>
            {mediaData?.data.map((media) => (
              <Grid.Col key={media.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                <Card 
                  shadow="sm" 
                  padding="lg" 
                  radius="md" 
                  withBorder
                  style={{ cursor: 'pointer', height: '100%' }}
                  onClick={() => handleMediaClick(media)}
                >
                  <Card.Section>
                    {media.mime_type.startsWith('image/') ? (
                      <Image
                        src={media.public_url}
                        height={160}
                        alt={media.original_filename}
                        fallbackSrc="https://placehold.co/400x300?text=Image+Not+Available"
                      />
                    ) : (
                      <Center style={{ height: 160, backgroundColor: 'var(--mantine-color-gray-0)' }}>
                        {getFileIcon(media.mime_type)}
                        <Text size="sm" ml="xs" c="dimmed">
                          {getFileType(media.mime_type)}
                        </Text>
                      </Center>
                    )}
                  </Card.Section>

                  <Stack gap="xs" mt="md">
                    <Text size="sm" fw={500} lineClamp={2}>
                      {media.original_filename}
                    </Text>
                    
                    <Group justify="apart">
                      <Badge size="sm" variant="light">
                        {getFileType(media.mime_type)}
                      </Badge>
                      <Text size="xs" c="dimmed">
                        {formatFileSize(media.file_size)}
                      </Text>
                    </Group>

                    <Group justify="apart" mt="auto">
                      <Text size="xs" c="dimmed">
                        {formatDate(media.uploaded_at)}
                      </Text>
                      <Group gap="xs">
                        <Tooltip label="Download">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(media.id, media.original_filename);
                            }}
                          >
                            <IconDownload size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Details">
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMediaClick(media);
                            }}
                          >
                            <IconInfoCircle size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>

          {mediaData && mediaData.pages > 1 && (
            <Center mt="xl">
              <Pagination
                value={currentPage}
                onChange={setCurrentPage}
                total={mediaData.pages}
                siblings={1}
                boundaries={1}
              />
            </Center>
          )}
        </div>
      </Stack>

      <Modal
        opened={opened}
        onClose={close}
        title="Media Details"
        size="lg"
        centered
      >
        {selectedMedia && (
          <Stack>
            {selectedMedia.mime_type.startsWith('image/') ? (
              <Image
                src={selectedMedia.public_url}
                alt={selectedMedia.original_filename}
                radius="md"
              />
            ) : (
              <Center style={{ height: 200, backgroundColor: 'var(--mantine-color-gray-0)' }}>
                <Group>
                  {getFileIcon(selectedMedia.mime_type)}
                  <Text size="xl">{getFileType(selectedMedia.mime_type)}</Text>
                </Group>
              </Center>
            )}
            
            <Stack gap="xs">
              <Group justify="apart">
                <Text fw={500}>Filename:</Text>
                <Text>{selectedMedia.original_filename}</Text>
              </Group>
              
              <Group justify="apart">
                <Text fw={500}>Type:</Text>
                <Badge>{getFileType(selectedMedia.mime_type)}</Badge>
              </Group>
              
              <Group justify="apart">
                <Text fw={500}>Size:</Text>
                <Text>{formatFileSize(selectedMedia.file_size)}</Text>
              </Group>
              
              <Group justify="apart">
                <Text fw={500}>Uploaded:</Text>
                <Text>{formatDate(selectedMedia.uploaded_at)}</Text>
              </Group>
              
              <Group justify="apart">
                <Text fw={500}>MIME Type:</Text>
                <Text>{selectedMedia.mime_type}</Text>
              </Group>
            </Stack>

            <Group justify="right" mt="md">
              <Button
                variant="light"
                leftSection={<IconDownload size={16} />}
                onClick={() => handleDownload(selectedMedia.id, selectedMedia.original_filename)}
              >
                Download
              </Button>
              <Button variant="outline" onClick={close}>
                Close
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}