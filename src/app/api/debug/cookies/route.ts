import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    
    // Check for the specific session cookie
    const sessionCookie = cookieStore.get('better-auth.session_token');
    
    let sessionParts = null;
    if (sessionCookie?.value) {
      const parts = sessionCookie.value.split('.');
      sessionParts = {
        sessionId: parts[0] || null,
        signaturePart: parts.length > 1 ? `${parts[1].substring(0, 6)}...` : null, // Show only part of signature for security
      };
    }
    
    return NextResponse.json({
      success: true,
      cookies: {
        count: allCookies.length,
        names: allCookies.map(c => c.name),
        session: sessionCookie ? {
          exists: true,
          name: sessionCookie.name,
          value: sessionCookie.value ? `${sessionCookie.value.substring(0, 8)}...` : null, // Show only part for security
          parts: sessionParts
        } : { exists: false }
      }
    });
  } catch (error) {
    console.error('Debug cookies error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to get cookie information',
      errorDetails: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
} 