import { NextRequest, NextResponse } from 'next/server';
import { validateSessionFromCookie } from '@/lib/server-auth-helper';
import { recipeRecommendationQueue } from '@/lib/queue';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';

// Schedule weekly recommendations for all users
export async function POST(request: NextRequest) {
  try {
    // Admin-only endpoint
    const { isAuthenticated, user } = await validateSessionFromCookie();
    
    if (!isAuthenticated || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // In a real app, check for admin permissions here
    
    // Get all active users
    const activeUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
      })
      .from(users);
    
    // Schedule a recommendation job for each user
    const jobs = [];
    
    for (const user of activeUsers) {
      // Skip users without email
      if (!user.email) continue;
      
      // Schedule weekly email recommendations
      const job = await recipeRecommendationQueue.add(
        { userId: user.id },
        { 
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 60 * 1000, // 1 minute
          },
          // In production, you would set repeat options:
          // repeat: {
          //   cron: '0 9 * * 1', // Every Monday at 9 AM
          // }
        }
      );
      
      jobs.push({
        userId: user.id,
        jobId: job.id,
        name: user.name || user.email,
      });
    }
    
    return NextResponse.json({
      success: true,
      jobCount: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error('Error scheduling recommendation jobs:', error);
    return NextResponse.json(
      { error: 'Error scheduling recommendation jobs' },
      { status: 500 }
    );
  }
} 