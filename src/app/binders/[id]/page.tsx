import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getSessionFromCookie } from '@/lib/session-helper';
import { sql } from 'drizzle-orm';
import BinderActions from './BinderActions';
import Image from 'next/image';
import RecipeCard from '@/components/RecipeCard';
import RecipeListClient from '@/components/RecipeListClient';

export default async function BinderDetailPage({ params }: { params: { id: string } }) {
  const session = await getSessionFromCookie();
  if (!session?.user) {
    redirect('/auth/sign-in');
  }

  const binderId = params.id;

  // Try to get the binder as owner
  let binderResults = await db.execute(sql`
    SELECT id, user_id, title, created_at, updated_at
    FROM binders
    WHERE id = ${binderId} AND user_id = ${session.user.id}
    LIMIT 1
  `);

  let isOwner = binderResults.length > 0;
  let binder = binderResults[0] as any;

  // If not owner, check if shared with user
  if (!isOwner) {
    const sharedResults = await db.execute(sql`
      SELECT b.id, b.user_id, b.title, b.created_at, b.updated_at, sb.permission
      FROM shared_binders sb
      JOIN binders b ON sb.binder_id = b.id
      WHERE b.id = ${binderId} AND sb.shared_with_id = ${session.user.id} AND sb.is_active = true
      LIMIT 1
    `);
    if (sharedResults.length === 0) {
      redirect('/binders');
    }
    binder = sharedResults[0] as any;
    isOwner = false;
    // Add sharedPermission to binder
    binder.sharedPermission = sharedResults[0].permission;
  }

  // Get recipes in this binder
  const recipesInBinderData = await db.execute(sql`
    SELECT r.id, r.title, r.description, r.cooking_time, r.servings, r.thumbnail, r.created_at
    FROM recipes r
    JOIN binder_recipes br ON br.recipe_id = r.id
    WHERE br.binder_id = ${binderId}
    ORDER BY br.added_at DESC
  `);

  // Compute canEdit and canDelete for each recipe
  const recipesWithPermissions = recipesInBinderData.map((recipe: any) => ({
    ...recipe,
    canEdit: isOwner || (binder.sharedPermission === 'edit' || binder.sharedPermission === 'admin'),
    canDelete: isOwner || binder.sharedPermission === 'admin',
  }));

  // Determine if user can edit (owner or sharedPermission is edit/admin)
  const canEdit = isOwner || (binder.sharedPermission === 'edit' || binder.sharedPermission === 'admin');

  return <BinderDetailPageClient
    binder={binder}
    isOwner={isOwner}
    canEdit={canEdit}
    recipesInBinder={recipesWithPermissions}
    binderId={binderId}
  />;
}

function BinderDetailPageClient({ binder, isOwner, canEdit, recipesInBinder, binderId }: any) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">{binder.title}</h1>
          {/* Description removed as it doesn't exist in the database */}
        </div>
        {isOwner && (
          <BinderActions binder={{
            id: binder.id,
            title: binder.title,
            user_id: binder.user_id,
            created_at: binder.created_at,
            updated_at: binder.updated_at,
          }} />
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recipes in this Binder</h2>
          {canEdit && (
            <div className="flex space-x-3">
              <Link
                href={`/binders/${binderId}/create-recipe`}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Create New Recipe
              </Link>
              <Link
                href={`/binders/${binderId}/add-existing-recipes`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Add Existing Recipes
              </Link>
            </div>
          )}
        </div>

        {recipesInBinder.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No recipes yet</h3>
            <p className="text-gray-500 mb-4">
              Add or create some recipes in your binder to get started.
            </p>
            {canEdit && (
              <div className="flex justify-center space-x-4">
                <Link
                  href={`/binders/${binderId}/create-recipe`}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  Create New Recipe
                </Link>
                <Link
                  href={`/binders/${binderId}/add-existing-recipes`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Add Existing Recipes
                </Link>
              </div>
            )}
          </div>
        ) : (
          <RecipeListClient recipes={recipesInBinder} />
        )}
      </div>

      {canEdit && (
        <Link
          href={`/binders/${binderId}/create-recipe`}
          className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors"
          aria-label="Create Recipe"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Link>
      )}
    </div>
  );
} 