// components/BackButton.tsx
'use client';
import { Button } from '@mantine/core';
import { IconArrowBack } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();
  return (
    <Button onClick={() => router.back()} leftSection={<IconArrowBack size={18} />} variant="light" size="md">
      Вернуться назад
    </Button>
  );
}