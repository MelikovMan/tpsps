// components/MainLayout.tsx
'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  AppShell,
  Group,
  NavLink as MantineNavLink,
  Text,
  Anchor,
  Box,
  Burger,
  useMantineColorScheme,            // добавлен
  useComputedColorScheme,
  Switch,  
} from '@mantine/core';
import {
  IconHome,
  IconArticle,
  IconCategory,
  IconUser,
  IconShield,
  IconSettings,
  IconPhoto,
  IconSun,                          // добавлен
  IconMoon,
} from '@tabler/icons-react';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/Logo';
import UserMenu from '@/components/UserMenu';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { AnimatePresence, motion } from 'framer-motion';
import type { PermissionKey } from '@/lib/api/types/types';
import Link from 'next/link';
import getAnimationKey from './PathnameKeys';
import { ThemeSwitch } from './ThemeSwitcher';
interface NavLinkItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  required?: PermissionKey[];
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useMediaQuery('(max-width: 48em)');
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, permissions } = useAuth();
  const [opened, { toggle }] = useDisclosure();
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');
  const toggleColorScheme = () => {
    setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light');
  };
  const navLinks: NavLinkItem[] = [
    { path: '/', label: 'Главная', icon: <IconHome size="1rem" /> },
    { path: '/articles', label: 'Статьи', icon: <IconArticle size="1rem" /> },
    { path: '/categories', label: 'Категории', icon: <IconCategory size="1rem" /> },
    {
      path: '/users',
      label: 'Пользователи',
      icon: <IconUser size="1rem" />,
      required: ['can_moderate'],
    },
    {
      path: '/moderation',
      label: 'Модерация',
      icon: <IconShield size="1rem" />,
      required: ['can_moderate'],
    },
    {
      path: '/admin',
      label: 'Администрирование',
      icon: <IconSettings size="1rem" />,
      required: ['can_delete'],
    },
    {
      path: '/media/upload',
      label: 'Загрузка медиа',
      icon: <IconPhoto size="1rem" />,
      required: ['can_edit'],
    },
    {
      path: '/media',
      label: 'Медиа',
      icon: <IconPhoto size="1rem" />,
      required: ['can_edit'],
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  // Функция для навигации без передачи компонента
  const navigate = (path: string) => (e?: React.MouseEvent) => {
    e?.preventDefault();
    router.push(path);
    // Закрываем бургер-меню на мобильных устройствах после клика
    if (opened) toggle();
  };

  return (
    <AppShell
      padding="md"
      header={{ height: 60 }}
      navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !opened } }}
    >
      {/* Header */}
      <AppShell.Header p="sm">
        <Group justify="space-between">
          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="sm"
            size="sm"
            aria-label="Toggle navigation"
          />
          <Group gap="xs" wrap="nowrap">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Logo size={isMobile ? 0 : 40} />
            </motion.div>
            <Text size={isMobile ? "md" : "xl"}
            fw={700} 
            ml="sm" 
            ta="center"
            >
              Вики-Система
            </Text>
          </Group>
          <Group>
          {/*<Switch
              size="md"
              color="dark.4"
              onLabel={<IconSun size={16} stroke={2.5} color="yellow" />}
              offLabel={<IconMoon size={16} stroke={2.5} color="cyan" />}
              checked={computedColorScheme === 'dark'}
              onChange={toggleColorScheme}
            />
          */}
          {<ThemeSwitch/>
          }
            {isAuthenticated ? (
              <UserMenu user={user!} />
            ) : (
              <Group>
                <Anchor onClick={navigate('/login')}>Войти</Anchor>
                <Anchor onClick={navigate('/register')}>Регистрация</Anchor>
              </Group>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      {/* Navbar */}
      <AppShell.Navbar p="xs">
        <AppShell.Section grow mt="md">
          {navLinks.map((link) => {
            if (link.required) {
              if (!permissions || !link.required.every((perm) => permissions[perm])) {
                return null;
              }
            }
            return (
              <MantineNavLink
                key={link.path}
                label={link.label}
                leftSection={link.icon}
                active={isActive(link.path)}
                variant="filled"
                mb={5}
                component={Link}
                href={link.path}
              />
            );
          })}
        </AppShell.Section>
        <AppShell.Section>
          {isAuthenticated && (
            <MantineNavLink
              label="Мой профиль"
              active={isActive('/profile')}
              variant="filled"
              onClick={navigate('/profile')}
            />
          )}
          {isAuthenticated && (
            <MantineNavLink
              label="Создать страницу!"
              active={isActive('/articles/create')}
              variant="filled"
              onClick={navigate('/articles/create')}
            />
          )}
        </AppShell.Section>
      </AppShell.Navbar>

      {/* Main content with page transition */}
      <AppShell.Main>
        <Box p="md">
          <motion.div
              key={getAnimationKey(pathname)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {children}
          </motion.div>
        </Box>
      </AppShell.Main>

      {/* Footer */}
      <AppShell.Footer p="md" withBorder>
        <Group justify="center">
          <Text size="sm" c="dimmed">
            © {new Date().getFullYear()} Вики-Система
          </Text>
          <Anchor onClick={navigate('/about')} size="sm">
            О проекте
          </Anchor>
          <Anchor onClick={navigate('/help')} size="sm">
            Помощь
          </Anchor>
          <Anchor onClick={navigate('/contacts')} size="sm">
            Контакты
          </Anchor>
          {isAuthenticated && user?.role === 'admin' && (
            <Anchor onClick={navigate('/admin')} size="sm">
              Админ-панель
            </Anchor>
          )}
        </Group>
      </AppShell.Footer>
    </AppShell>
  );
}