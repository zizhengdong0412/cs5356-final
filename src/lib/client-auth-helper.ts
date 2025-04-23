/**
 * Client Auth Helper
 * This file contains client-side only authentication helpers
 * that don't use any server components
 */

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
export async function checkClientAuth(): Promise<{ isAuthenticated: boolean; user: AuthUser | null }> {
  try {
    const res = await fetch('/api/client-auth/session', {
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      }
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch session: ${res.status}`);
    }
    
    const data = await res.json();
    
    return {
      isAuthenticated: !!data?.user?.id,
      user: data?.user || null
    };
  } catch (error) {
    console.error('Error checking client auth:', error);
    return { isAuthenticated: false, user: null };
  }
} 