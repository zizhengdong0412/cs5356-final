import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recipes } from '@/lib/schema';
import { binder_recipes, binders, shared_binders } from '@/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, sql } from 'drizzle-orm';
import { validateSessionFromCookie } from '@/lib/server-auth-helper';
import { z } from 'zod';

// Validation schemas
const ingredientSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required'),
  amount: z.number().nullable().default(1).transform(val => val || 1),
  unit: z.string().default(''),
  notes: z.string().optional(),
});

const instructionSchema = z.object({
  step: z.number().positive('Step number must be positive').optional(),
  text: z.string().min(1, 'Instruction text is required'),
  time: z.number().positive('Time must be positive').optional(),
});

const recipeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().optional().nullable(),
  ingredients: z.union([
    z.string().min(1, 'Ingredients are required'),
    z.array(ingredientSchema).min(1, 'At least one ingredient is required')
  ]),
  instructions: z.union([
    z.string().min(1, 'Instructions are required'),
    z.array(instructionSchema).min(1, 'At least one instruction is required')
  ]),
  cookingTime: z.union([
    z.string().optional().transform(val => val ? parseInt(val) : null),
    z.number().optional().nullable()
  ]),
  servings: z.union([
    z.string().optional().transform(val => val ? parseInt(val) : null),
    z.number().optional().nullable()
  ]),
  type: z.enum(['personal', 'external']).default('personal'),
  thumbnail: z.string().optional().nullable(),
  binderId: z.string().optional(), // Optional binder ID to add the recipe to
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
    console.log('Raw recipe data received:', body); // Log for debugging
    
    // Validate request body against schema
    const validationResult = recipeSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error('Validation errors:', validationResult.error.errors);
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
      type,
      thumbnail,
      binderId
    } = validationResult.data;

    console.log('Validated recipe data:', validationResult.data); // Log for debugging

    // If a binderId was provided, check permissions
    if (binderId) {
      // Check if user is owner of the binder
      const binderResults = await db
        .select()
        .from(binders)
        .where(eq(binders.id, binderId));
      let canAdd = false;
      if (binderResults.length > 0 && binderResults[0].user_id === user.id) {
        canAdd = true;
      } else {
        // Check shared_binders for edit/admin permission
        const sharedResults = await db
          .select()
          .from(shared_binders)
          .where(sql`binder_id = ${binderId} AND shared_with_id = ${user.id} AND is_active = true AND (permission = 'edit' OR permission = 'admin')`);
        if (sharedResults.length > 0) {
          canAdd = true;
        }
      }
      if (!canAdd) {
        return NextResponse.json({ error: 'You do not have permission to add recipes to this binder' }, { status: 403 });
      }
    }

    // Create recipe with validated data
    try {
      // Insert recipe and get the inserted record
      const recipe = await db
        .insert(recipes)
        .values({
          user_id: user.id,
          title,
          description: description || '',
          ingredients: typeof ingredients === 'string' 
            ? sql`${ingredients}::text` 
            : sql`${JSON.stringify(ingredients)}::jsonb`,
          instructions: typeof instructions === 'string'
            ? sql`${instructions}::text`
            : sql`${JSON.stringify(instructions)}::jsonb`,
          cooking_time: cookingTime,
          servings,
          type,
          thumbnail: thumbnail || null,
        } as any) // Use type assertion to bypass TypeScript error
        .returning();
      
      // If a binderId was provided, add the recipe to that binder
      if (binderId && recipe[0]) {
        const recipeId = recipe[0].id;
        
        // Add recipe to binder
        await db.insert(binder_recipes).values({
          binder_id: binderId,
          recipe_id: recipeId
        });
        
        console.log(`Added recipe ${recipeId} to binder ${binderId}`);
      }

      return NextResponse.json(recipe[0]);
    } catch (dbError) {
      console.error('Database error creating recipe:', dbError);
      return NextResponse.json(
        { error: 'Database error creating recipe', details: String(dbError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating recipe:', error);
    return NextResponse.json(
      { error: 'Error creating recipe', details: String(error) },
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