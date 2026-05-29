// lib/api/client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options?: RequestInit & { params?: Record<string, string> }): Promise<T> {
  const isServer = typeof window === 'undefined';
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  // Прокидываем серверные куки (Next.js)
  if (isServer) {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  let url = `${API_URL}${endpoint}`;
  if (options?.params) {
    const searchParams = new URLSearchParams(options.params);
    url += `?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // для клиента – отправка кук автоматически
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorData.detail || `API error ${response.status}`);
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, string>) =>
    request<T>(endpoint, { method: 'GET', params }),
  post: <T>(endpoint: string, data?: unknown, params?: Record<string, string>) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(data), params }),
  put: <T>(endpoint: string, data?: unknown, params?: Record<string, string>) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data), params }),
  delete: <T>(endpoint: string, params?: Record<string, string>) =>
    request<T>(endpoint, { method: 'DELETE', params }),
};