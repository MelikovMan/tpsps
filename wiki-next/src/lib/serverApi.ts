import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function serverFetch<T>(
  url: string,
  options: { token?: string | null; params?: any } = {}
): Promise<T> {
  const headers: any = { 'Content-Type': 'application/json' };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  const { data } = await axios.get<T>(`${API_URL}${url}`, {
    headers,
    params: options.params,
  });
  return data;
}