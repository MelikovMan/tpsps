// app/articles/loading.tsx
import { Skeleton, Stack, Container } from '@mantine/core';

export default function ArticlesLoading() {
  return (
    <Container size="lg" py="xl">
      <Skeleton height={40} width="50%" mb="xl" />
      <Skeleton height={36} mb="md" />
      <Skeleton height={36} mb="xl" width="30%" />
      <Stack>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} height={120} radius="md" />
        ))}
      </Stack>
    </Container>
  );
}