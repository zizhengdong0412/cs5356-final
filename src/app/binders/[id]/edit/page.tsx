'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { TheMealDBService } from '@/lib/themealdb';

type Binder = {
  id: string;
  title: string;
  description?: string | null;
  user_id: string;
  created_at: Date;
  updated_at: Date;
};

type Recipe = {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
};

type ThemeMealDBSuggestion = {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
  strCategory: string;
  strArea: string;
};

export default function EditBinderPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [binder, setBinder] = useState<Binder | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [suggestedRecipes, setSuggestedRecipes] = useState<ThemeMealDBSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [recipesInBinder, setRecipesInBinder] = useState<Recipe[]>([]);

  // Categories for recipe suggestions
  const categories = ['Beef', 'Chicken', 'Dessert', 'Lamb', 'Pasta', 'Pork', 'Seafood', 'Vegetarian'];

  // Fetch binder data on component mount
  useEffect(() => {
    const fetchBinder = async () => {
      try {
        const response = await fetch(`/api/binders/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch binder');
        }
        
        const data = await response.json();
        setBinder(data.binder);
        setTitle(data.binder.title);
        setDescription(data.binder.description || '');
        setRecipesInBinder(data.recipes || []);
        
        // Load initial suggestions based on binder title
        if (data.binder.title) {
          fetchSuggestions(data.binder.title);
        }
      } catch (err) {
        console.error('Error fetching binder:', err);
        setError('Could not load binder information');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBinder();
  }, [params.id]);

  // Fetch recipe suggestions from TheMealDB
  const fetchSuggestions = async (searchTerm: string) => {
    setIsLoadingSuggestions(true);
    try {
      let meals;
      if (selectedCategory) {
        meals = await TheMealDBService.getMealsByCategory(selectedCategory);
      } else {
        meals = await TheMealDBService.searchMeals(searchTerm);
      }
      
      if (meals.length > 0) {
        // Take up to 6 suggestions
        setSuggestedRecipes(meals.slice(0, 6));
      } else {
        // If no results, try getting random meals
        const randomMeal = await TheMealDBService.getRandomMeal();
        if (randomMeal) {
          setSuggestedRecipes([randomMeal]);
        }
      }
    } catch (err) {
      console.error('Error fetching recipe suggestions:', err);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Change category and fetch new suggestions
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    fetchSuggestions(category);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      if (!title.trim()) {
        throw new Error('Title is required');
      }
      
      const response = await fetch(`/api/binders/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update binder');
      }
      
      router.push(`/binders/${params.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setIsSubmitting(false);
    }
  };

  // Import a recipe from TheMealDB
  const handleImportRecipe = async (meal: ThemeMealDBSuggestion) => {
    try {
      setIsSubmitting(true);
      
      // Get the full meal details 
      const fullMeal = await TheMealDBService.getMealById(meal.idMeal);
      
      if (!fullMeal) {
        throw new Error('Could not fetch recipe details');
      }
      
      // Process ingredients and instructions
      const ingredients = [];
      for (let i = 1; i <= 20; i++) {
        const ingredient = fullMeal[`strIngredient${i}` as keyof typeof fullMeal];
        const measure = fullMeal[`strMeasure${i}` as keyof typeof fullMeal];
        
        if (ingredient && ingredient.trim()) {
          ingredients.push({
            name: ingredient.trim(),
            amount: 1,
            unit: measure?.trim() || '',
            notes: ''
          });
        }
      }
      
      // Convert instructions to structured format
      const instructions = fullMeal.strInstructions
        .split(/\r?\n/)
        .filter((line: string) => line.trim().length > 0)
        .map((text: string, index: number) => ({
          step: index + 1,
          text: text.trim(),
        }));
      
      // Create the recipe and add to binder
      const recipeResponse = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: fullMeal.strMeal,
          description: `${fullMeal.strCategory} recipe from ${fullMeal.strArea}`,
          ingredients,
          instructions,
          cookingTime: 30, // Default value since TheMealDB doesn't provide this
          servings: 4, // Default value
          type: 'external',
          thumbnail: fullMeal.strMealThumb,
          binderId: params.id
        }),
      });
      
      if (!recipeResponse.ok) {
        const errorData = await recipeResponse.json();
        throw new Error(errorData.error || 'Failed to import recipe');
      }
      
      alert('Recipe imported successfully!');
      
      // Refresh the page to show the new recipe
      router.refresh();
    } catch (error) {
      console.error('Error importing recipe:', error);
      setError('Failed to import recipe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-lg text-gray-700">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href={`/binders/${params.id}`}
          className="text-blue-500 hover:text-blue-600 inline-flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Back to Binder
        </Link>
      </div>

      <div className="mb-12">
        <h1 className="text-3xl font-bold">Edit Binder</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Binder Information</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
                  Binder Title*
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>
              
              <div className="flex justify-end space-x-4">
                <Link
                  href={`/binders/${params.id}`}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Current Recipes</h2>
            {recipesInBinder.length === 0 ? (
              <p className="text-gray-500">No recipes in this binder yet.</p>
            ) : (
              <div className="space-y-4">
                {recipesInBinder.map((recipe) => (
                  <div key={recipe.id} className="flex items-center gap-3 border-b pb-4">
                    {recipe.thumbnail && (
                      <div className="w-16 h-16 relative overflow-hidden rounded">
                        <img
                          src={recipe.thumbnail}
                          alt={recipe.title}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium">{recipe.title}</h3>
                      {recipe.description && (
                        <p className="text-sm text-gray-600">{recipe.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Link
                href={`/binders/${params.id}/add-existing-recipes`}
                className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Existing Recipes
              </Link>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Recipe Suggestions</h2>
            <p className="mb-4 text-gray-600">
              Add new recipes to your binder from TheMealDB's collection.
            </p>
            
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Filter by Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`px-3 py-1 text-sm rounded-full ${
                      selectedCategory === category
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
                {selectedCategory && (
                  <button
                    onClick={() => {
                      setSelectedCategory('');
                      fetchSuggestions(title);
                    }}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>
            
            {isLoadingSuggestions ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : suggestedRecipes.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No recipe suggestions found. Try a different category.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {suggestedRecipes.map((meal) => (
                  <div key={meal.idMeal} className="border rounded-lg overflow-hidden shadow-sm">
                    <div className="h-32 relative">
                      <img
                        src={meal.strMealThumb}
                        alt={meal.strMeal}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm mb-1 truncate">{meal.strMeal}</h3>
                      <p className="text-xs text-gray-600 mb-3">
                        {meal.strCategory} • {meal.strArea}
                      </p>
                      <button
                        onClick={() => handleImportRecipe(meal)}
                        disabled={isSubmitting}
                        className="w-full py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {isSubmitting ? 'Importing...' : 'Add to Binder'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {suggestedRecipes.length > 0 && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => fetchSuggestions(title)}
                  className="text-blue-600 hover:text-blue-800"
                  disabled={isLoadingSuggestions}
                >
                  Load More Suggestions
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 