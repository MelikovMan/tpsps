import { Button, Container, Title, Text } from '@mantine/core';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <Container size="sm" py="xl">
      <Title order={1} ta="center" mb="md">404 - Страница не найдена</Title>
      <Text size="lg" ta="center" mb="xl">
        Извините, запрашиваемая страница не существует.
      </Text>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Button component={Link} to="/" size="md">
          Вернуться на главную
        </Button>
      </div>
    </Container>
  );
}