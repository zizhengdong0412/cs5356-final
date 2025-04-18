'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient, Session } from '@/lib/auth-client';
import LatestRecipes from '@/components/LatestRecipes';
import Link from 'next/link';

interface SavedRecipe {
  id: string;
  title: string;
  type: 'personal' | 'external';
  cookingTime?: string;
  thumbnail?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: sessionData } = await authClient.getSession();
        if (!sessionData) {
          router.push('/auth/sign-in');
          return;
        }
        const session: Session = {
          user: {
            id: sessionData.user.id,
            name: sessionData.user.name,
            email: sessionData.user.email,
            image: sessionData.user.image || null
          }
        };
        setSession(session);
      } catch (error) {
        console.error('Error checking session:', error);
        router.push('/auth/sign-in');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchRecipes = async () => {
      try {
        const response = await fetch('/api/recipes', { credentials: 'include' });
        // ... existing code ...
        if (!response.ok) {
          throw new Error('Failed to fetch recipes');
        }
        const recipes = await response.json();
        console.log('Fetched recipes:', recipes); // Debug log
        setSavedRecipes(recipes);
      } catch (error) {
        console.error('Error fetching recipes:', error);
      }
    };

    checkSession();
    fetchRecipes();
  }, [router]);

  // Add a useEffect to refetch recipes when returning to dashboard
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const response = await fetch('/api/recipes');
        if (!response.ok) {
          throw new Error('Failed to fetch recipes');
        }
        const recipes = await response.json();
        console.log('Refetched recipes:', recipes); // Debug log
        setSavedRecipes(recipes);
      } catch (error) {
        console.error('Error fetching recipes:', error);
      }
    };

    // Add event listener for when the page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchRecipes();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', fetchRecipes);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', fetchRecipes);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-6">
              <Link
                href="/"
                className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span>Home</span>
              </Link>
              <h1 className="text-xl font-semibold">Recipe Keeper</h1>
            </div>
            <div className="flex items-center">
              <span className="mr-4 text-gray-600">{session?.user?.email}</span>
              <button
                onClick={handleSignOut}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">What's New</h2>
              <LatestRecipes />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">My Notes</h2>
              <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
                {savedRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start space-x-3">
                      {recipe.thumbnail && (
                        <img
                          src={recipe.thumbnail}
                          alt={recipe.title}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{recipe.title}</h3>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <span className="capitalize">{recipe.type}</span>
                          {recipe.cookingTime && (
                            <>
                              <span className="mx-2">•</span>
                              <span>{recipe.cookingTime}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {savedRecipes.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No saved recipes yet. Create your own or save from existing recipes!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Create Recipe Button */}
      <Link
        href="/recipes/personal/create"
        className="fixed bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium shadow-lg transition-colors flex items-center space-x-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span>Create Recipe</span>
      </Link>
    </div>
  );
} 