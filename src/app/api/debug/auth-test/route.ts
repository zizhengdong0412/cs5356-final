import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { validateSessionFromCookie } from '@/lib/server-auth-helper';

export async function GET() {
  try {
    // Get all cookies
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    
    // Check for the specific session cookie
    const sessionCookie = cookieStore.get('better-auth.session_token');
    let sessionId = null;
    
    if (sessionCookie?.value) {
      const parts = sessionCookie.value.split('.');
      sessionId = parts[0];
    }
    
    // Check if the session exists in the database
    let sessionExists = false;
    let sessionData = null;
    
    if (sessionId) {
      try {
        const result = await db.execute(sql`
          SELECT * FROM sessions WHERE id = ${sessionId} LIMIT 1
        `);
        sessionExists = result.length > 0;
        if (sessionExists) {
          sessionData = {
            id: result[0].id,
            userId: result[0].user_id,
            expiresAt: result[0].expires_at,
          };
        }
      } catch (dbError) {
        console.error('Database error checking session:', dbError);
      }
    }
    
    // Try the actual validation function
    const { isAuthenticated, user } = await validateSessionFromCookie();
    
    return NextResponse.json({
      success: true,
      cookies: {
        count: allCookies.length,
        cookieNames: allCookies.map(c => c.name),
        sessionCookie: sessionCookie ? {
          exists: true,
          name: sessionCookie.name,
          value: sessionCookie.value ? `${sessionCookie.value.substring(0, 8)}...` : null,
          sessionId,
        } : { exists: false }
      },
      database: {
        sessionExists,
        sessionData
      },
      authentication: {
        isAuthenticated,
        user: user ? {
          id: user.id,
          email: user.email,
        } : null
      }
    });
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
} 