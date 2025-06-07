import { 
  Container, 
  Title, 
  Text, 
  Button, 
  Group, 
  Stack, 
  ThemeIcon,
  Center
} from '@mantine/core';
import { IconLockOff } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ForbiddenPage() {
  const { user } = useAuth();
  
  return (
    <Center h="100vh" bg="gray.0">
      <Container size="md" p="xl" bg="white" style={{ borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <Stack align="center" gap="xl">
          <ThemeIcon 
            size={72} 
            radius="50%" 
            variant="gradient"
            gradient={{ from: 'red.6', to: 'red.8', deg: 145 }}
          >
            <IconLockOff size={48} />
          </ThemeIcon>
          
          <Title order={1} ta="center">
            Доступ запрещен
          </Title>
          
          <Text size="xl" ta="center" color="dimmed" maw={500}>
            {user 
              ? `Ваша роль (${user.role}) не имеет достаточно прав для просмотра этой страницы`
              : 'Для доступа требуется авторизация'}
          </Text>

          <Group mt="md">
            <Button 
              component={Link} 
              to="/"
              variant="light"
              size="md"
              color="gray.7"
            >
              На главную
            </Button>
            
            {!user && (
              <Button 
                component={Link} 
                to="/login"
                size="md"
                variant="gradient"
                gradient={{ from: 'indigo.5', to: 'cyan.5' }}
              >
                Войти в систему
              </Button>
            )}
          </Group>
        </Stack>
      </Container>
    </Center>
  );
}
