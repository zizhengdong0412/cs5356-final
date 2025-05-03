import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSessionFromCookie } from '@/lib/session-helper';
import { eq } from 'drizzle-orm';
import { recipes, binders } from '@/schema';
import { sql } from 'drizzle-orm';
import RecipeCard from '@/components/RecipeCard';
import RecipeListClient from '@/components/RecipeListClient';

export default async function RecipesPage() {
  const session = await getSessionFromCookie();
  if (!session?.user) {
    redirect('/auth/sign-in');
  }

  // Check if the user has any binders
  const userBinders = await db
    .select()
    .from(binders)
    .where(eq(binders.user_id, session.user.id))
    .limit(1);

  const hasBinders = userBinders.length > 0;

  // Get all recipes for the current user
  const userRecipesData = await db
    .select()
    .from(recipes)
    .where(eq(recipes.user_id, session.user.id))
    .orderBy(recipes.created_at);

  // Compute canEdit and canDelete for each recipe
  const recipesWithPermissions = userRecipesData.map((recipe: any) => ({
    ...recipe,
    canEdit: true,
    canDelete: true,
  }));

  // Get recipes shared with the current user
  const sharedResults = await db.execute(sql`
    SELECT r.id, r.title, r.description, r.cooking_time, r.servings, r.thumbnail, r.created_at, sr.permission
    FROM shared_recipes sr
    JOIN recipes r ON sr.recipe_id = r.id
    WHERE sr.shared_with_id = ${session.user.id} AND sr.is_active = true
    ORDER BY r.created_at DESC
  `);

  const sharedRecipes = sharedResults as any[];

  return <RecipesPageClient userRecipes={recipesWithPermissions} hasBinders={hasBinders} sharedRecipes={sharedRecipes} />;
}

function RecipesPageClient({ userRecipes, hasBinders, sharedRecipes }: { userRecipes: any[]; hasBinders: boolean; sharedRecipes: any[] }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">All My Recipes</h1>
        {hasBinders ? (
          <div className="text-gray-600">
            To create a new recipe, select a binder from the <Link href="/binders" className="text-green-600 hover:underline">My Recipe Binders</Link> page.
          </div>
        ) : (
          <Link 
            href="/binders/new" 
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Your First Binder
          </Link>
        )}
      </div>

      {!hasBinders && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You need to create a binder first before you can add recipes. Recipe Binders help you organize your recipes into collections.
              </p>
            </div>
          </div>
        </div>
      )}

      {userRecipes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl font-medium mb-2">You don't have any recipes yet</h2>
          <p className="text-gray-500 mb-4">
            {hasBinders 
              ? "Select a binder to create your first recipe."
              : "Create a binder first, then you can add recipes to it."}
          </p>
          <Link 
            href={hasBinders ? "/binders" : "/binders/new"} 
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            {hasBinders ? "Go to My Binders" : "Create Your First Binder"}
          </Link>
        </div>
      ) : (
        <RecipeListClient recipes={userRecipes} />
      )}

      {/* Shared With Me */}
      {sharedRecipes.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Shared With Me</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sharedRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={{
                  id: recipe.id,
                  title: recipe.title,
                  description: recipe.description,
                  cookingTime: recipe.cooking_time,
                  servings: recipe.servings,
                  thumbnail: recipe.thumbnail,
                  createdAt: recipe.created_at
                }}
                canEdit={recipe.permission === 'edit' || recipe.permission === 'admin'}
                canDelete={recipe.permission === 'admin'}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 