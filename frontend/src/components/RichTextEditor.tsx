import { RichTextEditor, Link } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import Highlight from '@tiptap/extension-highlight';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import SubScript from '@tiptap/extension-subscript';
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import ImageExtension from '@tiptap/extension-image';
import { Box, Button, Group, Modal, Stack, Text, Image } from '@mantine/core';
import { forwardRef, useImperativeHandle, useEffect, useState } from 'react';
import { useMediaList } from '../api/media';
import { IconPhoto, IconVideo, IconMusic } from '@tabler/icons-react';


interface MediaEmbedModalProps {
  opened: boolean;
  onClose: () => void;
  onEmbed: (mediaId: string, mediaType: 'image' | 'video' | 'audio') => void;
}

function MediaEmbedModal({ opened, onClose, onEmbed }: MediaEmbedModalProps) {
  const { data: mediaList } = useMediaList({ limit: 50 });
  
  const images = mediaList?.data.filter(media => media.mime_type.startsWith('image/')) || [];
  const videos = mediaList?.data.filter(media => media.mime_type.startsWith('video/')) || [];
  const audio = mediaList?.data.filter(media => media.mime_type.startsWith('audio/')) || [];

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title="Вставить медиа" 
      size="xl"
    >
      <Stack gap="md">
        {/* Images Section */}
        {images.length > 0 && (
          <div>
            <Text size="sm" fw={500} mb="xs">
              <IconPhoto size={16} style={{ marginRight: 8 }} />
              Изображения
            </Text>
            <Group gap="xs">
              {images.slice(0, 6).map(media => (
                <Button
                  key={media.id}
                  variant="outline"
                  size="xs"
                  onClick={() => onEmbed(media.id, 'image')}
                  style={{ 
                    border: '1px solid #dee2e6',
                    padding: 4,
                    height: 'auto'
                  }}
                >
                  <Image
                    src={`${import.meta.env.VITE_API_URL}/media/${media.id}/url`}
                    height={40}
                    width={40}
                    fit="cover"
                    radius="sm"
                  />
                </Button>
              ))}
            </Group>
          </div>
        )}

        {/* Videos Section */}
        {videos.length > 0 && (
          <div>
            <Text size="sm" fw={500} mb="xs">
              <IconVideo size={16} style={{ marginRight: 8 }} />
              Видео
            </Text>
            <Group gap="xs">
              {videos.slice(0, 6).map(media => (
                <Button
                  key={media.id}
                  variant="outline"
                  size="sm"
                  onClick={() => onEmbed(media.id, 'video')}
                  leftSection={<IconVideo size={16} />}
                >
                  {media.original_filename}
                </Button>
              ))}
            </Group>
          </div>
        )}

        {/* Audio Section */}
        {audio.length > 0 && (
          <div>
            <Text size="sm" fw={500} mb="xs">
              <IconMusic size={16} style={{ marginRight: 8 }} />
              Аудио
            </Text>
            <Group gap="xs">
              {audio.slice(0, 6).map(media => (
                <Button
                  key={media.id}
                  variant="outline"
                  size="sm"
                  onClick={() => onEmbed(media.id, 'audio')}
                  leftSection={<IconMusic size={16} />}
                >
                  {media.original_filename}
                </Button>
              ))}
            </Group>
          </div>
        )}

        {mediaList?.data.length === 0 && (
          <Text c="dimmed" ta="center">
            Медиафайлы не найдены. Загрузите файлы в медиатеку.
          </Text>
        )}
      </Stack>
    </Modal>
  );
}



interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  minHeight?: number;
  error?: string;
}

export interface RichTextEditorRef {
  getContent: () => string;
  setContent: (content: string) => void;
  focus: () => void;
  blur: () => void;
}

