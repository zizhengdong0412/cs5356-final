import { createAuthClient } from 'better-auth/react';

export type AuthUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

export type Session = {
  user?: AuthUser;
};

export type User = AuthUser;

// Only log in development mode
const isDev = process.env.NODE_ENV === 'development';

// Get the base URL from environment variable or fallback with full URL including protocol
const baseURL = process.env.NEXT_PUBLIC_AUTH_URL || 
  (typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}/api/client-auth`
    : 'http://localhost:3000/api/client-auth');

if (isDev) {
  console.log("Auth client using baseURL:", baseURL);
}

export const authClient = createAuthClient({
  baseURL,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  config: {
    fetch: {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    },
    debug: isDev,
    requestDelay: 0,
    endpoints: {
      signIn: {
        email: '/sign-in/email',
      },
      signUp: {
        email: '/sign-up/email',
      },
      signOut: '/sign-out',
      session: '/session',
    },
    sessionRefreshInterval: 60000,
  },
});

export const { signIn, signUp, signOut, getSession } = authClient;

// Helper function to simplify session checks in components
export async function checkAuthSession() {
  try {
    const sessionResult = await getSession();
    const userData = sessionResult?.data?.user || null;
    
    return {
      isAuthenticated: !!userData?.id,
      user: userData
    };
  } catch (error) {
    console.error('Error checking auth session:', error);
    return {
      isAuthenticated: false,
      user: null
    };
  }
}
