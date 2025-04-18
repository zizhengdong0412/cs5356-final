'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';

interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string;
  instructions: string;
  cookingTime: number | null;
  servings: number | null;
  type: string;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function RecipePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        // Check if user is authenticated
        const { data: session } = await authClient.getSession();
        if (!session) {
          router.push('/auth/sign-in');
          return;
        }

        // Fetch the recipe
        const response = await fetch(`/api/recipes/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Recipe not found');
          } else {
            const data = await response.json();
            setError(data.error || 'Failed to fetch recipe');
          }
          return;
        }
        
        const data = await response.json();
        setRecipe(data);
      } catch (err) {
        console.error('Error fetching recipe:', err);
        setError('An error occurred while fetching the recipe');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [params.id, router]);

  const handleDelete = async () => {
    if (!recipe) return;
    
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete recipe');
      }

      router.push('/dashboard');
    } catch (err) {
      console.error('Error deleting recipe:', err);
      setError('Failed to delete recipe');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <Link 
            href="/dashboard" 
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Recipe Not Found</h1>
          <p className="text-gray-700 mb-6">The requested recipe could not be found.</p>
          <Link 
            href="/dashboard" 
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back to dashboard link */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-blue-500 hover:text-blue-600 font-medium flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Recipe header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold text-gray-900">{recipe.title}</h1>
              
              <div className="flex space-x-2">
                <Link
                  href={`/recipes/${recipe.id}/edit`}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit
                </Link>

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
                  aria-label="Delete recipe"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete
                </button>
              </div>
            </div>

            {recipe.description && (
              <p className="mt-4 text-gray-600">{recipe.description}</p>
            )}

            <div className="mt-4 flex items-center text-sm text-gray-500">
              <span className="capitalize">{recipe.type}</span>
              {recipe.cookingTime && (
                <>
                  <span className="mx-2">•</span>
                  <span>{recipe.cookingTime} minutes</span>
                </>
              )}
              {recipe.servings && (
                <>
                  <span className="mx-2">•</span>
                  <span>{recipe.servings} servings</span>
                </>
              )}
            </div>
          </div>

          {/* Recipe content */}
          <div className="p-6">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Ingredients</h2>
              <ul className="list-disc pl-5 space-y-2">
                {recipe.ingredients.split('\n').map((ingredient, index) => (
                  <li key={index} className="text-gray-700">
                    {ingredient.trim()}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
              <div className="prose max-w-none text-gray-700">
                {recipe.instructions.split('\n').map((instruction, index) => (
                  <p key={index} className="mb-4">
                    {instruction.trim()}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Recipe</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete "{recipe.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 