'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { checkClientAuth } from '@/lib/client-session-helper';

export default function Navigation() {
  const pathname = usePathname();
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Checking for session in Navigation...');
        const { isAuthenticated, user } = await checkClientAuth();
        console.log('Session in Navigation:', user ? `Found (${user.email})` : 'Not found');
        setHasSession(isAuthenticated);
      } catch (error) {
        console.error('Error checking session in Navigation:', error);
        setHasSession(false);
      }
    };
    checkSession();
  }, []);

  const isActive = (path: string) => pathname === path;
  const isActivePath = (path: string) => pathname?.startsWith(path);

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link
              href="/"
              className={`text-lg font-semibold ${
                isActive('/') ? 'text-blue-500' : 'text-gray-700'
              }`}
            >
              Recipe Keeper
            </Link>

            {hasSession && (
              <>
                <Link
                  href="/binders"
                  className={`${
                    isActivePath('/binders') ? 'text-blue-500' : 'text-gray-600'
                  } hover:text-blue-500 font-medium`}
                >
                  My Recipe Binders
                </Link>
                <Link
                  href="/recipes"
                  className={`${
                    isActivePath('/recipes') && !isActivePath('/recipes/personal/new') ? 'text-blue-500' : 'text-gray-600'
                  } hover:text-blue-500`}
                >
                  All Recipes
                </Link>
                <Link
                  href="/explore"
                  className={`${
                    isActive('/explore') ? 'text-blue-500' : 'text-gray-600'
                  } hover:text-blue-500`}
                >
                  Explore
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {hasSession ? (
              <a
                href="/api/auth/signout"
                className="px-4 py-2 text-gray-600 hover:text-blue-500"
              >
                Sign Out
              </a>
            ) : (
              <>
                <Link
                  href="/auth/sign-in"
                  className={`${
                    isActive('/auth/sign-in') ? 'text-blue-500' : 'text-gray-600'
                  } hover:text-blue-500`}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/sign-up"
                  className={`${
                    isActive('/auth/sign-up')
                      ? 'text-blue-500'
                      : 'text-gray-600'
                  } hover:text-blue-500`}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 