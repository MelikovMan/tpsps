// app/articles/[id]/components/ArticleBody.tsx
import { Card, Group, Text } from '@mantine/core';

interface ArticleBodyProps {
  content: string;
  branchName: string;
}

export default function ArticleBody({ content, branchName }: ArticleBodyProps) {
  return (
    <>
      <Card withBorder p="xl" radius="md">
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </Card>
      {branchName !== 'main' && (
        <Card withBorder p="md" mt="md" bg="blue.0">
          <Group>
            <Text size="sm">
              Вы просматриваете содержимое ветки <strong>{branchName}</strong>
            </Text>
          </Group>
        </Card>
      )}
    </>
  );
}