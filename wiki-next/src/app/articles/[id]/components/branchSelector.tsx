'use client';

import { Select } from '@mantine/core';
import { IconGitBranch } from '@tabler/icons-react';
import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

interface BranchSelectorProps {
  branches: { id: string; name: string }[];
  currentBranch: string;
  articleId: string;
}

export default function BranchSelector({ branches, currentBranch, articleId }: BranchSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleBranchChange = useCallback((value: string | null) => {
    const newBranch = value || 'main';
    const params = new URLSearchParams();
    if (newBranch !== 'main') params.set('branch', newBranch);
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ''}`);
  }, [router, pathname]);

  return (
    <Select
      placeholder="Выберите ветку"
      data={branches.map(b => ({ value: b.name, label: b.name }))}
      value={currentBranch}
      onChange={handleBranchChange}
      w={180}
      leftSection={<IconGitBranch size="1rem" />}
    />
  );
}