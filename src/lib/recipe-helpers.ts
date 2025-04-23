import { z } from 'zod';

// Define the schema for structured recipe data
export const ingredientSchema = z.object({
  name: z.string(),
  amount: z.number(),
  unit: z.string(),
  notes: z.string().optional(),
});

export const instructionSchema = z.object({
  step: z.number().optional(),
  text: z.string(),
  time: z.number().optional(),
});

export const recipeDisplaySchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  type: z.string().optional(),
  ingredients: z.array(ingredientSchema),
  instructions: z.array(instructionSchema),
  description: z.string().optional(),
  cookingTime: z.number().optional(),
  servings: z.number().optional(),
  userId: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  thumbnail: z.string().optional(),
});

export type Ingredient = z.infer<typeof ingredientSchema>;
export type Instruction = z.infer<typeof instructionSchema>;
export type Recipe = z.infer<typeof recipeDisplaySchema>;

/**
 * Parses a raw ingredient string into structured format
 * Example: "2 cups flour, sifted" -> { amount: 2, unit: "cups", name: "flour", notes: "sifted" }
 */
export function parseIngredient(raw: string): Ingredient {
  // Regular expression to match amount, unit, ingredient name, and optional notes
  const regex = /^(?:(\d+(?:\.\d+)?)\s+)?(\w+\s+)?([^,]+)(?:,\s*(.+))?$/;
  const match = raw.trim().match(regex);

  if (!match) {
    // If no match, treat the whole string as the ingredient name
    return {
      amount: 1,
      unit: '',
      name: raw.trim(),
    };
  }

  const [, amount, unit, name, notes] = match;
  
  return {
    amount: amount ? parseFloat(amount) : 1,
    unit: (unit || '').trim(),
    name: name.trim(),
    ...(notes && { notes: notes.trim() }),
  };
}

/**
 * Parses raw instructions string into structured format
 * Tries to extract time information from instructions if present
 */
export function parseInstructions(raw: string): Instruction[] {
  return raw.split('\n')
    .map((text, index) => {
      const instruction: Instruction = {
        step: index + 1,
        text: text.trim(),
      };

      // Try to extract time information if present
      const timeMatch = text.match(/(\d+)\s*(?:minute|min|minutes)/i);
      if (timeMatch) {
        instruction.time = parseInt(timeMatch[1], 10);
      }

      return instruction;
    })
    .filter(instruction => instruction.text.length > 0);
}

/**
 * Formats a recipe for display, ensuring numbers are properly typed
 */
export function formatRecipeForDisplay(recipe: Recipe): Recipe {
  return {
    ...recipe,
    ingredients: recipe.ingredients.map(ingredient => ({
      ...ingredient,
      amount: Number(ingredient.amount)
    })),
    instructions: recipe.instructions.map(instruction => ({
      ...instruction,
      time: instruction.time ? Number(instruction.time) : undefined
    }))
  };
}

/**
 * Formats a raw recipe input into a structured Recipe object
 */
export function formatRawRecipeInput(recipe: {
  title: string;
  type?: string;
  ingredients: string;
  instructions: string;
  description?: string;
  cookingTime?: number | null;
  servings?: number | null;
}): Omit<Recipe, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
  return {
    title: recipe.title,
    type: recipe.type,
    ingredients: recipe.ingredients.split('\n')
      .map(parseIngredient)
      .filter(ingredient => ingredient.name.length > 0),
    instructions: parseInstructions(recipe.instructions),
    description: recipe.description,
    cookingTime: recipe.cookingTime || undefined,
    servings: recipe.servings || undefined,
  };
} 