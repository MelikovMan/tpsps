// app/login/page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/session';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  const session = await getServerSession();
  console.log(session)
  if (session?.user) {
    redirect('/');
  }

  return <LoginForm />;
}