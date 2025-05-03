'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { authClient } from '@/lib/auth-client';

export default function Navigation() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');

  // Use callback to check auth status so we can call it from multiple places
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await authClient.getSession();
      const user = data?.user;
      setIsAuthenticated(!!user);
      setUsername(user?.name || user?.email || '');
      console.log('Navigation auth check:', !!user);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    // Set up listener for auth changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.includes('auth') || e.key === null) {
        console.log('Storage change detected, rechecking auth');
        checkAuth();
      }
    };
    
    // Add event listeners for auth changes
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-change', () => checkAuth());
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', () => checkAuth());
    };
  }, [checkAuth]);

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      setIsAuthenticated(false);
      router.push('/');
      router.refresh();
      // Dispatch a custom event to notify other components about the auth change
      window.dispatchEvent(new Event('auth-change'));
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Show minimal UI during initial load
  if (loading && !isAuthenticated) {
    return (
      <nav className="flex items-center justify-between p-4 bg-white shadow-sm">
        <Link href="/" className="text-xl font-bold text-pink-500 tracking-tight">
          Recipe Keeper 🍳
        </Link>
        <div className="w-24 h-6 bg-gray-200 animate-pulse rounded"></div>
      </nav>
    );
  }

  return (
    <nav className="flex items-center justify-between p-4 bg-white shadow-sm">
      <Link href="/" className="text-xl font-bold text-pink-500 tracking-tight">
        Recipe Keeper 🍳
      </Link>
      
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            {username && (
              <span className="text-sm text-gray-500">
                Hello, {username.split('@')[0]}
              </span>
            )}
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/binders"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              My Binders
            </Link>
            <button
              onClick={handleSignOut}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/auth/sign-in"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/sign-up"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
} 