'use client';

import { Group, Select, Checkbox, Tooltip } from '@mantine/core';
import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { useSearchTransition } from './SearchTransitionContext';

interface FiltersProps {
  status?: string | null;
  language?: string | null;
  fields?: string | null;
  hybrid?: boolean;
  isSearchMode: boolean;
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
  { value: 'title', label: 'Только заголовки' },
  { value: 'content', label: 'Только содержимое' },
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
  const { startTransition } = useSearchTransition();

  const updateParams = useCallback(
    (updates: Record<string, string | null | boolean>) => {
      const params = new URLSearchParams(window.location.search);

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          params.delete(key);
        } else if (typeof value === 'boolean') {
          if (value === true) {
            params.set(key, 'true');
          } else {
            params.delete(key); // false → удаляем параметр
          }
        } else {
          params.set(key, String(value));
        }
      });

      params.delete('page'); // сброс страницы при смене фильтра
      startTransition(()=>router.push(`${pathname}?${params.toString()}`))
    },
    [router, pathname]
  );

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

  return (
    <Group mb="md" grow>
      <Select
        placeholder="Язык (любой)"
        data={LANGUAGE_OPTIONS}
        value={language || null}
        onChange={(val) => updateParams({ lang: val })}
        clearable
      />
      <Select
        placeholder="Область поиска (везде)"
        data={FIELDS_OPTIONS}
        value={fields || null}
        onChange={(val) => updateParams({ fields: val })}
        clearable
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