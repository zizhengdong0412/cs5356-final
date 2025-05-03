'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import ShareRecipeModal from './ShareRecipeModal';

interface RecipeProps {
  recipe: {
    id: string;
    title: string;
    description?: string;
    cookingTime?: number;
    servings?: number;
    thumbnail?: string;
    createdAt: string;
  };
  canEdit?: boolean;
  canDelete?: boolean;
  onDelete?: (id: string) => void;
  badgeLabel?: string;
}

export default function RecipeCard({ recipe, canEdit = false, canDelete = false, onDelete, badgeLabel }: RecipeProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPermissionError, setShowPermissionError] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      router.push(`/recipes/${recipe.id}/edit`);
    } catch (error) {
      console.error('Error navigating with router:', error);
      // Fallback to direct navigation
      window.location.href = `/recipes/${recipe.id}/edit`;
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canDelete) {
      setShowPermissionError(true);
      setTimeout(() => setShowPermissionError(false), 3000);
      return;
    }
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Failed to delete recipe: ${response.status}`);
      }
      // If on the detail page for this recipe, redirect to /recipes
      if (pathname === `/recipes/${recipe.id}`) {
        router.push('/recipes');
      } else if (onDelete) {
        onDelete(recipe.id);
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('Failed to delete recipe');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowShareModal(true);
  };

  // Navigation handler for the card
  const handleCardClick = (e: React.MouseEvent) => {
    if (showDeleteModal) return; // Block navigation if modal is open
    if ((e.target as HTMLElement).closest('.recipe-action-btn')) return;
    router.push(`/recipes/${recipe.id}`);
  };

  return (
    <div
      className="group bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition relative cursor-pointer"
      onClick={handleCardClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowDeleteConfirm(false);
      }}
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
        
        {/* Action buttons overlay */}
        {showActions && canEdit && (
          <div className="absolute top-2 right-2 flex gap-2 z-10">
            <button
              onClick={handleEdit}
              className="recipe-action-btn bg-white bg-opacity-90 p-2 rounded-full hover:bg-blue-500 hover:text-white transition-colors"
              title="Edit recipe"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            
            <button
              onClick={handleShare}
              className="recipe-action-btn bg-white bg-opacity-90 p-2 rounded-full hover:bg-green-500 hover:text-white transition-colors"
              title="Share recipe"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            
            <button
              onClick={handleDelete}
              className={`recipe-action-btn bg-white bg-opacity-90 p-2 rounded-full ${showDeleteConfirm ? 'bg-red-500 text-white' : 'hover:bg-red-500 hover:text-white'} transition-colors`}
              title={showDeleteConfirm ? 'Confirm delete' : 'Delete recipe'}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-medium mb-1 truncate flex items-center gap-2">
          {recipe.title}
          {badgeLabel && (
            <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold align-middle">
              {badgeLabel}
            </span>
          )}
        </h3>
        {recipe.description && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-2">{recipe.description}</p>
        )}
        <div className="flex items-center text-xs text-gray-500">
          {recipe.cookingTime && (
            <span className="mr-3">{recipe.cookingTime} mins</span>
          )}
          {recipe.servings && (
            <span>Serves {recipe.servings}</span>
          )}
        </div>
      </div>

      {/* Permission Error Toast */}
      {showPermissionError && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded shadow-lg z-20">
          You need admin permission to delete recipes
        </div>
      )}

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
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Place ShareRecipeModal at the root so it overlays the card */}
      <ShareRecipeModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        recipeId={recipe.id}
        recipeName={recipe.title}
      />
    </div>
  );
} 