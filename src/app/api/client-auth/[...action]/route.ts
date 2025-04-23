import { SignInUser, SignUpUser } from '@/lib/auth';
import { validateSessionFromCookie } from '@/lib/server-auth-helper';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { sessions } from '@/lib/schema';
import { sql } from 'drizzle-orm';

// Session handler for both GET and POST
async function handleSession() {
  try {
    // Use our server-side session validator
    const { isAuthenticated, user } = await validateSessionFromCookie();
    
    if (isAuthenticated && user) {
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email || '',
          name: user.name || null,
          image: user.image || null,
        },
      });
    }

    // Check for session in cookies as a fallback
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('better-auth.session_token');
    
    if (sessionCookie?.value && process.env.NODE_ENV === 'development') {
      console.log('Session cookie exists, but no valid session found in database.');
    }

    return NextResponse.json({ success: true, user: null });
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json({ success: false, user: null });
  }
}

// Helper to create a session cookie and store in database
async function createSessionCookie(user: { id: string; email: string; name?: string | null }) {
  if (!user || !user.id) return null;
  
  // Generate a session ID and signature
  const sessionId = crypto.randomUUID();
  const signature = crypto.createHash('sha256').update(`${sessionId}:${user.id}`).digest('hex');
  
  // Create a session token in the format expected: [id].[signature]
  const sessionToken = `${sessionId}.${signature}`;

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);
  
  console.log('********* CREATING SESSION IN DATABASE *********');
  console.log('Session ID:', sessionId, 'User ID:', user.id);
  
  try {
    // Store the session in the database
    await db.execute(sql`
      INSERT INTO sessions (id, user_id, expires_at)
      VALUES (${sessionId}, ${user.id}, ${expiryDate.toISOString()})
    `);

    console.log('********* SESSION STORED SUCCESSFULLY *********');
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Session stored in database for user:', user.email);
    }
  } catch (error) {
    console.error('Error storing session in database:', error);
    console.error(error);
  }
  
  // Set the cookie
  cookies().set({
    name: 'better-auth.session_token',
    value: sessionToken,
    expires: expiryDate,
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Set session cookie for user:', user.email);
  }
  
  return sessionToken;
}

export async function GET(request: NextRequest, { params }: { params: { action: string[] } }) {
  const actionPath = params.action || [];
  const action = actionPath[0] || '';
  
  // Log the request in development
  if (process.env.NODE_ENV === 'development') {
    console.log('GET client auth request:', { action, path: request.nextUrl.pathname });
  }
  
  // Handle session requests
  if (action === 'session' || action === 'get-session') {
    return handleSession();
  }
  
  // Default response for any other GET requests
  return NextResponse.json({ success: true });
}

export async function POST(request: NextRequest, { params }: { params: { action: string[] } }) {
  // Get the first part of the action path (sign-in, sign-up, etc.)
  const actionPath = params.action || [];
  const action = actionPath[0] || '';
  const subAction = actionPath[1] || ''; // This might be 'email' in /api/client-auth/sign-in/email
  
  // Log in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log('POST client auth request:', { action, subAction, path: request.nextUrl.pathname });
  }
  
  try {
    // Get the request body
    const body = await request.json();
    
    // Handle session requests via POST
    if (action === 'session' || action === 'get-session') {
      return handleSession();
    }
    
    // Handle sign-in action (regardless of subAction like "email")
    if (action === 'sign-in' || action === 'signin') {
      const { email, password } = body || {};
      console.log("Sign-up body received:", body);
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email and password are required' },
          { status: 400 }
        );
      }
      
      console.log('Attempting to sign in user:', email);
      const user = await SignInUser(email, password);
      
      if (!user) {
        console.log('Sign-in failed for:', email);
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }
      
      console.log('User successfully signed in:', user.email);
      
      // Create a session cookie
      try {
        await createSessionCookie(user);
        console.log('Session cookie created for user:', user.email);
      } catch (cookieError) {
        console.error('Error creating session cookie:', cookieError);
      }
      
      return NextResponse.json({ 
        user,
        // Add any other fields better-auth expects in response
      });
    }
    
    // Handle sign-up action 
    if (action === 'sign-up' || action === 'signup') {
      const { email, password, name } = body || {};
      
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email and password are required' },
          { status: 400 }
        );
      }
      
      const user = await SignUpUser(email, password, name);
      
      if (!user) {
        return NextResponse.json(
          { error: 'Registration failed. User may already exist.' },
          { status: 400 }
        );
      }
      
      // Create a session cookie on sign-up too
      await createSessionCookie(user);
      
      return NextResponse.json({ 
        user,
        // Add any other fields better-auth expects
      });
    }
    
    // Handle signout
    if (action === 'signout' || action === 'sign-out') {
      // Clear session cookie
      cookies().set({
        name: 'better-auth.session_token',
        value: '',
        expires: new Date(0),
        path: '/',
      });
      
      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('User signed out - session cookie cleared');
      }
      
      return NextResponse.json({ success: true });
    }
    
    // Unknown action
    return NextResponse.json(
      { error: `Unknown action: ${action}/${subAction}` },
      { status: 400 }
    );
  } catch (error) {
    console.error('Client auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 