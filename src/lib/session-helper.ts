import { eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "./db";
import { sessions, users } from "./schema";

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
    
    // Query the sessions table directly using the session ID
    const sessionResults = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);
    
    if (sessionResults.length === 0) {
      return null;
    }
    
    const session = sessionResults[0];
    
    // Check if the session has expired
    if (new Date(session.expires_at) < new Date()) {
      return null;
    }
    
    // Get the user associated with the session
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user_id))
      .limit(1);
    
    if (userResults.length === 0) {
      return null;
    }
    
    const user = userResults[0];
    
    // Return the session data in the format expected by the application
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: null,
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
    const sessionResults = await db.execute(sql`
      SELECT s.*, u.id as user_id, u.email, u.name, u.image
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ${sessionId}
        AND s.expires_at > NOW()
      LIMIT 1
    `);
    
    if (!sessionResults[0]) {
      return { isAuthenticated: false, user: null };
    }
    
    const sessionData = sessionResults[0] as any;
    
    return {
      isAuthenticated: true,
      user: {
        id: sessionData.user_id,
        email: sessionData.email,
        name: sessionData.name || null,
        image: sessionData.image || null
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