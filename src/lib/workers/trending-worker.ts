'use server';

import { recipeTrendingQueue } from '../queue';
import { db } from '../db';
import { recipes } from '../schema';
import { desc, sql } from 'drizzle-orm';

// In-memory cache (would use Redis in production)
// Using a proper typed declaration
declare global {
  var trendingRecipes: any[];
}

// Initialize if not exists
if (!global.trendingRecipes) {
  global.trendingRecipes = [];
}

// Process recipe trending calculation jobs
recipeTrendingQueue.process(async (job) => {
  console.log('Calculating trending recipes');
  
  try {
    // Define the time window (last 7 days)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    // In a real app, you would calculate trending score based on
    // views, shares, saves, and recency. Here we use a simplified approach:
    const trendingRecipes = await db.execute(sql`
      WITH recent_views AS (
        SELECT 
          recipe_id,
          COUNT(*) as view_count
        FROM recipe_views
        WHERE created_at > ${startDate}
        GROUP BY recipe_id
      ),
      recent_shares AS (
        SELECT 
          recipe_id,
          COUNT(*) as share_count
        FROM shared_recipes
        WHERE created_at > ${startDate}
        GROUP BY recipe_id
      )
      SELECT 
        r.id,
        r.title,
        r.description,
        r.image_url,
        r.user_id,
        COALESCE(rv.view_count, 0) as recent_views,
        COALESCE(rs.share_count, 0) as recent_shares,
        (COALESCE(rv.view_count, 0) * 1 + COALESCE(rs.share_count, 0) * 3) as trending_score
      FROM recipes r
      LEFT JOIN recent_views rv ON r.id = rv.recipe_id
      LEFT JOIN recent_shares rs ON r.id = rs.recipe_id
      WHERE (rv.view_count > 0 OR rs.share_count > 0)
      ORDER BY trending_score DESC
      LIMIT 20
    `);
    
    // Store trending results in cache or database for fast retrieval
    // This would involve updating a 'trending_recipes' table or cache
    console.log(`Found ${trendingRecipes.length} trending recipes`);
    
    // Store in memory cache
    global.trendingRecipes = trendingRecipes;
    
    return { success: true, count: trendingRecipes.length };
  } catch (error) {
    console.error('Error processing trending calculation:', error);
    throw error;
  }
}); 