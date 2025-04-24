import { redirect } from 'next/navigation';
import { getSessionFromCookie } from '@/lib/session-helper';
import HomePageClient from '@/app/components/HomePageClient';

export default async function Home() {
  // Check if user is authenticated
  try {
    const session = await getSessionFromCookie();
    if (session?.user) {
      // Redirect to binders page if user is authenticated
      redirect('/binders');
    }
  } catch (error) {
    console.error('Error checking session:', error);
    // Continue to render the home page if there's an error
  }

  // If not authenticated, render the home page client component with animations
  return <HomePageClient />;
}