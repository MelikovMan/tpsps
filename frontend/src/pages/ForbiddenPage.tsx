// src/pages/ForbiddenPage.tsx
import { Button, Container, Title, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ForbiddenPage() {
  const { user } = useAuth();
  
  return (
    <Container size="sm" py="xl">
      <Title order={1} ta="center" mb="md">403 - Доступ запрещен</Title>
      <Text size="lg" ta="center" mb="xl">
        {user 
          ? `У вас (${user.role}) недостаточно прав для просмотра этой страницы.`
          : 'Для доступа к этой странице необходимо войти в систему.'}
      </Text>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <Button component={Link} to="/" variant="outline" size="md">
          На главную
        </Button>
        {!user && (
          <Button component={Link} to="/login" size="md">
            Войти
          </Button>
        )}
      </div>
    </Container>
  );
}