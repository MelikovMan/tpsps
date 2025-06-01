import { AppShell, Group, NavLink, Text, Anchor, Box } from '@mantine/core';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { IconHome, IconArticle, IconCategory, IconUser, IconShield, IconSettings, type IconProps, type Icon } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo.tsx';
import UserMenu from '../components/UserMenu.tsx';
import { useEffect } from 'react';
import type { PermissionKey } from '../Routes/RoleBasedRoute';
export interface NavLinks {
  path: string;
  label: string;
  icon: React.ReactNode
  required?: PermissionKey[]
}
export default function MainPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, permissions } = useAuth();

  // Навигационные ссылки
  const navLinks: NavLinks[] = [
    { path: '/', label: 'Главная', icon: <IconHome size="1rem" /> },
    { path: '/articles', label: 'Статьи', icon: <IconArticle size="1rem" /> },
    { path: '/categories', label: 'Категории', icon: <IconCategory size="1rem" /> },
    { path: '/users', label: 'Пользователи', icon: <IconUser size="1rem" />, required: ['can_moderate'] },
    { path: '/moderation', label: 'Модерация', icon: <IconShield size="1rem" />, required: ['can_moderate'] },
    { path: '/admin', label: 'Администрирование', icon: <IconSettings size="1rem" />, required: ['can_delete'] },
  ];

  // Проверка активной ссылки
  const isActive = (path: string) => {
    return location.pathname === path || 
           (path !== '/' && location.pathname.startsWith(path));
  };

  // Редирект на главную при отсутствии аутентификации
  useEffect(() => {
    if (!isAuthenticated && location.pathname !== '/') {
      navigate('/');
    }
  }, [isAuthenticated, location, navigate]);

  return (
    <AppShell
      padding="md"
    >
    <AppShell.Header p="md">
          <Group justify="space-between">
            <Group>
              <Logo size={40} />
              <Text size="xl" fw={700} ml="sm">
                Вики-Система
              </Text>
            </Group>
            
            <Group>
              {isAuthenticated ? (
                <UserMenu user={user!} />
              ) : (
                <Group>
                  <Anchor component={Link} to="/login">
                    Войти
                  </Anchor>
                  <Anchor component={Link} to="/register">
                    Регистрация
                  </Anchor>
                </Group>
              )}
            </Group>
          </Group>
    </AppShell.Header>
            <AppShell.Navbar p="xs">
          <AppShell.Section grow mt="md">
            {navLinks.map((link) => {
              if (link.required){
                if (link.required.every(perm =>  permissions?.[perm]))
                    return null;
              }
                
              
              return (
                <NavLink
                  key={link.path}
                  component={Link}
                  to={link.path}
                  label={link.label}
                  active={isActive(link.path)}
                  variant="filled"
                  mb={5}
                />
              );
            })}
          </AppShell.Section>
          
          <AppShell.Section>
            {isAuthenticated && (
              <NavLink
                component={Link}
                to="/profile"
                label="Мой профиль"
                active={isActive('/profile')}
                variant="filled"
              />
            )}
          </AppShell.Section>
        </AppShell.Navbar>
      <Box p="md">
        <Outlet />
      </Box>
    </AppShell>
  );
}