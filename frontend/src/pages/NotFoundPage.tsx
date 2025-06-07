import { 
  Container, 
  Title, 
  Text, 
  Button, 
  Stack, 
  Center,
  ThemeIcon
} from '@mantine/core';
import { IconMapOff } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <Center h="100vh" bg="gray.0">
      <Container size="md" p="xl" bg="white" style={{ borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <Stack align="center" gap="xl">
          <ThemeIcon 
            size={72} 
            radius="50%" 
            variant="gradient"
            gradient={{ from: 'blue.6', to: 'cyan.5', deg: 145 }}
          >
            <IconMapOff size={48} />
          </ThemeIcon>
          
          <Title order={1} ta="center">
            Страница не найдена
          </Title>
          
          <Text size="xl" ta="center" color="dimmed" maw={500}>
            Запрашиваемая страница не существует или была перемещена
          </Text>

          <Button 
            component={Link} 
            to="/"
            size="md"
            mt="xl"
            variant="gradient"
            gradient={{ from: 'teal.5', to: 'blue.6' }}
          >
            Вернуться на главную
          </Button>
        </Stack>
      </Container>
    </Center>
  );
}
