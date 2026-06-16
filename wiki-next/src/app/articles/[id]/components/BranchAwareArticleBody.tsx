// app/articles/[id]/components/BranchAwareArticleBody.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, Skeleton, Text, Group } from '@mantine/core';

interface BranchAwareArticleBodyProps {
  articleId: string;
  initialBranch: string;
  initialContent: string;
}

export default function BranchAwareArticleBody({
  articleId,
  initialBranch,
  initialContent,
}: BranchAwareArticleBodyProps) {
  const searchParams = useSearchParams();
  const currentBranch = searchParams.get('branch') || initialBranch;
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentBranch === initialBranch) {
      setContent(initialContent);
      return;
    }
    setLoading(true);
    fetch(`/api/articles/${articleId}?branch=${currentBranch}&with_content=true`)
      .then((res) => res.json())
      .then((data) => setContent(data.content))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [articleId, currentBranch, initialBranch, initialContent]);

  if (loading) return <Skeleton height={400} animate />;

  return (
    <>
      <Card withBorder p="xl" radius="md">
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </Card>
      {currentBranch !== 'main' && (
        <Card withBorder p="md" mt="md" bg="blue.0">
          <Group>
            <Text size="sm">
              Вы просматриваете содержимое ветки <strong>{currentBranch}</strong>
            </Text>
          </Group>
        </Card>
      )}
    </>
  );
}