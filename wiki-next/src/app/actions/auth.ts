// app/actions/auth.ts
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(
  prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Заполните все поля' };
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.detail || 'Неверное имя пользователя или пароль' };
    }

    const data = await response.json();
    const setCookieHeader = response.headers.get('set-cookie');

    if (setCookieHeader) {
      const cookieStore = await cookies();
      const cookieNameValue = setCookieHeader.split(';')[0].split('=');
      cookieStore.set(cookieNameValue[0], cookieNameValue[1], {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, 
        path: '/',
      });
    }

    redirect('/'); 
  } catch (e) {
    return { error: 'Ошибка сети. Попробуйте позже.' };
  }
}

export async function register(
  prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const username = formData.get('username') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!username || !email || !password || !confirmPassword) {
    return { error: 'Заполните все поля' };
  }
  if (password !== confirmPassword) {
    return { error: 'Пароли не совпадают' };
  }
  if (password.length < 6) {
    return { error: 'Пароль должен быть не менее 6 символов' };
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.detail || 'Ошибка при регистрации' };
    }

    // Бэкенд тоже устанавливает куку при регистрации (согласно коду эндпоинта)
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      const cookieStore = await cookies();
      const cookieNameValue = setCookieHeader.split(';')[0].split('=');
      cookieStore.set(cookieNameValue[0], cookieNameValue[1], {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
    }

    redirect('/');
  } catch (e) {
    return { error: 'Ошибка сети. Попробуйте позже.' };
  }
}
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('access_token');
  redirect('/login');
}