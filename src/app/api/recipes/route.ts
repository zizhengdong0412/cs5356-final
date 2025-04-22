import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recipes } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { validateSessionFromCookie } from '@/lib/server-auth-helper';
import { z } from 'zod';

// Validation schemas
const ingredientSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required'),
  amount: z.number().positive('Amount must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  notes: z.string().optional(),
});

const instructionSchema = z.object({
  step: z.number().positive('Step number must be positive'),
  text: z.string().min(1, 'Instruction text is required'),
  time: z.number().positive('Time must be positive').optional(),
});

const recipeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().optional(),
  ingredients: z.array(ingredientSchema).min(1, 'At least one ingredient is required'),
  instructions: z.array(instructionSchema).min(1, 'At least one instruction is required'),
  cookingTime: z.string().optional().transform(val => val ? parseInt(val) : null),
  servings: z.string().optional().transform(val => val ? parseInt(val) : null),
  type: z.enum(['personal', 'external']).default('personal'),
});

export async function POST(request: Request) {
  try {
    // Log all cookies and headers for debugging
    const cookieHeader = request.headers.get('cookie');
    console.log('Request cookies header:', cookieHeader);
    
    // Try our server-side session validator
    const { isAuthenticated, user } = await validateSessionFromCookie();
    
    if (!isAuthenticated || !user) {
      console.log('No valid session found');
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'No valid session found, please sign in' 
      }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body against schema
    const validationResult = recipeSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid recipe data', details: validationResult.error.errors },
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

    console.log('Recipe data received:', body); // Log for debugging

    // Create recipe with validated data
    const recipe = await db
      .insert(recipes)
      .values({
        user_id: user.id,
        title,
        description: description || '',
        ingredients: JSON.stringify(ingredients),
        instructions: JSON.stringify(instructions),
        cooking_time: cookingTime,
        servings,
        type,
      })
      .returning();

    return NextResponse.json(recipe[0]);
  } catch (error) {
    console.error('Error creating recipe:', error);
    return NextResponse.json(
      { error: 'Error creating recipe' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Try our server-side session validator
    const { isAuthenticated, user } = await validateSessionFromCookie();
    
    if (!isAuthenticated || !user) {
      console.log('No valid session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If we have a valid session, get user's recipes
    console.log('Fetching recipes for user:', user.id);
    
    try {
      const userRecipes = await db
        .select()
        .from(recipes)
        .where(eq(recipes.user_id, user.id));

      // Return empty array if no recipes found
      return NextResponse.json(userRecipes || []);
    } catch (dbError) {
      console.error('Database error fetching recipes:', dbError);
      // Return empty array instead of error to prevent UI issues
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json(
      { error: 'Error fetching recipes' },
      { status: 500 }
    );
  }
} 