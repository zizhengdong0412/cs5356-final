import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { recipes } from '@/schema';
import { eq } from 'drizzle-orm';
import { formatRecipeForDisplay } from '@/lib/recipe-helpers';
import RecipeDisplay from '@/components/RecipeDisplay';
import { Suspense } from 'react';
import { RecipeJsonDisplay } from '@/components/ui/RecipeJsonDisplay';
import { transformDatabaseRecipe, parseRecipeJsonData } from '@/lib/recipe-transformers';

export default async function RecipePage({ params }: { params: { id: string } }) {
  const recipe = await db.query.recipes.findFirst({
    where: eq(recipes.id, params.id),
  });

  if (!recipe) {
    notFound();
  }

  // Transform database recipe to frontend format
  const transformedRecipe = transformDatabaseRecipe(recipe);
  
  // Further process the recipe data to ensure nested JSON is parsed
  const formattedRecipe = formatRecipeForDisplay(transformedRecipe);
  const parsedRecipe = parseRecipeJsonData(formattedRecipe);

  // Add debug info to display
  const isInDevelopment = process.env.NODE_ENV === 'development';

  return (
    <main className="container mx-auto px-4 py-8">
      <Suspense fallback={<div className="flex justify-center p-12">Loading...</div>}>
        <RecipeDisplay {...parsedRecipe} />
        
        {/* Show debug info in development mode */}
        {isInDevelopment && (
          <div className="mt-8 p-4 border border-gray-300 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Debug Information</h2>
            <RecipeJsonDisplay data={recipe.ingredients} label="Raw Ingredients" />
            <RecipeJsonDisplay data={transformedRecipe.ingredients} label="Transformed Ingredients" />
            <RecipeJsonDisplay data={parsedRecipe.ingredients} label="Parsed Ingredients" />
            <RecipeJsonDisplay data={recipe.instructions} label="Raw Instructions" />
            <RecipeJsonDisplay data={transformedRecipe.instructions} label="Transformed Instructions" />
            <RecipeJsonDisplay data={parsedRecipe.instructions} label="Parsed Instructions" />
          </div>
        )}
      </Suspense>
    </main>
  );
} 