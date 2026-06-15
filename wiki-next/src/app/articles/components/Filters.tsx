'use client';

import { Group, Select, Checkbox, Tooltip } from '@mantine/core';
import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

interface FiltersProps {
  status?: string | null;
  language?: string | null;
  fields?: string | null;
  hybrid?: boolean;
  isSearchMode: boolean; // если true – показываем расширенные фильтры поиска
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Черновик' },
  { value: 'published', label: 'Опубликовано' },
  { value: 'archived', label: 'Архив' },
];

const LANGUAGE_OPTIONS = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'Английский' },
];

const FIELDS_OPTIONS = [
  { value: 'both', label: 'Везде' },
  { value: 'title', label: 'Заголовки' },
  { value: 'content', label: 'Содержимое' },
];

export default function Filters({
  status,
  language,
  fields,
  hybrid,
  isSearchMode,
}: FiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  const updateParams = useCallback(
    (updates: Record<string, string | null | boolean>) => {
      const params = new URLSearchParams(window.location.search);
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          params.delete(key);
        } else if (typeof value === 'boolean') {
          params.set(key, value ? 'true' : 'false');
        } else {
          params.set(key, String(value));
        }
      });
      
      // При смене фильтра сбрасываем страницу на первую
      params.delete('page');
      
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname]
  );

  // Если не в режиме поиска – показываем только фильтр по статусу
  if (!isSearchMode) {
    return (
      <Group mb="md">
        <Select
          placeholder="Статус статьи"
          data={STATUS_OPTIONS}
          value={status || null}
          onChange={(val) => updateParams({ status: val })}
          clearable
          w={200}
        />
      </Group>
    );
  }

  // Режим поиска – расширенные фильтры
  return (
    <Group mb="md" grow>
      <Select
        placeholder="Язык"
        data={LANGUAGE_OPTIONS}
        value={language ?? "en"}
        onChange={(val) => updateParams({ lang: val })}
        clearable
      />
      <Select
        placeholder="Область поиска"
        data={FIELDS_OPTIONS}
        value={fields || 'both'}
        onChange={(val) => updateParams({ fields: val || 'both' })}
      />
      <Tooltip label="Объединяет полнотекстовый и семантический поиск (требуется Typesense)">
        <Checkbox
          label="Гибридный поиск"
          checked={hybrid || false}
          onChange={(e) => updateParams({ hybrid: e.currentTarget.checked })}
        />
      </Tooltip>
    </Group>
  );
}