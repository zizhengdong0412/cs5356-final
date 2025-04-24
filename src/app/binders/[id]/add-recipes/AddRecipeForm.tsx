'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  description?: string | null;
  thumbnail?: string | null;
  cooking_time?: number | null;
  servings?: number | null;
  type?: string;
  ingredients?: string | null;
  instructions?: string | null;
  user_id: string;
  created_at?: Date;
  updated_at?: Date;
};

export default function AddRecipeForm({
  binder,
  availableRecipes,
}: {
  binder: Binder;
  availableRecipes: Recipe[];
}) {
  const router = useRouter();
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleRecipeToggle = (recipeId: string) => {
    setSelectedRecipes(prev => {
      if (prev.includes(recipeId)) {
        return prev.filter(id => id !== recipeId);
      } else {
        return [...prev, recipeId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedRecipes.length === availableRecipes.length) {
      setSelectedRecipes([]);
    } else {
      setSelectedRecipes(availableRecipes.map(recipe => recipe.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedRecipes.length === 0) {
      setError('Please select at least one recipe');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/binders/${binder.id}/recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipeIds: selectedRecipes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add recipes to binder');
      }

      router.push(`/binders/${binder.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          Select Recipes to Add ({selectedRecipes.length} selected)
        </h2>
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-blue-600 hover:text-blue-800"
        >
          {selectedRecipes.length === availableRecipes.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {availableRecipes.map(recipe => (
            <div 
              key={recipe.id}
              className={`border rounded-lg overflow-hidden hover:shadow-md transition cursor-pointer ${
                selectedRecipes.includes(recipe.id) ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
              }`}
              onClick={() => handleRecipeToggle(recipe.id)}
            >
              <div className="flex items-center p-4">
                <input
                  type="checkbox"
                  checked={selectedRecipes.includes(recipe.id)}
                  onChange={() => {}}
                  className="mr-3 h-5 w-5 text-blue-600"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{recipe.title}</h3>
                  {recipe.description && (
                    <p className="text-gray-500 text-sm truncate">{recipe.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end space-x-4">
          <Link
            href={`/binders/${binder.id}`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || selectedRecipes.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Adding...' : 'Add Selected Recipes'}
          </button>
        </div>
      </form>
    </div>
  );
} 