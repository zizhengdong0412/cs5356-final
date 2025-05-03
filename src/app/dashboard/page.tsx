import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionFromCookie } from '@/lib/session-helper';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import RecipeListClient from '@/components/RecipeListClient';

export default async function DashboardPage() {
  const session = await getSessionFromCookie();
  if (!session?.user) {
    redirect('/auth/sign-in');
  }

  // Get user's recipes (include user_id)
  const userRecipesData = await db.execute(sql`
    SELECT id, user_id, title, description, cooking_time, servings, thumbnail, created_at
    FROM recipes
    WHERE user_id = ${session.user.id}
    ORDER BY created_at DESC
  `);

  // Get recipes shared directly with the user (include user_id)
  const sharedRecipesData = await db.execute(sql`
    SELECT r.id, r.user_id, r.title, r.description, r.cooking_time, r.servings, r.thumbnail, r.created_at, sr.permission
    FROM shared_recipes sr
    JOIN recipes r ON sr.recipe_id = r.id
    WHERE sr.shared_with_id = ${session.user.id} AND sr.is_active = true
    ORDER BY r.created_at DESC
  `);

  // Separate owned and shared recipes, preferring owned if both exist
  const ownedRecipeIds = new Set(userRecipesData.map((r: any) => r.id));
  const sharedRecipesFiltered = sharedRecipesData.filter((r: any) => !ownedRecipeIds.has(r.id));

  const ownedRecipesWithMeta = userRecipesData.map((recipe: any) => ({
    ...recipe,
    canEdit: true,
    canDelete: true,
    ownership: 'owned',
  }));
  const sharedRecipesWithMeta = sharedRecipesFiltered.map((recipe: any) => ({
    ...recipe,
    canEdit: recipe.permission === 'edit' || recipe.permission === 'admin',
    canDelete: recipe.permission === 'admin',
    ownership: recipe.user_id === session.user.id ? 'owned' : 'shared',
  })).filter((r: any) => r.ownership === 'shared');

  // Check if the user has any binders
  const binderCount = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM binders
    WHERE user_id = ${session.user.id}
  `);
  const hasBinders = (binderCount[0] as { count: number })?.count > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/binders"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition inline-flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
            My Binders
          </Link>
          
          {hasBinders && (
            <Link
              href="/recipes/personal/new" 
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Recipe
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-6">My Recipes</h2>
        {ownedRecipesWithMeta.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-gray-500 mb-4">You haven't created any recipes yet.</div>
            {hasBinders ? (
              <Link
                href="/recipes/personal/new"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Create Your First Recipe
              </Link>
            ) : (
              <Link
                href="/binders/new"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                First Create a Binder
              </Link>
            )}
          </div>
        ) : (
          <RecipeListClient recipes={ownedRecipesWithMeta} badgeLabel="Owned by you" />
        )}
        
        {ownedRecipesWithMeta.length > 0 && (
          <div className="mt-6 text-center">
            <Link href="/recipes" className="text-blue-600 hover:underline">
              View All Recipes
            </Link>
          </div>
        )}
      </div>

      {sharedRecipesWithMeta.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Shared With Me</h2>
          <RecipeListClient recipes={sharedRecipesWithMeta} badgeLabel="Shared with you" />
        </div>
      )}
    </div>
  );
} 