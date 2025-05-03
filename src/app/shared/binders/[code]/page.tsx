import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { and, eq } from 'drizzle-orm';
import { binders, binder_recipes, recipes, shared_binders } from '@/schema';

export default async function SharedBinderPage({ params }: { params: { code: string } }) {
  const shareCode = params.code;

  // Find the share record
  const shareRecord = await db
    .select({
      share: shared_binders,
      binder: binders
    })
    .from(shared_binders)
    .innerJoin(binders, eq(shared_binders.binder_id, binders.id))
    .where(
      and(
        eq(shared_binders.share_code, shareCode),
        eq(shared_binders.is_active, true)
      )
    )
    .limit(1);

  if (shareRecord.length === 0) {
    redirect('/');
  }

  const { share, binder } = shareRecord[0];

  // Get recipes in this binder
  const binderRecipes = await db
    .select({
      recipe: recipes
    })
    .from(binder_recipes)
    .innerJoin(recipes, eq(binder_recipes.recipe_id, recipes.id))
    .where(eq(binder_recipes.binder_id, binder.id));

  const recipesInBinder = binderRecipes.map(br => br.recipe);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-blue-50 rounded-lg p-4 mb-8 text-center">
        <p className="text-blue-800">
          You're viewing a shared recipe binder. 
          {share.permission === 'view' ? ' You have view-only access.' : ''}
          {share.permission === 'edit' ? ' You have edit access to this binder.' : ''}
        </p>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{binder.title}</h1>
        {binder.description && (
          <p className="text-gray-600 mt-2">{binder.description}</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Recipes in this Binder</h2>

        {recipesInBinder.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No recipes in this binder</h3>
            <p className="text-gray-500">This binder is empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipesInBinder.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/shared/recipes/${recipe.id}`}
                className="block bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition"
              >
                {recipe.thumbnail && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={recipe.thumbnail}
                      alt={recipe.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 truncate">{recipe.title}</h3>
                  {recipe.description && (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                      {recipe.description}
                    </p>
                  )}
                  <div className="flex justify-between text-sm text-gray-500">
                    {recipe.cooking_time && <span>{recipe.cooking_time} mins</span>}
                    {recipe.servings && <span>{recipe.servings} servings</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 