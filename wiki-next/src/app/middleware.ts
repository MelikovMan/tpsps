// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose'; // Используйте 'jose' для верификации на Edge

const protectedPaths = [
  '/articles/create', '/articles/new', '/profile/edit', '/admin', '/moderation', '/users',
  '/media', '/media/upload'
];

const permissionPaths: Record<string, string[]> = {
  '/admin': ['can_delete'],
  '/moderation': ['can_moderate'],
  '/users': ['can_moderate'],
  '/media/upload': ['can_edit'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;

  if (protectedPaths.some(path => pathname.startsWith(path))) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
      const { payload } = await jwtVerify(token, secret);
      const userRole = payload.role as string;

      for (const [pathPattern, requiredPermissions] of Object.entries(permissionPaths)) {
        if (pathname.startsWith(pathPattern)) {
          const userPermissions = await fetchUserPermissions(token, request);
          
          const hasPermission = requiredPermissions.every(perm => userPermissions[perm]);
          if (!hasPermission) {
            return NextResponse.redirect(new URL('/forbidden', request.url));
          }
        }
      }
      
      return NextResponse.next();
    } catch (error) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('access_token');
      return response;
    }
  }

  return NextResponse.next();
}

async function fetchUserPermissions(token: string, request: NextRequest): Promise<Record<string, boolean>> {
  try {
    const res = await fetch(`${process.env.API_URL}/users/me/permissions`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        Cookie: request.headers.get('cookie') || ''
      },
    });
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|register).*)'],
};