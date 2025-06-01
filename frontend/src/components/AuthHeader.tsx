import { useAuth } from '../context/AuthContext';
import { Button, Group } from '@mantine/core';

export function Header() {
  const { user, permissions, logout, isAuthenticated } = useAuth();
  
  return (
    <Group justify="space-between" p="md">
      <div>Wiki App</div>
      
      {isAuthenticated ? (
        <Group>
          <span>Hello, {user?.username}</span>
          {permissions?.can_moderate && (
            <Button variant="light">Moderation Panel</Button>
          )}
          <Button onClick={logout}>Logout</Button>
        </Group>
      ) : (
        <Group>
          <Button component="a" href="/login">Login</Button>
          <Button variant="outline" component="a" href="/register">
            Register
          </Button>
        </Group>
      )}
    </Group>
  );
}