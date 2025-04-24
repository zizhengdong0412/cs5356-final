import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getSessionFromCookie } from '@/lib/session-helper';
import { sql } from 'drizzle-orm';
import BinderActions from './BinderActions';
import Image from 'next/image';

export default async function BinderDetailPage({ params }: { params: { id: string } }) {
  const session = await getSessionFromCookie();
  if (!session?.user) {
    redirect('/auth/sign-in');
  }

  const binderId = params.id;

  // Check if the binder exists and belongs to the user using raw SQL
  const binderResults = await db.execute(sql`
    SELECT id, user_id, title, created_at, updated_at
    FROM binders
    WHERE id = ${binderId} AND user_id = ${session.user.id}
    LIMIT 1
  `);

  if (binderResults.length === 0) {
    redirect('/binders');
  }

  const binder = binderResults[0] as any;

  // Get recipes in this binder
  const recipesInBinder = await db.execute(sql`
    SELECT r.id, r.title, r.description, r.cooking_time, r.servings, r.thumbnail, r.created_at
    FROM recipes r
    JOIN binder_recipes br ON br.recipe_id = r.id
    WHERE br.binder_id = ${binderId}
    ORDER BY br.added_at DESC
  `);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">{binder.title}</h1>
          {/* Description removed as it doesn't exist in the database */}
        </div>
        <BinderActions binder={{
          id: binder.id,
          title: binder.title,
          user_id: binder.user_id,
          created_at: binder.created_at,
          updated_at: binder.updated_at,
        }} />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recipes in this Binder</h2>
          <div className="flex space-x-3">
            <Link
              href={`/binders/${binderId}/add-recipe`}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Create New Recipe
            </Link>
            <Link
              href={`/binders/${binderId}/add-recipes`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Add Existing Recipes
            </Link>
          </div>
        </div>

        {recipesInBinder.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No recipes yet</h3>
            <p className="text-gray-500 mb-4">
              Add or create some recipes in your binder to get started.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href={`/binders/${binderId}/add-recipe`}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Create New Recipe
              </Link>
              <Link
                href={`/binders/${binderId}/add-recipes`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Add Existing Recipes
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipesInBinder.map((recipe: any) => (
              <Link 
                key={recipe.id} 
                href={`/recipes/${recipe.id}`}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
              >
                <div className="relative w-full h-48">
                  {recipe.thumbnail ? (
                    <Image
                      src={recipe.thumbnail}
                      alt={recipe.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-medium mb-1 truncate">{recipe.title}</h3>
                  {recipe.description && (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-2">{recipe.description}</p>
                  )}
                  <div className="flex items-center text-xs text-gray-500">
                    {recipe.cooking_time && (
                      <span className="mr-3">{recipe.cooking_time} mins</span>
                    )}
                    {recipe.servings && (
                      <span>Serves {recipe.servings}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Fixed action button for creating recipes */}
      <Link
        href={`/binders/${binderId}/add-recipe`}
        className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors"
        aria-label="Create Recipe"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Link>
    </div>
  );
} 