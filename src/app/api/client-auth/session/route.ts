import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/session-helper';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    return NextResponse.json(session || { user: null });
  } catch (error) {
    console.error('Error in session API route:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
} 