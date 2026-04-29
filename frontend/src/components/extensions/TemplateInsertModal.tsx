import { useState, useEffect } from 'react';
import {
  Modal,
  Select,
  TextInput,
  Button,
  Group,
  Stack,
  Text,
  Loader,
  Alert,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useTemplates } from '../../api/templates';
import type { TemplateResponse } from '../../api/types/templates';

interface TemplateInsertModalProps {
  opened: boolean;
  onClose: () => void;
  onInsert: (name: string, params: Record<string, string>) => void;
}

export default function TemplateInsertModal({ opened, onClose, onInsert }: TemplateInsertModalProps) {
  const { data: templates, isLoading } = useTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateResponse | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!opened) {
      setSelectedTemplate(null);
      setParamValues({});
    }
  }, [opened]);

  const handleTemplateChange = (templateName: string | null) => {
    const tpl = templates?.find((t) => t.name === templateName) || null;
    setSelectedTemplate(tpl);
    if (tpl && tpl.variables) {
      // variables: { title: "string", overview: "text", ... }
      const initial: Record<string, string> = {};
      Object.keys(tpl.variables).forEach((param) => {
        initial[param] = ''; // значений по умолчанию нет, поля будут пустыми
      });
      setParamValues(initial);
    } else {
      setParamValues({});
    }
  };

  const handleInsert = () => {
    if (!selectedTemplate) return;
    // Передаём все параметры, даже если они пустые – шаблон может ожидать их наличие
    onInsert(selectedTemplate.name, { ...paramValues });
    onClose();
  };

  const templateOptions = templates?.map((t) => ({ value: t.name, label: t.name })) || [];

  return (
    <Modal opened={opened} onClose={onClose} title="Вставить шаблон" size="md">
      {isLoading ? (
        <Loader />
      ) : templates?.length === 0 ? (
        <Alert icon={<IconAlertCircle size="1rem" />} color="gray">
          Нет доступных шаблонов
        </Alert>
      ) : (
        <Stack>
          <Select
            label="Выберите шаблон"
            placeholder="Начните вводить имя шаблона"
            data={templateOptions}
            value={selectedTemplate?.name || null}
            onChange={handleTemplateChange}
            searchable
            clearable
          />

          {selectedTemplate && (
            <>
              {selectedTemplate.variables && Object.keys(selectedTemplate.variables).length > 0 ? (
                <>
                  <Text size="sm" fw={500}>
                    Параметры шаблона
                  </Text>
                  {Object.keys(selectedTemplate.variables).map((param) => (
                    <TextInput
                      key={param}
                      label={param}
                      placeholder={param}
                      value={paramValues[param] || ''}
                      onChange={(e) =>
                        setParamValues((prev) => ({ ...prev, [param]: e.target.value }))
                      }
                    />
                  ))}
                </>
              ) : (
                <Text size="sm" c="dimmed">
                  Шаблон не требует параметров
                </Text>
              )}

              <Group justify="flex-end" mt="md">
                <Button onClick={handleInsert}>Вставить</Button>
              </Group>
            </>
          )}
        </Stack>
      )}
    </Modal>
  );
}