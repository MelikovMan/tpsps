import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = [
  '/articles/create', '/articles/new', '/profile/edit', '/admin', '/moderation', '/users',
  '/media', '/media/upload'
];

// Маппинг путей на необходимые разрешения (опционально)
const permissionRequirements: Record<string, string[]> = {
  '/admin': ['can_delete'],
  '/moderation': ['can_moderate'],
  '/users': ['can_moderate'],
  '/media/upload': ['can_edit'],
};

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Проверяем, защищён ли путь
  const isProtected = protectedPaths.some(path => pathname.startsWith(path));
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get('access_token')?.value;
  if (!token) return redirectToLogin(request);

  // Базовый URL API – используйте ту же переменную, что и везде
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  try {
    // Проверяем валидность токена через бэкенд
    const userRes = await fetch(`${apiUrl}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!userRes.ok) {
      // Токен невалидный – удаляем куку и редиректим на логин
      const response = redirectToLogin(request);
      response.cookies.delete('access_token');
      return response;
    }

    // Если для текущего пути требуются определённые разрешения – проверяем их
    for (const [pathPattern, requiredPerms] of Object.entries(permissionRequirements)) {
      if (pathname.startsWith(pathPattern)) {
        const permsRes = await fetch(`${apiUrl}/users/me/permissions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!permsRes.ok) {
          return NextResponse.redirect(new URL('/forbidden', request.url));
        }
        const permissions = await permsRes.json();
        const hasAll = requiredPerms.every(perm => permissions[perm] === true);
        if (!hasAll) {
          return NextResponse.redirect(new URL('/forbidden', request.url));
        }
        break; // достаточно одного совпадения
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    const response = redirectToLogin(request);
    response.cookies.delete('access_token');
    return response;
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|register).*)'],
};