'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { authClient } from '@/lib/auth-client';
import { TheMealDBService } from '@/lib/themealdb';

// Define possible import states
type ImportState = 'initial' | 'loading' | 'preview' | 'error' | 'mealdb-search' | 'mealdb-results';

interface ParsedRecipe {
  title: string;
  description: string;
  ingredients: string;
  instructions: string;
  cookingTime?: string;
  servings?: string;
  type: string;
}

export default function ImportRecipePage() {
  const router = useRouter();
  const [importState, setImportState] = useState<ImportState>('initial');
  const [importUrl, setImportUrl] = useState('');
  const [recipeText, setRecipeText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mealDbSearchQuery, setMealDbSearchQuery] = useState('');
  const [mealDbResults, setMealDbResults] = useState<any[]>([]);
  const [mealDbLoading, setMealDbLoading] = useState(false);

  // Check authentication
  useState(() => {
    const checkAuth = async () => {
      const { data: session } = await authClient.getSession();
      if (!session) {
        router.push('/auth/sign-in');
      }
    };
    
    checkAuth();
  });

  const handleUrlImport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!importUrl.trim()) {
      setErrorMessage('Please enter a valid URL');
      return;
    }
    
    setImportState('loading');
    setErrorMessage('');
    
    try {
      // In a real implementation, this would call your API endpoint to scrape and parse the recipe
      const response = await fetch('/api/recipes/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: importUrl }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to import recipe');
      }
      
      const data = await response.json();
      setParsedRecipe(data);
      setImportState('preview');
    } catch (error) {
      console.error('Error importing recipe:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to import recipe');
      setImportState('error');
    }
  };

  const handleTextImport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipeText.trim()) {
      setErrorMessage('Please enter recipe text');
      return;
    }
    
    setImportState('loading');
    setErrorMessage('');
    
    try {
      // In a real implementation, this would call your API endpoint to parse the recipe text
      const response = await fetch('/api/recipes/import/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: recipeText }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to import recipe');
      }
      
      const data = await response.json();
      setParsedRecipe(data);
      setImportState('preview');
    } catch (error) {
      console.error('Error importing recipe:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to parse recipe text');
      setImportState('error');
    }
  };

  const handleMealDbSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mealDbSearchQuery.trim()) {
      setErrorMessage('Please enter a search term');
      return;
    }
    
    setMealDbLoading(true);
    setErrorMessage('');
    
    try {
      const meals = await TheMealDBService.searchMeals(mealDbSearchQuery);
      setMealDbResults(meals);
      setImportState('mealdb-results');
    } catch (error) {
      console.error('Error searching TheMealDB:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to search recipes');
    } finally {
      setMealDbLoading(false);
    }
  };

  const handleSelectMealDbRecipe = async (meal: any) => {
    try {
      // Convert MealDB format to our application's format
      const ingredients = [];
      
      // MealDB has ingredients from 1-20 with corresponding measures
      for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
        
        if (ingredient && ingredient.trim()) {
          ingredients.push(`${measure?.trim() || ''} ${ingredient.trim()}`);
        }
      }
      
      const parsedRecipe = {
        title: meal.strMeal,
        description: `${meal.strCategory} recipe from ${meal.strArea}`,
        ingredients: ingredients.join('\n'),
        instructions: meal.strInstructions,
        // Optional fields if available
        cookingTime: '',
        servings: '',
        type: 'external',
      };
      
      setParsedRecipe(parsedRecipe);
      setImportState('preview');
    } catch (error) {
      console.error('Error processing recipe:', error);
      setErrorMessage('Failed to process selected recipe');
    }
  };

  const handleManualParse = () => {
    // Basic parsing logic (this would be much more sophisticated in a real implementation)
    const lines = recipeText.split('\n').filter(line => line.trim());
    
    // Simple heuristic: first non-empty line is likely the title
    const title = lines[0] || 'Imported Recipe';
    
    // Try to identify ingredients (lines with measurements or common food items)
    const ingredientKeywords = ['cup', 'tbsp', 'tsp', 'oz', 'lb', 'g', 'kg', 'ml', 'l', 'pinch', 'salt', 'pepper', 'sugar'];
    const ingredients = lines
      .filter(line => 
        ingredientKeywords.some(keyword => line.toLowerCase().includes(keyword)) ||
        /^\d+(\.\d+)?\s+\w+/.test(line) // Lines starting with a number followed by text
      )
      .join('\n');
    
    // The rest is likely instructions
    const instructionsStart = lines.findIndex(line => 
      line.toLowerCase().includes('instruction') || 
      line.toLowerCase().includes('direction') ||
      line.toLowerCase().includes('step') ||
      line.toLowerCase().includes('method')
    );
    
    const instructions = instructionsStart > 0 
      ? lines.slice(instructionsStart + 1).join('\n')
      : lines.slice(Math.max(lines.indexOf(ingredients.split('\n')[0]), 1)).join('\n');
    
    setParsedRecipe({
      title,
      description: '',
      ingredients,
      instructions,
      type: 'external',
    });
    
    setImportState('preview');
  };

  const handleSaveRecipe = async () => {
    if (!parsedRecipe) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(parsedRecipe),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save recipe');
      }
      
      const { id } = await response.json();
      router.push(`/recipes/${id}`);
    } catch (error) {
      console.error('Error saving recipe:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save recipe');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderImportForm = () => (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-medium text-gray-900 mb-4">Import from URL</h2>
        <form onSubmit={handleUrlImport}>
          <div className="mb-4">
            <label htmlFor="import-url" className="block text-sm font-medium text-gray-700">
              Recipe URL
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="url"
                name="import-url"
                id="import-url"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="https://example.com/recipe"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Enter the URL of a recipe you want to import
            </p>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors"
          >
            Import from URL
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-medium text-gray-900 mb-4">Search TheMealDB</h2>
        <form onSubmit={handleMealDbSearch}>
          <div className="mb-4">
            <label htmlFor="mealdb-search" className="block text-sm font-medium text-gray-700">
              Search Term
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                name="mealdb-search"
                id="mealdb-search"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="chicken, pasta, etc."
                value={mealDbSearchQuery}
                onChange={(e) => setMealDbSearchQuery(e.target.value)}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Search for recipes in TheMealDB database
            </p>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors"
            disabled={mealDbLoading}
          >
            {mealDbLoading ? 'Searching...' : 'Search TheMealDB'}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-medium text-gray-900 mb-4">Paste Recipe Text</h2>
        <form onSubmit={handleTextImport}>
          <div className="mb-4">
            <label htmlFor="recipe-text" className="block text-sm font-medium text-gray-700">
              Recipe Text
            </label>
            <textarea
              id="recipe-text"
              name="recipe-text"
              rows={8}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Paste your recipe text here..."
              value={recipeText}
              onChange={(e) => setRecipeText(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">
              Paste the full recipe text, including title, ingredients, and instructions
            </p>
          </div>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={handleManualParse}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors"
            >
              Extract Recipe Manually
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors"
            >
              Parse with AI
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderMealDBResults = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Search Results for "{mealDbSearchQuery}"</h2>
        <button
          onClick={() => setImportState('initial')}
          className="text-blue-500 hover:text-blue-700"
        >
          Back to Import Options
        </button>
      </div>
      
      {mealDbResults.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-500">No recipes found for your search term.</p>
          <button
            onClick={() => setImportState('initial')}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors"
          >
            Try Another Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mealDbResults.map((meal) => (
            <div key={meal.idMeal} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="h-48 relative">
                <Image 
                  src={meal.strMealThumb} 
                  alt={meal.strMeal} 
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold line-clamp-2">{meal.strMeal}</h3>
                <div className="flex items-center mt-2 text-sm text-gray-600">
                  <span className="mr-4">{meal.strCategory}</span>
                  <span>{meal.strArea}</span>
                </div>
                <button
                  onClick={() => handleSelectMealDbRecipe(meal)}
                  className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors"
                >
                  Select Recipe
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  
  // Render the appropriate view based on the current import state
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Import a Recipe</h1>
        <p className="text-gray-600">Import recipes from websites, text, or search TheMealDB.</p>
      </div>
      
      {errorMessage && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {errorMessage}
        </div>
      )}
      
      {importState === 'initial' && renderImportForm()}
      
      {importState === 'loading' && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-lg text-gray-700">Loading...</span>
        </div>
      )}
      
      {importState === 'mealdb-results' && renderMealDBResults()}
      
      {importState === 'preview' && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Recipe Preview</h2>
            <button
              onClick={() => setImportState('initial')}
              className="text-blue-500 hover:text-blue-700"
            >
              Back to Import Options
            </button>
          </div>
          
          {parsedRecipe && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Title</h3>
                <p className="mt-1 text-lg">{parsedRecipe.title}</p>
              </div>
              
              {parsedRecipe.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="mt-1">{parsedRecipe.description}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Ingredients</h3>
                <div className="mt-1 whitespace-pre-line">{parsedRecipe.ingredients}</div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Instructions</h3>
                <div className="mt-1 whitespace-pre-line">{parsedRecipe.instructions}</div>
              </div>
              
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setImportState('initial')}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRecipe}
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Save Recipe'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {importState === 'error' && (
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <div className="text-red-500 text-xl mb-4">Error Importing Recipe</div>
          <p className="mb-6">{errorMessage || 'An unexpected error occurred.'}</p>
          <button
            onClick={() => setImportState('initial')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
} 