'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient, AuthUser } from '@/lib/auth-client';
import { checkClientAuth } from '@/lib/client-auth-helper';
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [authAttempts, setAuthAttempts] = useState(0);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Checking authentication status...');
        
        // Try our client-side auth check
        const { isAuthenticated, user } = await checkClientAuth();
        
        if (!isAuthenticated || !user) {
          // If we've tried a few times and still not authenticated, redirect
          if (authAttempts >= 2) {
            console.log('Multiple authentication attempts failed, redirecting to sign-in...');
            router.replace('/auth/sign-in');
            return;
          }
          
          // Increment attempts and try again after a short delay
          setAuthAttempts(prev => prev + 1);
          setTimeout(() => {
            setIsLoading(true); // Keep loading state
          }, 1000);
          return;
        }

        console.log('User authenticated:', user.email);
        setUser({
          id: user.id,
          email: user.email,
          name: user.name || null,
          image: user.image || null
        });
        
        // Reset auth attempts
        setAuthAttempts(0);
        
        // Fetch recipes since we're authenticated
        await fetchRecipes();
      } catch (error) {
        console.error('Error checking authentication:', error);
        router.replace('/auth/sign-in');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchRecipes = async () => {
      try {
        console.log('Fetching recipes...');
        setSavedRecipes([]); // Reset recipes before fetching

        // Add a timestamp to prevent caching
        const response = await fetch('/api/recipes?' + new Date().getTime(), {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          }
        });
        
        if (!response.ok) {
          console.error(`Failed to fetch recipes: ${response.status}`);
          if (response.status === 401) {
            console.log('Auth issue detected, trying to refresh auth...');
            // Don't throw - we'll just show empty recipes
            return;
          }
          return; // Don't throw, just return and show empty recipes
        }
        
        const recipes = await response.json();
        console.log('Fetched recipes count:', recipes.length);
        setSavedRecipes(recipes);
      } catch (error) {
        console.error('Error fetching recipes:', error);
        // Don't rethrow - just log the error and continue rendering the UI
      }
    };

    // Only run the auth check if we're loading or have fewer than 3 attempts
    if (isLoading || authAttempts < 3) {
      initializeAuth();
    }
  }, [router, isLoading, authAttempts]);

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

  if (!user) {
    return null; // Let the useEffect redirect handle this case
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
              <span className="mr-4 text-gray-600">{user.email}</span>
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