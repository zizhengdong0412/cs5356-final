import { redirect } from 'next/navigation';
import { getSessionFromCookie } from '@/lib/session-helper';

export default async function CreateRecipePage() {
  const session = await getSessionFromCookie();
  if (!session?.user) {
    redirect('/auth/sign-in');
  }
  
  // In our new workflow, recipes must be created within binders
  redirect('/binders');
} 