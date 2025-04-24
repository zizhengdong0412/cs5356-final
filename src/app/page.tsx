import { redirect } from 'next/navigation';
import { getSessionFromCookie } from '@/lib/session-helper';
import HomePageClient from '@/app/components/HomePageClient';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export default async function Home() {
  // Check if user is authenticated
  try {
    const session = await getSessionFromCookie();
    if (session?.user) {
      // Check if the user has any binders
      const binderCount = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM binders
        WHERE user_id = ${session.user.id}
      `);
      const hasBinders = (binderCount[0] as { count: number })?.count > 0;

      if (hasBinders) {
        // Redirect to dashboard if user is authenticated and has binders
        redirect('/dashboard');
      } else {
        // Redirect to create binder page if user is authenticated but has no binders
        redirect('/binders/new');
      }
    }
  } catch (error) {
    console.error('Error checking session:', error);
    // Continue to render the home page if there's an error
  }

  // If not authenticated, render the home page client component with animations
  return <HomePageClient />;
}