import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSessionFromCookie } from '@/lib/session-helper';
import { and, eq, notInArray } from 'drizzle-orm';
import { binders, binder_recipes, recipes } from '@/schema';
import AddRecipeForm from './AddRecipeForm';

export default async function AddRecipesToBinderPage({ 
  params 
}: { 
  params: { id: string } 
}) {
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

  // Get recipes already in this binder
  const existingRecipeIds = await db
    .select({ id: binder_recipes.recipe_id })
    .from(binder_recipes)
    .where(eq(binder_recipes.binder_id, binderId));
  
  const recipeIdsInBinder = existingRecipeIds.map(r => r.id);

  // Get user's recipes that are not already in this binder
  const availableRecipes = await db
    .select()
    .from(recipes)
    .where(
      and(
        eq(recipes.user_id, session.user.id),
        recipeIdsInBinder.length > 0 
          ? notInArray(recipes.id, recipeIdsInBinder) 
          : undefined
      )
    )
    .orderBy(recipes.title);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Add Recipes to "{binder.title}"</h1>
      
      {availableRecipes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl font-medium mb-2">No more recipes to add</h2>
          <p className="text-gray-500 mb-4">
            You've added all your recipes to this binder. Create new recipes to add more.
          </p>
          <div className="flex justify-center space-x-4">
            <a 
              href={`/binders/${binderId}`}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Back to Binder
            </a>
            <a 
              href="/recipes/personal/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Create New Recipe
            </a>
          </div>
        </div>
      ) : (
        <AddRecipeForm binder={binder} availableRecipes={availableRecipes} />
      )}
    </div>
  );
} 