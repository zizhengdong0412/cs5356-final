import { sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "./db";

/**
 * This is a custom session verification helper that bypasses Better Auth's 
 * problematic adapter system for local development
 */

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

export async function getSessionFromCookie() {
  try {
    // Get the session token from cookies
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('better-auth.session_token')?.value;
    
    if (!sessionToken) {
      console.log('No session token found in cookies');
      return null;
    }

    console.log('Session token found:', sessionToken);
    
    // Split and decode the token parts (format is [id].[signature])
    const [sessionId] = sessionToken.split('.');
    
    if (!sessionId) {
      console.log('Invalid session token format');
      return null;
    }
    
    // Use a join query to get both session and user data in one query
    const results = await db.execute(sql`
      SELECT 
        s.id as session_id, 
        s.user_id, 
        u.id as user_id, 
        u.email, 
        u.name, 
        u.image
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ${sessionId}
        AND s.expires_at > NOW()
      LIMIT 1
    `);
    
    if (!results[0]) {
      return null;
    }
    
    const data = results[0] as any;
    
    // Return the session data in the format expected by the application
    return {
      user: {
        id: data.user_id,
        email: data.email,
        name: data.name,
        image: data.image,
      }
    };
  } catch (error) {
    console.error('Error getting session from cookie:', error);
    return null;
  }
}

/**
 * Directly check session from cookie data
 * Use this when NextAuth's session handling is having issues
 */
export async function validateSessionFromCookie() {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('better-auth.session_token');
    
    if (!sessionToken?.value) {
      return { isAuthenticated: false, user: null };
    }
    
    // Parse session token to get session ID
    const [sessionId] = sessionToken.value.split('.');
    
    if (!sessionId) {
      return { isAuthenticated: false, user: null };
    }
    
    // Check if session exists and is valid
    const results = await db.execute(sql`
      SELECT 
        s.id as session_id, 
        s.user_id,
        u.id as user_id, 
        u.email, 
        u.name, 
        u.image
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ${sessionId}
        AND s.expires_at > NOW()
      LIMIT 1
    `);
    
    if (!results[0]) {
      return { isAuthenticated: false, user: null };
    }
    
    const data = results[0] as any;
    
    return {
      isAuthenticated: true,
      user: {
        id: data.user_id,
        email: data.email,
        name: data.name || null,
        image: data.image || null
      }
    };
  } catch (error) {
    console.error('Error validating session from cookie:', error);
    return { isAuthenticated: false, user: null };
  }
}

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