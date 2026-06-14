import { profileApi } from '@/lib/api/profile';
import ProfileEditClient from './ProfileEditClient';

export default async function ProfileEditPage() {
  let initialProfile = null;
  let isCreating = false;
  try {
    initialProfile = await profileApi.getMyProfile();
  } catch (err: any) {
    if (err.response?.status === 404) {
      isCreating = true; // профиля нет – будем создавать
    }
  }
  return <ProfileEditClient initialProfile={initialProfile} isCreating={isCreating} />;
}