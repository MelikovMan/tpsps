// MediaListPage.tsx
import { useState } from 'react';
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
import { IconSearch, IconDownload, IconInfoCircle, IconTrash } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { notifications } from '@mantine/notifications';

import {
  useMediaList,
  useDeleteMedia,
  useMediaDownload,
  getFileIcon,
  getFileType,
  formatFileSize,
  formatDate
} from '../api/media';

const ITEMS_PER_PAGE = 12;

export default function MediaListPage() {
  const { isAuthenticated, permissions } = useAuth();
  const [opened, { open, close }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: mediaData, isLoading, error } = useMediaList({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    search: searchTerm,
    type: typeFilter
  });

  const deleteMediaMutation = useDeleteMedia();
  const downloadMediaMutation = useMediaDownload();

  const handleMediaClick = (media: any) => {
    setSelectedMedia(media);
    open();
  };

  const handleDownload = async (mediaId: string, filename: string) => {
    try {
      const downloadUrl = await downloadMediaMutation.mutateAsync({ mediaId });
      
      // Create a temporary anchor element to trigger download
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      
      notifications.show({
        title: 'Download started',
        message: `Downloading ${filename}`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Download failed',
        message: 'Failed to download file',
        color: 'red',
      });
    }
  };

  const handleDelete = async (mediaId: string) => {
    try {
      await deleteMediaMutation.mutateAsync(mediaId);
      notifications.show({
        title: 'Media deleted',
        message: 'Media file has been deleted successfully',
        color: 'green',
      });
      closeDeleteModal();
      if (selectedMedia?.id === mediaId) {
        close();
      }
    } catch (error) {
      notifications.show({
        title: 'Deletion failed',
        message: 'Failed to delete media file',
        color: 'red',
      });
    }
  };

  const canDelete = permissions?.can_delete;

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
                        <Text size="xl">{getFileIcon(media.mime_type)}</Text>
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
                        {canDelete && (
                          <Tooltip label="Delete">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMedia(media);
                                openDeleteModal();
                              }}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </Group>
                    </Group>
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>

          {mediaData && mediaData.total > ITEMS_PER_PAGE && (
            <Center mt="xl">
              <Pagination
                value={currentPage}
                onChange={setCurrentPage}
                total={Math.ceil(mediaData.total / ITEMS_PER_PAGE)}
                siblings={1}
                boundaries={1}
              />
            </Center>
          )}
        </div>
      </Stack>

      {/* Media Details Modal */}
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
                  <Text size="xl">{getFileIcon(selectedMedia.mime_type)}</Text>
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
                loading={downloadMediaMutation.isPending}
              >
                Download
              </Button>
              {canDelete && (
                <Button
                  variant="outline"
                  color="red"
                  leftSection={<IconTrash size={16} />}
                  onClick={() => {
                    close();
                    openDeleteModal();
                  }}
                >
                  Delete
                </Button>
              )}
              <Button variant="outline" onClick={close}>
                Close
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Delete Media"
        size="sm"
        centered
      >
        <Stack>
          <Text>
            Are you sure you want to delete "{selectedMedia?.original_filename}"? This action cannot be undone.
          </Text>
          <Group justify="right">
            <Button variant="outline" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button
              color="red"
              loading={deleteMediaMutation.isPending}
              onClick={() => selectedMedia && handleDelete(selectedMedia.id)}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}