import { redirect } from 'next/navigation';
import { getSessionFromCookie } from '@/lib/session-helper';
import CreateBinderForm from './CreateBinderForm';

export default async function NewBinderPage() {
  const session = await getSessionFromCookie();
  if (!session?.user) {
    redirect('/auth/sign-in');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Recipe Binder</h1>
      <CreateBinderForm />
    </div>
  );
} 