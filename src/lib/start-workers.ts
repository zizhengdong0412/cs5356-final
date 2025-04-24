'use server';

// Import all workers
import './workers/recommendation-worker';
import './workers/trending-worker';
import './workers/import-worker';

// Import queues
import { 
  recipeRecommendationQueue, 
  recipeTrendingQueue,
  recipeImportQueue 
} from './queue';

/**
 * Schedule recurring jobs when the server starts
 */
export async function scheduleRecurringJobs() {
  try {
    console.log('Setting up recurring background jobs...');
    
    // Clean up existing repeatable jobs first
    await recipeRecommendationQueue.removeRepeatable({});
    await recipeTrendingQueue.removeRepeatable({});
    
    // Schedule daily trending calculation
    await recipeTrendingQueue.add(
      {}, 
      {
        jobId: 'daily-trending',
        repeat: {
          cron: '0 0 * * *', // Every day at midnight
        },
      }
    );
    console.log('✅ Scheduled daily trending calculation');
    
    // Schedule weekly recommendations on Mondays for testing
    // In a real app, you'd get actual user IDs from the database
    await recipeRecommendationQueue.add(
      { 
        isTestJob: true,
        userId: 'test-user' 
      },
      {
        jobId: 'weekly-recommendations-test',
        repeat: {
          cron: '0 9 * * 1', // Every Monday at 9 AM
        },
      }
    );
    console.log('✅ Scheduled weekly recommendation test');
    
    return { success: true };
  } catch (error) {
    console.error('Error scheduling recurring jobs:', error);
    return { success: false, error };
  }
}

/**
 * Initialize all workers and scheduled jobs
 */
export async function initializeWorkers() {
  try {
    // Log worker initialization
    console.log('Initializing background workers...');
    
    // Print queue info
    const recWorkerCount = await recipeRecommendationQueue.getWorkers();
    const trendWorkerCount = await recipeTrendingQueue.getWorkers();
    const importWorkerCount = await recipeImportQueue.getWorkers();
    
    console.log(`Recipe recommendation workers: ${recWorkerCount.length}`);
    console.log(`Recipe trending workers: ${trendWorkerCount.length}`);
    console.log(`Recipe import workers: ${importWorkerCount.length}`);
    
    // Schedule recurring jobs
    await scheduleRecurringJobs();
    
    return { success: true };
  } catch (error) {
    console.error('Error initializing workers:', error);
    return { success: false, error: String(error) };
  }
} 