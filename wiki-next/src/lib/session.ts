// lib/session.ts
import { cookies } from 'next/headers';
import { cache } from 'react';
import { logout } from '@/app/actions/auth';
import { UserResponse } from './api/types/types';
import { PermissionResponse } from './api/types/types';

// Функция для получения данных пользователя с бэкенда
async function fetchUserFromBackend(token: string): Promise<{ user: UserResponse; permissions: PermissionResponse } | null> {
  try {
    const [userRes, permsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/permissions`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      }),
    ]);

    if (!userRes.ok || !permsRes.ok) {
      if (userRes.status === 401 || permsRes.status === 401) {


      }
      if (!userRes.ok) console.warn(await userRes.text())
      if (!permsRes.ok) console.warn(await permsRes.text())
      return null;
    }

    const user = await userRes.json();
    const permissions = await permsRes.json();

    return { user, permissions };
  } catch (error) {
    console.error('Failed to fetch user from backend:', error);
    return null;
  }
}

// `cache` гарантирует, что в рамках одного запроса эта функция выполнится только один раз.
export const getServerSession = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) return null;

  const userData = await fetchUserFromBackend(token);
  return userData;
};