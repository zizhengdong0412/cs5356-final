import { NextRequest, NextResponse } from 'next/server';
import { validateSessionFromCookie } from '@/lib/server-auth-helper';
import { recipeTrendingQueue } from '@/lib/queue';

// Calculate trending recipes (scheduled or manual trigger)
export async function POST(request: NextRequest) {
  try {
    // Admin-only endpoint
    const { isAuthenticated, user } = await validateSessionFromCookie();
    
    if (!isAuthenticated || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // In a real app, check for admin permissions here
    
    // Schedule trending calculation
    const job = await recipeTrendingQueue.add(
      {},
      { 
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60 * 1000, // 1 minute
        },
        // In production, you would set repeat options:
        // repeat: {
        //   cron: '0 0 * * *', // Every day at midnight
        // }
      }
    );
    
    return NextResponse.json({
      success: true,
      jobId: job.id,
    });
  } catch (error) {
    console.error('Error scheduling trending calculation:', error);
    return NextResponse.json(
      { error: 'Error scheduling trending calculation' },
      { status: 500 }
    );
  }
} 