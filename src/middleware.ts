import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect better-auth requests to our custom API route
  if (pathname.startsWith('/api/auth/sign-in') || 
      pathname.startsWith('/api/auth/sign-up') ||
      pathname.startsWith('/api/auth/signin') || 
      pathname.startsWith('/api/auth/signup') ||
      pathname.startsWith('/api/auth/get-session') ||
      pathname.startsWith('/api/auth/session')) {
    
    // Create the new URL
    const newUrl = request.nextUrl.clone();
    
    // Transform the path: /api/auth/sign-in/email → /api/client-auth/sign-in
    const parts = pathname.split('/');
    let action = parts[3]; // sign-in, sign-up, get-session, etc.
    
    // Map 'get-session' to 'session' for consistency
    if (action === 'get-session') {
      action = 'session';
    }
    
    newUrl.pathname = `/api/client-auth/${action}`;
    
    // Log redirection in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Redirecting ${pathname} to ${newUrl.pathname}`);
    }
    
    return NextResponse.rewrite(newUrl);
  }

  // Handle root path for authenticated users
  if (pathname === '/' || pathname === '') {
    // Check if the user has a session token
    const sessionToken = request.cookies.get('better-auth.session_token')?.value;
    
    // If there's a valid session token, redirect to binders
    if (sessionToken) {
      const bindersUrl = new URL('/binders', request.url);
      return NextResponse.redirect(bindersUrl);
    }
  }

  // Protected routes that require authentication
  if (pathname.startsWith('/dashboard') || 
      pathname.startsWith('/recipes') || 
      pathname.startsWith('/profile') ||
      pathname.startsWith('/binders') ||
      pathname.startsWith('/notes') ||
      pathname.startsWith('/admin')) {
    
    // Get the session token from cookies
    const sessionToken = request.cookies.get('better-auth.session_token')?.value;
    
    // If no session token, redirect to sign-in
    if (!sessionToken) {
      const signInUrl = new URL('/auth/sign-in', request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

// Configure the middleware to run on auth API routes and protected pages
export const config = {
  matcher: [
    '/',
    '/api/auth/:path*',
    '/dashboard/:path*', 
    '/recipes/:path*',
    '/profile/:path*',
    '/binders/:path*',
    '/notes/:path*',
    '/admin/:path*'
  ],
}; 