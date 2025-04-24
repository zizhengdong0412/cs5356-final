'use server';

import { recipeImportQueue } from '../queue';
import { db } from '../db';
import { recipes } from '../schema';
import { TheMealDBService } from '../themealdb';
import { v4 as uuidv4 } from 'uuid';
import { sql } from 'drizzle-orm';

// Process recipe import jobs
recipeImportQueue.process(async (job) => {
  const { mealId, userId } = job.data;
  console.log(`Processing recipe import for meal ID: ${mealId}, user: ${userId}`);
  
  try {
    // Fetch recipe details from TheMealDB API
    const meal = await TheMealDBService.getMealById(mealId);
    
    if (!meal) {
      throw new Error(`Meal not found with ID: ${mealId}`);
    }
    
    // Extract ingredients and measures into structured format
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}` as keyof typeof meal];
      const measure = meal[`strMeasure${i}` as keyof typeof meal];
      
      if (ingredient && ingredient.trim() !== '') {
        ingredients.push({
          name: ingredient,
          amount: 1, // Default amount since TheMealDB doesn't provide numeric quantities
          unit: measure?.trim() || 'piece',
          notes: '',
        });
      }
    }
    
    // Convert instructions to structured format
    // Split by newlines or periods followed by a space
    const instructionSteps = meal.strInstructions
      .split(/\r?\n|\.\s+/)
      .filter(step => step.trim() !== '')
      .map((step, index) => ({
        step: index + 1,
        text: step.trim().endsWith('.') ? step.trim() : `${step.trim()}.`,
        time: null,
      }));
    
    // Create the recipe in the database
    const recipe = await db
      .insert(recipes)
      .values({
        user_id: userId,
        title: meal.strMeal,
        description: `${meal.strCategory} recipe from ${meal.strArea} cuisine`,
        ingredients: sql`${JSON.stringify(ingredients)}::jsonb`,
        instructions: sql`${JSON.stringify(instructionSteps)}::jsonb`,
        cooking_time: null, // Not provided by TheMealDB
        servings: null, // Not provided by TheMealDB
        type: 'external',
        image_url: meal.strMealThumb,
      })
      .returning();
    
    console.log(`Successfully imported recipe: ${meal.strMeal} (${recipe[0].id})`);
    
    return { 
      success: true, 
      recipeId: recipe[0].id,
      title: meal.strMeal
    };
  } catch (error) {
    console.error('Error processing recipe import:', error);
    throw error;
  }
}); 