'use server';

import { recipeRecommendationQueue } from '../queue';
import { db } from '../db';
import { recipes, users } from '../schema';
import { eq, desc, sql } from 'drizzle-orm';
import { sendEmail } from '../email-service';

// Process recipe recommendation jobs
recipeRecommendationQueue.process(async (job) => {
  const { userId } = job.data;
  console.log(`Processing recommendations for user: ${userId}`);
  
  try {
    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!user || !user.email) {
      throw new Error(`User not found or missing email: ${userId}`);
    }
    
    // Get most popular recipes (or customize algorithm as needed)
    const recommendedRecipes = await db
      .select({
        id: recipes.id,
        title: recipes.title,
        description: recipes.description,
        image: recipes.image_url,
      })
      .from(recipes)
      .orderBy(desc(recipes.view_count))
      .limit(5);
    
    // Send email with recommendations (mock implementation)
    await sendEmail({
      to: user.email,
      subject: 'Your Weekly Recipe Recommendations',
      html: `
        <h1>Your Weekly Recipe Recommendations</h1>
        <p>Here are some recipes we think you might enjoy:</p>
        <ul>
          ${recommendedRecipes.map(recipe => `
            <li>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/recipes/${recipe.id}">
                ${recipe.title}
              </a>
              ${recipe.description ? ` - ${recipe.description}` : ''}
            </li>
          `).join('')}
        </ul>
      `
    });
    
    console.log(`Recommendations sent to ${user.email}`);
    return { success: true, userId, recommendationCount: recommendedRecipes.length };
  } catch (error) {
    console.error('Error processing recommendation job:', error);
    throw error;
  }
}); 