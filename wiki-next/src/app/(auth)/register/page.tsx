// app/register/page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/session';
import RegisterForm from './RegisterForm';

export default async function RegisterPage() {
  const session = await getServerSession();
  if (session?.user) {
    redirect('/');
  }

  return <RegisterForm />;
}