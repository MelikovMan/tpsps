import { Menu, Avatar, Group, Text } from '@mantine/core';
import { IconLogout, IconUser, IconSettings } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface UserMenuProps {
  user: {
    username: string;
    email: string;
    role: string;
  };
}

export default function UserMenu({ user }: UserMenuProps) {
  const { logout } = useAuth();
  
  return (
    <Menu shadow="md" width={200} position="bottom-end">
      <Menu.Target>
        <Group gap={7} style={{ cursor: 'pointer' }}>
          <Avatar 
            radius="xl" 
            size="md" 
            color="blue"
            alt={user.username}
          >
            {user.username.charAt(0).toUpperCase()}
          </Avatar>
          <Text fw={500} size="sm">
            {user.username}
          </Text>
        </Group>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>
          <Text size="xs" c="dimmed">{user.email}</Text>
          <Text size="sm">Роль: {user.role}</Text>
        </Menu.Label>
        
        <Menu.Divider />
        
        <Menu.Item 
          leftSection={<IconUser size={14} />} 
          component={Link}
          to="/profile"
        >
          Профиль
        </Menu.Item>
        
        <Menu.Item 
          leftSection={<IconSettings size={14} />} 
          component={Link}
          to="/profile/edit"
        >
          Настройки
        </Menu.Item>
        
        <Menu.Divider />
        
        <Menu.Item 
          leftSection={<IconLogout size={14} />} 
          c="red"
          onClick={logout}
        >
          Выйти
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}