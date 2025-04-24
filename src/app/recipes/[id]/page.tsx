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

  const handleEdit = async () => {
    try {
      // First check if the edit page exists by making a HEAD request
      const editPageUrl = `/recipes/${params.id}/edit`;
      const response = await fetch(editPageUrl, {
        method: 'HEAD',
        credentials: 'include'
      });
      
      if (response.ok) {
        router.push(editPageUrl);
      } else {
        // If the edit page doesn't exist, try to access it through a different path
        console.error('Edit page not found, trying alternative path');
        window.location.href = editPageUrl;
      }
    } catch (error) {
      console.error('Error accessing edit page:', error);
      alert('There was a problem accessing the edit page. Please try again later.');
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/recipes/${params.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete recipe');
      }
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete recipe');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = async () => {
    try {
      setShareLoading(true);
      setShareResult(null);
      
      const response = await fetch(`/api/recipes/${params.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: shareEmail.trim() || null,
          permission: sharePermission
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to share recipe');
      }
      
      setShareResult({
        shareLink: data.shareLink
      });
      
      if (shareEmail.trim()) {
        setShareEmail('');
      }
    } catch (error) {
      console.error('Error sharing recipe:', error);
      setShareResult({
        error: error instanceof Error ? error.message : 'Failed to share recipe'
      });
    } finally {
      setShareLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Recipe not found'}
        </div>
      </div>
    );
  }

  // Parse the recipe for display
  const parsedRecipe = parseRecipeJsonData(recipe);

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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Share Recipe</h3>
              <button 
                onClick={() => {
                  setShowShareModal(false);
                  setShareResult(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {shareResult ? (
              <div className="mb-6">
                {shareResult.error ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {shareResult.error}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
                      Recipe shared successfully!
                    </div>
                    {shareResult.shareLink && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Share Link
                        </label>
                        <div className="flex">
                          <input
                            type="text"
                            readOnly
                            value={shareResult.shareLink}
                            className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(shareResult.shareLink!);
                              alert('Link copied to clipboard!');
                            }}
                            className="bg-blue-500 text-white px-4 py-2 rounded-r-md"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="recipient@example.com"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty to generate a link you can share manually.
                  </p>
                </div>
                
                <div>
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
                    <option value="admin">Full access</option>
                  </select>
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              {!shareResult ? (
                <button
                  onClick={handleShare}
                  disabled={shareLoading}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:opacity-50"
                >
                  {shareLoading ? 'Sharing...' : 'Share Recipe'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShareResult(null);
                    setShareEmail('');
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md"
                >
                  Share Again
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 