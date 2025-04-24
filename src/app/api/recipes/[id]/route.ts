import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recipes } from '@/lib/schema';
import { authClient } from '@/lib/auth-client';
import { eq, and, sql } from 'drizzle-orm';
import { sendEmail } from '@/lib/email'; // 👈 Added SendGrid utility
import { validateSessionFromCookie } from '@/lib/server-auth-helper';
import { z } from 'zod';
import { binder_recipes } from '@/schema';

// Validation schemas - same as in the /api/recipes/route.ts
const ingredientSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required'),
  amount: z.number().nonnegative('Amount must be zero or positive'),
  unit: z.string().min(1, 'Unit is required'),
  notes: z.string().optional(),
});

const instructionSchema = z.object({
  step: z.number().positive('Step number must be positive'),
  text: z.string().min(1, 'Instruction text is required'),
  time: z.number().nonnegative('Time must be zero or positive').optional(),
});

const recipeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().optional(),
  ingredients: z.array(ingredientSchema).min(1, 'At least one ingredient is required'),
  instructions: z.array(instructionSchema).min(1, 'At least one instruction is required'),
  cookingTime: z.number().nullable().optional(),
  servings: z.number().nullable().optional(),
  type: z.enum(['personal', 'external']).default('personal'),
});

// Get a single recipe by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recipe = await db.query.recipes.findFirst({
      where: eq(recipes.id, params.id),
    });

    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    // Parse JSON strings for ingredients and instructions
    let ingredientsData = [];
    let instructionsData = [];
    
    try {
      ingredientsData = typeof recipe.ingredients === 'string' 
        ? JSON.parse(recipe.ingredients) 
        : recipe.ingredients;
      
      instructionsData = typeof recipe.instructions === 'string'
        ? JSON.parse(recipe.instructions)
        : recipe.instructions;
    } catch (error) {
      console.error('Error parsing recipe data:', error);
    }

    // Format the recipe with parsed JSON data
    const formattedRecipe = {
      ...recipe,
      ingredients: ingredientsData,
      instructions: instructionsData,
    };

    return NextResponse.json(formattedRecipe);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Helper function for updating a recipe - used by both PUT and PATCH
async function updateRecipe(request: NextRequest, params: { id: string }) {
  try {
    // Validate user session
    const session = await validateSessionFromCookie();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch the recipe to check ownership
    const existingRecipe = await db.query.recipes.findFirst({
      where: eq(recipes.id, params.id),
    });

    if (!existingRecipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    // Check if the user is the owner of the recipe
    if (session.user && existingRecipe.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this recipe' },
        { status: 403 }
      );
    }

    // Parse the request body
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const validationResult = recipeSchema.safeParse(body);

    if (!validationResult.success) {
      console.error('Validation error:', JSON.stringify(validationResult.error.format(), null, 2));
      return NextResponse.json(
        { error: 'Invalid recipe data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { 
      title, 
      description, 
      ingredients, 
      instructions, 
      cookingTime, 
      servings, 
      type 
    } = validationResult.data;

    // Update the recipe with stringified JSON data
    await db.update(recipes)
      .set({
        title,
        description,
        ingredients: sql`${JSON.stringify(ingredients)}::json`,
        instructions: sql`${JSON.stringify(instructions)}::json`,
        cooking_time: cookingTime,
        servings,
        type,
        updated_at: new Date(),
      })
      .where(eq(recipes.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating recipe:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PUT to update a recipe (full replacement)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return updateRecipe(request, params);
}

// PATCH to update a recipe (partial update)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return updateRecipe(request, params);
}

// DELETE a recipe
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate user session
    const session = await validateSessionFromCookie();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch the recipe to check ownership
    const existingRecipe = await db.query.recipes.findFirst({
      where: eq(recipes.id, params.id),
    });

    if (!existingRecipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    // Check if the user is the owner of the recipe
    if (session.user && existingRecipe.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this recipe' },
        { status: 403 }
      );
    }

    // First, delete all references in binder_recipes table
    await db.delete(binder_recipes)
      .where(eq(binder_recipes.recipe_id, params.id));

    // Then delete the recipe itself
    await db.delete(recipes)
      .where(eq(recipes.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
