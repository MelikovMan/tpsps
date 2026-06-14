'use client';

import { useState, useEffect } from 'react';
import {
  Container, Title, Grid, Card, Image, Text, Group, Badge, Stack,
  Pagination, Select, TextInput, ActionIcon, Tooltip, Modal, Button,
  LoadingOverlay, Center
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSearch, IconDownload, IconInfoCircle, IconTrash } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { mediaApi } from '@/lib/api/media';
import { deleteMedia } from '@/app/actions/media';
import { getFileIcon, getFileType, formatFileSize, formatDate } from '@/lib/media-utils';
import type { MediaFile, MediaListResponse } from '@/lib/api/types/media';

const ITEMS_PER_PAGE = 12;

export default function MediaListClient({ initialData }: { initialData: MediaListResponse }) {
  const router = useRouter();
  const [mediaData, setMediaData] = useState<MediaListResponse>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [opened, { open, close }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Загрузка данных при изменении параметров
  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await mediaApi.getList({
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          search: searchTerm || undefined,
          type: typeFilter === 'all' ? undefined : typeFilter,
        });
        setMediaData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load media');
      } finally {
        setLoading(false);
      }
    };

    // Если параметры начальные — используем initialData без запроса
    if (currentPage === 1 && !searchTerm && typeFilter === 'all') {
      setMediaData(initialData);
      setLoading(false);
      return;
    }

    fetchMedia();
  }, [currentPage, searchTerm, typeFilter, initialData]);

  const handleDownload = async (media: MediaFile) => {
    setDownloadingId(media.id);
    try {
      const url = await mediaApi.getDownloadUrl(media.id);
      const a = document.createElement('a');
      a.href = url;
      a.download = media.original_filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      notifications.show({
        title: 'Download started',
        message: `Downloading ${media.original_filename}`,
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Download failed',
        message: 'Failed to download file',
        color: 'red',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (mediaId: string) => {
    setDeletingId(mediaId);
    try {
      await deleteMedia(mediaId);
      notifications.show({
        title: 'Media deleted',
        message: 'Media file has been deleted successfully',
        color: 'green',
      });
      closeDeleteModal();
      if (selectedMedia?.id === mediaId) close();

      // Обновляем текущий список
      const refreshed = await mediaApi.getList({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchTerm || undefined,
        type: typeFilter === 'all' ? undefined : typeFilter,
      });
      setMediaData(refreshed);
    } catch (err) {
      notifications.show({
        title: 'Deletion failed',
        message: 'Failed to delete media file',
        color: 'red',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const canDelete = true; // замените на вашу проверку прав

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={1}>Media Library</Title>
          <Button component={Link} href="/media/upload" variant="filled">
            Upload New Media
          </Button>
        </Group>

        <Group grow>
          <TextInput
            placeholder="Search media files..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.currentTarget.value);
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
          <LoadingOverlay visible={loading} />
          {error && (
            <Center style={{ height: 200 }}>
              <Text c="red">{error}</Text>
            </Center>
          )}
          {mediaData && mediaData.total === 0 && (
            <Center style={{ height: 200 }}>
              <Text c="dimmed">No media files found</Text>
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
                  onClick={() => {
                    setSelectedMedia(media);
                    open();
                  }}
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
                              handleDownload(media);
                            }}
                            loading={downloadingId === media.id}
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
                              setSelectedMedia(media);
                              open();
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
                              loading={deletingId === media.id}
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
              />
            </Center>
          )}
        </div>
      </Stack>

      {/* Modal details - same as before */}
      <Modal opened={opened} onClose={close} title="Media Details" size="lg" centered>
        {selectedMedia && (
          <Stack>
            {selectedMedia.mime_type.startsWith('image/') ? (
              <Image src={selectedMedia.public_url} alt={selectedMedia.original_filename} radius="md" />
            ) : (
              <Center style={{ height: 200, backgroundColor: 'var(--mantine-color-gray-0)' }}>
                <Group>
                  <Text size="xl">{getFileIcon(selectedMedia.mime_type)}</Text>
                  <Text size="xl">{getFileType(selectedMedia.mime_type)}</Text>
                </Group>
              </Center>
            )}
            <Stack gap="xs">
              <Group justify="apart"><Text fw={500}>Filename:</Text><Text>{selectedMedia.original_filename}</Text></Group>
              <Group justify="apart"><Text fw={500}>Type:</Text><Badge>{getFileType(selectedMedia.mime_type)}</Badge></Group>
              <Group justify="apart"><Text fw={500}>Size:</Text><Text>{formatFileSize(selectedMedia.file_size)}</Text></Group>
              <Group justify="apart"><Text fw={500}>Uploaded:</Text><Text>{formatDate(selectedMedia.uploaded_at)}</Text></Group>
              <Group justify="apart"><Text fw={500}>MIME Type:</Text><Text>{selectedMedia.mime_type}</Text></Group>
            </Stack>
            <Group justify="right" mt="md">
              <Button
                variant="light"
                leftSection={<IconDownload size={16} />}
                onClick={() => handleDownload(selectedMedia)}
                loading={downloadingId === selectedMedia.id}
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
              <Button variant="outline" onClick={close}>Close</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Delete confirmation modal */}
      <Modal opened={deleteModalOpened} onClose={closeDeleteModal} title="Delete Media" size="sm" centered>
        <Stack>
          <Text>Are you sure you want to delete "{selectedMedia?.original_filename}"? This action cannot be undone.</Text>
          <Group justify="right">
            <Button variant="outline" onClick={closeDeleteModal}>Cancel</Button>
            <Button
              color="red"
              loading={deletingId === selectedMedia?.id}
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