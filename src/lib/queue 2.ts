import Queue from 'bull';
import Redis from 'ioredis';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';

// Redis connection options
const redisOptions = {
  port: parseInt(process.env.REDIS_PORT || '6379'),
  host: process.env.REDIS_HOST || 'localhost',
  password: process.env.REDIS_PASSWORD,
};

// Create Redis client for Bull
const redisClient = new Redis(redisOptions);

// Create job queues
export const recipeRecommendationQueue = new Queue('recipe-recommendations', {
  createClient: () => redisClient,
});

export const recipeTrendingQueue = new Queue('recipe-trending', {
  createClient: () => redisClient,
});

export const recipeImportQueue = new Queue('recipe-import', {
  createClient: () => redisClient,
});

// Initialize Bull Board (admin UI)
export const serverAdapter = new ExpressAdapter();
createBullBoard({
  queues: [
    new BullAdapter(recipeRecommendationQueue),
    new BullAdapter(recipeTrendingQueue),
    new BullAdapter(recipeImportQueue),
  ],
  serverAdapter,
});

serverAdapter.setBasePath('/api/admin/queues');

// Export queues
export const queues = {
  recipeRecommendationQueue,
  recipeTrendingQueue,
  recipeImportQueue,
}; 