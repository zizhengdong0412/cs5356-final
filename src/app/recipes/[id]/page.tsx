'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { recipes } from '@/schema';
import { eq } from 'drizzle-orm';
import { formatRecipeForDisplay } from '@/lib/recipe-helpers';
import RecipeDisplay from '@/components/RecipeDisplay';
import { Suspense } from 'react';
import { RecipeJsonDisplay } from '@/components/ui/RecipeJsonDisplay';
import { transformDatabaseRecipe, parseRecipeJsonData } from '@/lib/recipe-transformers';

// Recipe type definition
interface RecipeType {
  id: string;
  title: string;
  description?: string;
  ingredients: any[];
  instructions: any[];
  cooking_time?: number;
  servings?: number;
  type: string;
  user_id: string;
  binder_id?: string;
  created_at: string;
  updated_at: string;
}

export default function RecipePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [recipe, setRecipe] = useState<RecipeType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modals state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<'view' | 'edit' | 'admin'>('view');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareResult, setShareResult] = useState<{shareLink?: string; error?: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/recipes/${params.id}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch recipe: ${response.status}`);
        }
        
        const data = await response.json();
        setRecipe(data);
      } catch (error) {
        console.error('Error fetching recipe:', error);
        setError('Failed to load recipe');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecipe();
    
    // Check if we should open the share modal based on URL params
    const shouldShowShareModal = searchParams.get('share') === 'true';
    if (shouldShowShareModal) {
      setShowShareModal(true);
    }
  }, [params.id, searchParams]);

  const handleEdit = () => {
    router.push(`/recipes/${params.id}/edit`);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/recipes/${params.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete recipe: ${response.status}`);
      }
      
      setShowDeleteModal(false);
      router.push('/recipes');
    } catch (error) {
      console.error('Error deleting recipe:', error);
      setError('Failed to delete recipe');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setShareLoading(true);
      setShareResult(null);
      
      const response = await fetch('/api/recipes/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          recipeId: params.id,
          permission: sharePermission,
          email: shareEmail.trim() || null,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to share recipe');
      }
      
      const data = await response.json();
      setShareResult({ shareLink: data.share.shareLink });
      
      // Remove the share parameter from the URL
      if (searchParams.get('share') === 'true') {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    } catch (error: any) {
      console.error('Error sharing recipe:', error);
      setShareResult({ error: error.message || 'Failed to share recipe' });
    } finally {
      setShareLoading(false);
    }
  };

  const copyShareLink = () => {
    if (shareResult?.shareLink) {
      navigator.clipboard.writeText(shareResult.shareLink);
      alert('Share link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
          {error || 'Recipe not found'}
        </div>
      </div>
    );
  }

  // Parse recipe data if needed
  const parsedRecipe = {
    ...recipe,
    ingredients: typeof recipe.ingredients === 'string' 
      ? JSON.parse(recipe.ingredients) 
      : recipe.ingredients,
    instructions: typeof recipe.instructions === 'string'
      ? JSON.parse(recipe.instructions)
      : recipe.instructions,
    // Map properties to match RecipeDisplay props
    cookingTime: recipe.cooking_time,
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <RecipeDisplay 
        {...parsedRecipe} 
        onEdit={handleEdit}
        onDelete={() => setShowDeleteModal(true)}
        onShare={() => setShowShareModal(true)}
      />
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Delete Recipe</h3>
            <p className="mb-6">Are you sure you want to delete this recipe? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button 
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-red-600 text-white rounded-md"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Share Recipe</h3>
            <form onSubmit={handleShare}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (optional)
                </label>
                <input 
                  type="email" 
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter email to share with"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Leave blank to create a shareable link
                </p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permission
                </label>
                <select
                  value={sharePermission}
                  onChange={(e) => setSharePermission(e.target.value as 'view' | 'edit' | 'admin')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="view">View only</option>
                  <option value="edit">Can edit</option>
                  <option value="admin">Admin access</option>
                </select>
              </div>
              
              {shareResult?.shareLink && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm font-medium text-green-800 mb-2">Recipe shared successfully!</p>
                  <div className="flex">
                    <input 
                      type="text" 
                      value={shareResult.shareLink} 
                      readOnly 
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50"
                    />
                    <button
                      type="button"
                      className="px-3 py-2 bg-blue-600 text-white rounded-r-md"
                      onClick={copyShareLink}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
              
              {shareResult?.error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{shareResult.error}</p>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button 
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                  onClick={() => {
                    setShowShareModal(false);
                    // Remove the share parameter from the URL
                    if (searchParams.get('share') === 'true') {
                      const newUrl = window.location.pathname;
                      window.history.replaceState({}, '', newUrl);
                    }
                  }}
                >
                  Close
                </button>
                {!shareResult?.shareLink && (
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md"
                    disabled={shareLoading}
                  >
                    {shareLoading ? 'Sharing...' : 'Share'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
} 