import { NextRequest, NextResponse } from 'next/server';
import { validateSessionFromCookie } from '@/lib/server-auth-helper';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get session using our server-side helper
    const { isAuthenticated, user } = await validateSessionFromCookie();
    
    // Get all cookies
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    
    // Check for the specific session cookie
    const sessionCookie = cookieStore.get('better-auth.session_token');
    
    return NextResponse.json({
      success: true,
      isAuthenticated,
      session: user ? {
        user: {
          id: user.id,
          email: user.email,
          // Include other session details but redact sensitive info
        }
      } : null,
      cookies: {
        sessionCookieExists: !!sessionCookie,
        cookieCount: allCookies.length,
        cookieNames: allCookies.map(c => c.name)
      }
    });
  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to get session information',
      errorDetails: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
} 