'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { useState, useEffect } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await authClient.getSession();
      setHasSession(!!data);
    };
    checkSession();
  }, []);

  const isActive = (path: string) => pathname === path;

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
                  href="/dashboard"
                  className={`${
                    isActive('/dashboard') ? 'text-blue-500' : 'text-gray-600'
                  } hover:text-blue-500`}
                >
                  My Recipes
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
              <button
                onClick={() => authClient.signOut()}
                className="px-4 py-2 text-gray-600 hover:text-blue-500"
              >
                Sign Out
              </button>
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