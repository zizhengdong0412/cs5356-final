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
  cooking_time: number | null;
  servings: number | null;
  type: string;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
}

interface Share {
  id: string;
  recipeId: string;
  ownerId: string;
  sharedWithId: string | null;
  permission: string;
  shareCode: string;
  isActive: boolean;
  createdAt: string;
  owner: {
    name: string | null;
    email: string;
  };
}

export default function SharedRecipePage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [share, setShare] = useState<Share | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedRecipe = async () => {
      try {
        if (!params.code) {
          setError('Invalid share code');
          setLoading(false);
          return;
        }

        // 获取共享食谱的信息
        const response = await fetch(`/api/shared/${params.code}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError('This shared recipe link is invalid or has expired');
          } else {
            const data = await response.json();
            setError(data.error || 'Failed to load shared recipe');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setRecipe(data.recipe);
        setShare(data.share);
      } catch (err) {
        console.error('Error fetching shared recipe:', err);
        setError('An error occurred while loading the shared recipe');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedRecipe();
  }, [params.code, router]);

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
            href="/" 
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!recipe || !share) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Recipe Not Found</h1>
          <p className="text-gray-700 mb-6">The shared recipe could not be found or has been removed.</p>
          <Link 
            href="/" 
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Recipe header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{recipe.title}</h1>
                <div className="mt-1 text-sm text-gray-500">
                  Shared by: {share.owner.name || share.owner.email}
                </div>
              </div>
              
              {/* 编辑按钮，只有拥有edit或admin权限的人才能看到 */}
              {(share.permission === 'edit' || share.permission === 'admin') && (
                <Link
                  href={`/shared/${params.code}/edit`}
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
              )}
            </div>

            {recipe.description && (
              <p className="mt-4 text-gray-600">{recipe.description}</p>
            )}

            <div className="mt-4 flex items-center text-sm text-gray-500">
              <span className="capitalize">{recipe.type}</span>
              {recipe.cooking_time && (
                <>
                  <span className="mx-2">•</span>
                  <span>{recipe.cooking_time} minutes</span>
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
    </div>
  );
} 