'use client';

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

/**
 * Client-side helper to check authentication status
 * Use this in React components
 */
export async function getClientSession(): Promise<{ user: AuthUser | null }> {
  try {
    const res = await fetch('/api/client-auth/session', {
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      }
    });
    
    if (!res.ok) {
      console.error(`Failed to fetch session: ${res.status}`);
      return { user: null };
    }
    
    const data = await res.json();
    return { user: data?.user || null };
  } catch (error) {
    console.error('Error getting client session:', error);
    return { user: null };
  }
}

/**
 * Client-side helper to check authentication status
 * Use this in React components
 */
export async function checkClientAuth(): Promise<{ isAuthenticated: boolean; user: AuthUser | null }> {
  try {
    const { user } = await getClientSession();
    
    return {
      isAuthenticated: !!user?.id,
      user: user || null
    };
  } catch (error) {
    console.error('Error checking client auth:', error);
    return { isAuthenticated: false, user: null };
  }
} 