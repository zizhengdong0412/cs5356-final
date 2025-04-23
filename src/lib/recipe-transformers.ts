/**
 * Utility functions for transforming recipe data between database and frontend formats
 */

import { Recipe, Ingredient, Instruction } from './recipe-helpers';

/**
 * Transforms database recipe data to frontend Recipe format
 */
export function transformDatabaseRecipe(dbRecipe: any): Recipe {
  // Parse ingredients and instructions if they're strings that contain JSON
  let ingredientsData = [];
  let instructionsData = [];
  
  try {
    if (typeof dbRecipe.ingredients === 'string') {
      // Check if the string starts with '[' to determine if it's JSON
      if (dbRecipe.ingredients.trim().startsWith('[')) {
        ingredientsData = JSON.parse(dbRecipe.ingredients);
      } else {
        // Handle plain text ingredients by splitting by lines
        ingredientsData = dbRecipe.ingredients
          .split('\n')
          .filter((line: string) => line.trim())
          .map((line: string) => ({
            name: line.trim(),
            amount: 1,
            unit: '',
            notes: ''
          }));
      }
    } else {
      ingredientsData = dbRecipe.ingredients || [];
    }
  } catch (error) {
    console.error('Error parsing ingredients data:', error);
    // Fallback to using the raw string
    if (typeof dbRecipe.ingredients === 'string') {
      ingredientsData = dbRecipe.ingredients
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => ({
          name: line.trim(),
          amount: 1,
          unit: '',
          notes: ''
        }));
    } else {
      ingredientsData = [];
    }
  }
  
  try {
    if (typeof dbRecipe.instructions === 'string') {
      // Check if the string starts with '[' to determine if it's JSON
      if (dbRecipe.instructions.trim().startsWith('[')) {
        instructionsData = JSON.parse(dbRecipe.instructions);
      } else {
        // Handle plain text instructions by splitting by lines
        instructionsData = dbRecipe.instructions
          .split('\n')
          .filter((line: string) => line.trim())
          .map((line: string, index: number) => ({
            step: index + 1,
            text: line.trim()
          }));
      }
    } else {
      instructionsData = dbRecipe.instructions || [];
    }
  } catch (error) {
    console.error('Error parsing instructions data:', error);
    // Fallback to using the raw string
    if (typeof dbRecipe.instructions === 'string') {
      instructionsData = dbRecipe.instructions
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string, index: number) => ({
          step: index + 1,
          text: line.trim()
        }));
    } else {
      instructionsData = [];
    }
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
    updatedAt: dbRecipe.updated_at,
    thumbnail: dbRecipe.thumbnail
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