import { profileApi } from '@/lib/api/profile';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
  // Попробуем получить профиль на сервере (если пользователь авторизован)
  // В реальном проекте здесь нужно проверить сессию, но для простоты
  // сделаем попытку запроса, при ошибке 404 передадим null
  let initialProfile = null;
  let errorStatus = null;
  try {
    initialProfile = await profileApi.getMyProfile();
  } catch (err: any) {
    errorStatus = err.response?.status;
    // 404 – профиль не создан, остальные ошибки передадим в клиент
    if (errorStatus !== 404) {
      console.error('Failed to fetch profile:', err);
    }
  }
  return <ProfileClient initialProfile={initialProfile} errorStatus={errorStatus} />;

}
export const dynamic = 'force-dynamic';