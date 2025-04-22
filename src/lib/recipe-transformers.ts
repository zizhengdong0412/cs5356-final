/**
 * Utility functions for transforming recipe data between database and frontend formats
 */

import { Recipe, Ingredient, Instruction } from './recipe-helpers';

/**
 * Transforms database recipe data to frontend Recipe format
 */
export function transformDatabaseRecipe(dbRecipe: any): Recipe {
  // Parse ingredients and instructions if they're strings
  let ingredientsData = [];
  let instructionsData = [];
  
  try {
    ingredientsData = typeof dbRecipe.ingredients === 'string' 
      ? JSON.parse(dbRecipe.ingredients) 
      : dbRecipe.ingredients;
  } catch (error) {
    console.error('Error parsing ingredients data:', error);
    ingredientsData = [];
  }
  
  try {
    instructionsData = typeof dbRecipe.instructions === 'string'
      ? JSON.parse(dbRecipe.instructions)
      : dbRecipe.instructions;
  } catch (error) {
    console.error('Error parsing instructions data:', error);
    instructionsData = [];
  }

  return {
    id: dbRecipe.id,
    title: dbRecipe.title,
    type: dbRecipe.type,
    description: dbRecipe.description || undefined,
    ingredients: ingredientsData,
    instructions: instructionsData,
    cookingTime: dbRecipe.cooking_time || undefined,
    servings: dbRecipe.servings || undefined,
    userId: dbRecipe.user_id,
    createdAt: dbRecipe.created_at,
    updatedAt: dbRecipe.updated_at
  };
}

/**
 * Deeply parses potential JSON strings in a recipe object
 * This can handle arrays of objects where elements might be stringified JSON
 */
export function parseRecipeJsonData(recipe: Recipe): Recipe {
  // Create a new recipe object to avoid mutating the original
  const parsedRecipe: Recipe = {
    ...recipe,
    ingredients: recipe.ingredients.map((ingredient: Ingredient | string) => {
      if (typeof ingredient === 'string') {
        try {
          return JSON.parse(ingredient);
        } catch (e) {
          return { name: ingredient, amount: 0, unit: '' };
        }
      }
      return ingredient;
    }),
    instructions: recipe.instructions.map((instruction: Instruction | string) => {
      if (typeof instruction === 'string') {
        try {
          return JSON.parse(instruction);
        } catch (e) {
          return { text: instruction };
        }
      }
      return instruction;
    })
  };

  return parsedRecipe;
} 