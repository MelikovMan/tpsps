// components/MainLayout.tsx
'use client';

import { useState } from 'react';
import { AppShell, Group, NavLink as MantineNavLink, Text, Anchor, Box, Burger } from '@mantine/core';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  IconHome,
  IconArticle,
  IconCategory,
  IconUser,
  IconShield,
  IconSettings,
  IconPhoto,
} from '@tabler/icons-react';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/Logo';
import UserMenu from '@/components/UserMenu';
import { useDisclosure } from '@mantine/hooks';
import { AnimatePresence, motion } from 'framer-motion';
import type { PermissionKey } from '@/lib/api/types/types';

interface NavLinkItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  required?: PermissionKey[];
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, user, permissions } = useAuth();
  const [opened, { toggle }] = useDisclosure();

  const navLinks: NavLinkItem[] = [
    { path: '/', label: 'Главная', icon: <IconHome size="1rem" /> },
    { path: '/articles', label: 'Статьи', icon: <IconArticle size="1rem" /> },
    { path: '/categories', label: 'Категории', icon: <IconCategory size="1rem" /> },
    { path: '/users', label: 'Пользователи', icon: <IconUser size="1rem" />, required: ['can_moderate'] },
    { path: '/moderation', label: 'Модерация', icon: <IconShield size="1rem" />, required: ['can_moderate'] },
    { path: '/admin', label: 'Администрирование', icon: <IconSettings size="1rem" />, required: ['can_delete'] },
    { path: '/media/upload', label: 'Загрузка медиа', icon: <IconPhoto size="1rem" />, required: ['can_edit'] },
    { path: '/media', label: 'Медиа', icon: <IconPhoto size="1rem" />, required: ['can_edit'] },
  ];

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
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
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" aria-label="Toggle navigation" />
          <Group>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Logo size={40} />
            </motion.div>
            <Text size="xl" fw={700} ml="sm" ta="center">
              Вики-Система
            </Text>
          </Group>
          <Group>
            {isAuthenticated ? (
              <UserMenu user={user!} />
            ) : (
              <Group>
                <Anchor component={Link} href="/login">
                  Войти
                </Anchor>
                <Anchor component={Link} href="/register">
                  Регистрация
                </Anchor>
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
              if (!permissions || !link.required.every(perm => permissions[perm])) {
                return null;
              }
            }
            return (
              <MantineNavLink
                key={link.path}
                component={Link}
                href={link.path}
                label={link.label}
                leftSection={link.icon}
                active={isActive(link.path)}
                variant="filled"
                mb={5}
              />
            );
          })}
        </AppShell.Section>
        <AppShell.Section>
          {isAuthenticated && (
            <MantineNavLink
              component={Link}
              href="/profile"
              label="Мой профиль"
              active={isActive('/profile')}
              variant="filled"
            />
          )}
          {isAuthenticated && (
            <MantineNavLink
              component={Link}
              href="/articles/create"
              label="Создать страницу!"
              active={isActive('/articles/create')}
              variant="filled"
            />
          )}
        </AppShell.Section>
      </AppShell.Navbar>

      {/* Main content with page transition */}
      <AppShell.Main>
        <Box p="md">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </Box>
      </AppShell.Main>

      {/* Footer */}
      <AppShell.Footer p="md" withBorder>
        <Group justify="center">
          <Text size="sm" c="dimmed">
            © {new Date().getFullYear()} Вики-Система
          </Text>
          <Anchor component={Link} href="/about" size="sm">
            О проекте
          </Anchor>
          <Anchor component={Link} href="/help" size="sm">
            Помощь
          </Anchor>
          <Anchor component={Link} href="/contacts" size="sm">
            Контакты
          </Anchor>
          {isAuthenticated && user?.role === 'admin' && (
            <Anchor component={Link} href="/admin" size="sm">
              Админ-панель
            </Anchor>
          )}
        </Group>
      </AppShell.Footer>
    </AppShell>
  );
}