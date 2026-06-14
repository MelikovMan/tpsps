import { usersApi } from '@/lib/api/users';
import UserListClient from './UserListClient';

export default async function UsersPage() {
  // Предзагружаем первую страницу (поиск пустой, роль не задана)
  const initialData = await usersApi.search({ skip: 0, limit: 10 });
  return <UserListClient initialData={initialData} />;
}