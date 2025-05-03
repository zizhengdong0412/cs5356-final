import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSessionFromCookie } from '@/lib/session-helper';
import { and, eq, sql } from 'drizzle-orm';
import { binders, shared_binders } from '@/schema';
import CreateRecipeForm from './CreateRecipeForm';

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
    let binder;
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

    if (binderData.length > 0) {
      binder = binderData[0];
    } else {
      // Check shared_binders for edit/admin permission
      const shared = await db
        .select()
        .from(shared_binders)
        .where(sql`binder_id = ${binderId} AND shared_with_id = ${session.user.id} AND is_active = true AND (permission = 'edit' OR permission = 'admin')`)
        .limit(1);
      if (shared.length === 0) {
        redirect('/binders');
      }
      // Get the binder info for the title
      const binderInfo = await db
        .select()
        .from(binders)
        .where(eq(binders.id, binderId))
        .limit(1);
      if (binderInfo.length === 0) {
        redirect('/binders');
      }
      binder = binderInfo[0];
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Add New Recipe to "{binder.title}"</h1>
        <CreateRecipeForm binderId={binderId} binderTitle={binder.title} />
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