const RichTextEditorComponent = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ content = '', onChange, placeholder = 'Введите текст...', minHeight = 200, error }, ref) => {
    const editor = useEditor({
      extensions: [
        StarterKit,
        Underline,
        Link,
        Superscript,
        SubScript,
        Highlight,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Color,
        TextStyle,
        ImageExtension.configure({
          HTMLAttributes: {
            style: 'max-width: 100%; height: auto; border-radius: 4px; margin: 10px 0;',
          },
        }),
      ],
      content: content ?? placeholder,
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        onChange?.(html);
      },
    });
    const [mediaModalOpened, setMediaModalOpened] = useState(false);
    useImperativeHandle(ref, () => ({
      getContent: () => editor?.getHTML() || '',
      setContent: (newContent: string) => {
        if (editor && newContent !== editor.getHTML()) {
          editor.commands.setContent(newContent);
        }
      },
      focus: () => editor?.commands.focus(),
      blur: () => editor?.commands.blur(),
    }));

    useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        editor.commands.setContent(content);
      }
    }, [content, editor]);


    const handleEmbedMedia = (mediaId: string, mediaType: 'image' | 'video' | 'audio') => {
      if (!editor) return;

      const mediaUrl = `${import.meta.env.VITE_API_URL}/media/${mediaId}/url`;
      
      switch (mediaType) {
        case 'image':
          // Use the image extension
          editor.chain().focus().setImage({ src: mediaUrl }).run();
          break;
        case 'video':
          // For video, insert HTML directly since we don't have a video extension
          const videoHtml = `
            <div style="margin: 10px 0;">
              <video controls style="max-width: 100%; border-radius: 4px;">
                <source src="${mediaUrl}" type="video/mp4">
                Ваш браузер не поддерживает видео тег.
              </video>
            </div>
          `;
          editor.chain().focus().insertContent(videoHtml).run();
          break;
        case 'audio':
          // For audio, insert HTML directly
          const audioHtml = `
            <div style="margin: 10px 0;">
              <audio controls style="width: 100%; max-width: 400px;">
                <source src="${mediaUrl}">
                Ваш браузер не поддерживает аудио тег.
              </audio>
            </div>
          `;
          editor.chain().focus().insertContent(audioHtml).run();
          break;
      }
      
      setMediaModalOpened(false);
    };
    return (
      <Box>
        <RichTextEditor editor={editor} style={{ minHeight }}>
          <RichTextEditor.Toolbar sticky stickyOffset={60}>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Bold />
              <RichTextEditor.Italic />
              <RichTextEditor.Underline />
              <RichTextEditor.Strikethrough />
              <RichTextEditor.ClearFormatting />
              <RichTextEditor.Highlight />
              <RichTextEditor.Code />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.ColorPicker
                colors={[
                  '#25262b',
                  '#868e96',
                  '#fa5252',
                  '#e64980',
                  '#be4bdb',
                  '#7950f2',
                  '#4c6ef5',
                  '#228be6',
                  '#15aabf',
                  '#12b886',
                  '#40c057',
                  '#82c91e',
                  '#fab005',
                  '#fd7e14',
                ]}
              />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.H1 />
              <RichTextEditor.H2 />
              <RichTextEditor.H3 />
              <RichTextEditor.H4 />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Blockquote />
              <RichTextEditor.Hr />
              <RichTextEditor.BulletList />
              <RichTextEditor.OrderedList />
              <RichTextEditor.Subscript />
              <RichTextEditor.Superscript />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Link />
              <RichTextEditor.Unlink />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.AlignLeft />
              <RichTextEditor.AlignCenter />
              <RichTextEditor.AlignJustify />
              <RichTextEditor.AlignRight />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Undo />
              <RichTextEditor.Redo />
            </RichTextEditor.ControlsGroup>
          </RichTextEditor.Toolbar>

          <RichTextEditor.Content
            style={{
              minHeight: minHeight - 60, // Учитываем высоту тулбара
              borderColor: error ? 'var(--mantine-color-error-6)' : undefined,
            }}
          />
        </RichTextEditor>
        <MediaEmbedModal
          opened={mediaModalOpened}
          onClose={() => setMediaModalOpened(false)}
          onEmbed={handleEmbedMedia}
        />
        {error && (
          <Box
            style={{
              color: 'var(--mantine-color-error-6)',
              fontSize: 'var(--mantine-font-size-sm)',
              marginTop: 'var(--mantine-spacing-xs)',
            }}
          >
            {error}
          </Box>
        )}
      </Box>
    );
  }
);

RichTextEditorComponent.displayName = 'RichTextEditorComponent';

export default RichTextEditorComponent;