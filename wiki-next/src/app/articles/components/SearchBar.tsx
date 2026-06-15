// app/articles/components/SearchBar.tsx
'use client';
import { TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useRouter, usePathname } from 'next/navigation';
import { useDebouncedCallback } from '@mantine/hooks';

export default function SearchBar({ initialValue }: { initialValue: string }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(window.location.search);
    if (term) {
      params.set('q', term);
      params.delete('page'); // сброс страницы при новом поиске
    } else {
      params.delete('q');
    }
    router.push(`${pathname}?${params.toString()}`);
  }, 100);
  
  return (
    <TextInput
      placeholder="Поиск..."
      defaultValue={initialValue}
      onChange={(e) => handleSearch(e.currentTarget.value)}
      leftSection={<IconSearch size="1rem" />}
    />
  );
}