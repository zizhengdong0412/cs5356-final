import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSessionFromCookie } from '@/lib/session-helper';
import { and, eq } from 'drizzle-orm';
import { binders } from '@/schema';
import dynamic from 'next/dynamic';

// Dynamically import the RecipeForm component with no SSR
const RecipeForm = dynamic(() => import('./RecipeForm'), { ssr: false });

export default async function CreateRecipeInBinderPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  try {
    const session = await getSessionFromCookie();
    if (!session?.user) {
      redirect('/auth/sign-in');
    }

    const binderId = params.id;

    // Check if the binder exists and belongs to the user
    const binderData = await db
      .select()
      .from(binders)
      .where(
        and(
          eq(binders.id, binderId),
          eq(binders.user_id, session.user.id)
        )
      )
      .limit(1);

    if (binderData.length === 0) {
      redirect('/binders');
    }

    const binder = binderData[0];

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Add New Recipe to "{binder.title}"</h1>
        <RecipeForm binderId={binderId} binderTitle={binder.title} />
      </div>
    );
  } catch (error) {
    console.error('Error in Create Recipe page:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Error Loading Recipe Form</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>There was an error loading the recipe form. Please try again later.</p>
        </div>
      </div>
    );
  }
} 