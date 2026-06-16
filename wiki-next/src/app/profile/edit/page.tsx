// app/profile/edit/page.tsx
import { Suspense } from 'react';
import { Skeleton } from '@mantine/core';
import { profileApi } from '@/lib/api/profile';
import ProfileEditClient from './ProfileEditClient';

export default async function ProfileEditPage() {
  let initialProfile = null;
  let isCreating = false;
  try {
    initialProfile = await profileApi.getMyProfile();
  } catch (err: any) {
    if (err.response?.status === 404) {
      isCreating = true;
    }
  }

  return (
    <Suspense fallback={<Skeleton height={400} animate />}>
      <ProfileEditClient initialProfile={initialProfile} isCreating={isCreating} />
    </Suspense>
  );
}