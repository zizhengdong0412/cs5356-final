import { NextRequest, NextResponse } from 'next/server';
import { serverAdapter } from '@/lib/queue';
import { validateSessionFromCookie } from '@/lib/server-auth-helper';

export async function GET(request: NextRequest) {
  // This route should only be accessible to admins
  const { isAuthenticated, user } = await validateSessionFromCookie();
  
  // Check if user is authenticated and has admin role
  // In a real app, you would check for admin role in the user record
  if (!isAuthenticated || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // We're delegating to Bull Board Express adapter
  return serverAdapter.getRouter()(request);
}

export async function POST(request: NextRequest) {
  // Same auth check
  const { isAuthenticated, user } = await validateSessionFromCookie();
  if (!isAuthenticated || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return serverAdapter.getRouter()(request);
}

export async function PUT(request: NextRequest) {
  // Same auth check
  const { isAuthenticated, user } = await validateSessionFromCookie();
  if (!isAuthenticated || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return serverAdapter.getRouter()(request);
} 