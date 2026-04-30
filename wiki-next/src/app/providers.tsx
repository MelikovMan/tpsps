// app/layout.tsx
import { getServerSession } from '@/lib/session';
import { AuthProvider } from '@/context/AuthContext';
import MainLayout from '@/components/MainLayout';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  return (
    <html lang="ru">
      <body>
        <AuthProvider user={session?.user ?? null} permissions={session?.permissions ?? null}>
          <MainLayout>{children}</MainLayout>
        </AuthProvider>
      </body>
    </html>
  );
}