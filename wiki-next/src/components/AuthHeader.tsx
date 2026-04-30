'use client';

import { Button, Group } from '@mantine/core';
import { useAuth } from '@/context/AuthContext';
import { logout } from '@/app/actions/auth';
import Link from 'next/link';

export function Header() {
  const { user, permissions, isAuthenticated } = useAuth();

  return (
    <Group justify="space-between" p="md">
      <div>Wiki App</div>
      {isAuthenticated ? (
        <Group>
          <span>Привет, {user?.username}</span>
          {permissions?.can_moderate && (
            <Button component={Link} href="/moderation" variant="light">Модерация</Button>
          )}
          <Button onClick={() => logout()}>Выйти</Button>
        </Group>
      ) : (
        <Group>
          <Button component={Link} href="/login">Войти</Button>
          <Button variant="outline" component={Link} href="/register">Регистрация</Button>
        </Group>
      )}
    </Group>
  );
}