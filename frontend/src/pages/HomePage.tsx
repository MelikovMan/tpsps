import { AppShell, Group, NavLink, Text, Anchor, Box, Burger } from '@mantine/core';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { IconHome, IconArticle, IconCategory, IconUser, IconShield, IconSettings, IconPhoto } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo.tsx';
import UserMenu from '../components/UserMenu.tsx';
import type { PermissionKey } from '../Routes/RoleBasedRoute';
import { useDisclosure } from '@mantine/hooks';
import PageTransition from '../components/PageTransition.tsx';
import { AnimatePresence, motion } from 'framer-motion';
import { ColorSchemeToggle } from '../ColorSchemeToggle/ColorSchemeToggle.tsx';
export interface NavLinks {
  path: string;
  label: string;
  icon: React.ReactNode
  required?: PermissionKey[]
}
export default function MainPage() {
  const location = useLocation();
  const { isAuthenticated, user, permissions } = useAuth();
  const [opened, { toggle }] = useDisclosure();

  // Навигационные ссылки
  const navLinks: NavLinks[] = [
    { path: '/', label: 'Главная', icon: <IconHome size="1rem" /> },
    { path: '/articles', label: 'Статьи', icon: <IconArticle size="1rem" /> },
    { path: '/categories', label: 'Категории', icon: <IconCategory size="1rem" /> },
    { path: '/users', label: 'Пользователи', icon: <IconUser size="1rem" />, required: ['can_moderate'] },
    { path: '/moderation', label: 'Модерация', icon: <IconShield size="1rem" />, required: ['can_moderate'] },
    { path: '/admin', label: 'Администрирование', icon: <IconSettings size="1rem" />, required: ['can_delete'] },
    { path: '/media/upload', label: 'Загрузка медиа', icon: <IconPhoto size="1rem" />, required: ['can_edit']},
  ];

  // Проверка активной ссылки
  const isActive = (path: string) => {
    return location.pathname === path || 
           (path !== '/' && location.pathname.startsWith(path));
  };

  return (
    <AppShell
      padding="md"
      header={{ height: 60 }}
      navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !opened } }}
    >
    <AppShell.Header p="sm">
          
          <Group justify="space-between">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" aria-label="Toggle navigation"/>
            <Group>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Logo size={40} />
            </motion.div>
              <Text size="xl" fw={700} ml="sm" ta="center">
                Вики-Система
              </Text>
            </Group>
            
            <Group>
              <ColorSchemeToggle/>
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
                if (!permissions || !link.required.every(perm =>  permissions?.[perm]))
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
            {isAuthenticated && (
              <NavLink
                component={Link}
                to="/articles/create"
                label="Создать страницу!"
                active={isActive('/articles/create')}
                variant="filled"
              />
            )}
          </AppShell.Section>
        </AppShell.Navbar>
      <AppShell.Main>
      <Box p="md">
        <AnimatePresence mode="wait" >
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
        </AnimatePresence>
      </Box>
      </AppShell.Main>
       <AppShell.Footer p="md" withBorder>
          <Group justify='center'>
            <Text size="sm" c="dimmed">
              © {new Date().getFullYear()} Вики-Система
            </Text>
            <Anchor component={Link} to="/about" size="sm">
              О проекте
            </Anchor>
            <Anchor component={Link} to="/help" size="sm">
              Помощь
            </Anchor>
            <Anchor component={Link} to="/contacts" size="sm">
              Контакты
            </Anchor>
            {isAuthenticated && user?.role === 'admin' && (
              <Anchor component={Link} to="/admin" size="sm">
                Админ-панель
              </Anchor>
            )}
          </Group>
      </AppShell.Footer>
    </AppShell>
  );
}