// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import '@mantine/core/styles.css';
import '@mantine/carousel/styles.css';
import '@mantine/tiptap/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/core/styles.css'; // 👈 обязательный импорт стилей Mantine
import './globals-anim.css';

import { ColorSchemeScript, MantineProvider, Skeleton, mantineHtmlProps } from '@mantine/core';

export const metadata = {
  title: 'Вики система',
  description: 'Вариант с использованием SSR',
};


import { Notifications } from '@mantine/notifications';
import MainLayout from '@/components/MainLayout';
import { getServerSession } from '@/lib/session';
import { AuthProvider } from '@/context/AuthContext';
import { Suspense } from 'react';
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  return (
    <html lang="en" {...mantineHtmlProps}>

      <body>
        <MantineProvider>
          <Notifications/>
          <AuthProvider user={session?.user ?? null} permissions={session?.permissions ?? null}>
           <Suspense fallback={<Skeleton height="100vh" animate />}>
            <MainLayout>
              {children} 
            </MainLayout>
            </Suspense>
          </AuthProvider>
        </MantineProvider>
      </body>
    </html>
  );
}