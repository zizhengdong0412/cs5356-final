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
    const session = await validateSessionFromCookie();
    const userId = session?.user?.id;
    let recipe = null;
    let sharedPermission = null;

    // Try to get as owner
    if (userId) {
      recipe = await db.query.recipes.findFirst({
        where: and(eq(recipes.id, params.id), eq(recipes.user_id, userId)),
      });
    }

    // If not owner, try to get as shared_with
    if (!recipe && userId) {
      const shared = await db.execute(sql`
        SELECT r.*, sr.permission
        FROM shared_recipes sr
        JOIN recipes r ON sr.recipe_id = r.id
        WHERE sr.recipe_id = ${params.id} AND sr.shared_with_id = ${userId} AND sr.is_active = true
        LIMIT 1
      `);
      if (shared.length > 0) {
        recipe = shared[0];
        sharedPermission = shared[0].permission;
      }
    }

    // If not owner or direct share, try to get via share_code (link sharing)
    if (!recipe) {
      const url = new URL(request.url);
      const shareCode = url.searchParams.get('shareCode');
      if (shareCode) {
        const shared = await db.execute(sql`
          SELECT r.*, sr.permission
          FROM shared_recipes sr
          JOIN recipes r ON sr.recipe_id = r.id
          WHERE sr.recipe_id = ${params.id} AND sr.share_code = ${shareCode} AND sr.is_active = true
          LIMIT 1
        `);
        if (shared.length > 0) {
          recipe = shared[0];
          sharedPermission = shared[0].permission;
        }
      }
    }

    // If not owner, direct share, or share link, check if recipe is in a binder shared with the user
    if (!recipe && userId) {
      const sharedBinder = await db.execute(sql`
        SELECT r.*
        FROM binder_recipes br
        JOIN shared_binders sb ON br.binder_id = sb.binder_id
        JOIN recipes r ON br.recipe_id = r.id
        WHERE br.recipe_id = ${params.id}
          AND sb.shared_with_id = ${userId}
          AND sb.is_active = true
          AND (sb.permission = 'view' OR sb.permission = 'edit' OR sb.permission = 'admin')
        LIMIT 1
      `);
      if (sharedBinder.length > 0) {
        recipe = sharedBinder[0];
        sharedPermission = sharedBinder[0].permission || 'view';
      }
    }

    if (!recipe) {
      return NextResponse.json(
        { error: 'You do not have access to this recipe' },
        { status: 403 }
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
      ...(sharedPermission ? { sharedPermission } : {}),
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
    let canEdit = false;
    if (session.user && existingRecipe.user_id === session.user.id) {
      canEdit = true;
    } else if (session.user) {
      // Check if user has edit or admin permission in shared_recipes
      const shared = await db.execute(sql`
        SELECT permission FROM shared_recipes
        WHERE recipe_id = ${params.id}
          AND shared_with_id = ${session.user.id}
          AND is_active = true
        LIMIT 1
      `);
      if (
        shared.length > 0 &&
        (shared[0].permission === 'edit' || shared[0].permission === 'admin')
      ) {
        canEdit = true;
      }
      // Check if user has edit/admin permission on a binder containing the recipe
      if (!canEdit) {
        const sharedBinder = await db.execute(sql`
          SELECT 1
          FROM binder_recipes br
          JOIN shared_binders sb ON br.binder_id = sb.binder_id
          WHERE br.recipe_id = ${params.id}
            AND sb.shared_with_id = ${session.user.id}
            AND sb.is_active = true
            AND (sb.permission = 'edit' OR sb.permission = 'admin')
          LIMIT 1
        `);
        if (sharedBinder.length > 0) {
          canEdit = true;
        }
      }
    }
    if (!canEdit) {
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
    let canDelete = false;
    if (session.user && existingRecipe.user_id === session.user.id) {
      canDelete = true;
    } else if (session.user) {
      // Check if user has admin permission in shared_recipes
      const shared = await db.execute(sql`
        SELECT permission FROM shared_recipes
        WHERE recipe_id = ${params.id}
          AND shared_with_id = ${session.user.id}
          AND is_active = true
        LIMIT 1
      `);
      if (shared.length > 0 && shared[0].permission === 'admin') {
        canDelete = true;
      }
      // Check if user has admin permission on a binder containing the recipe
      if (!canDelete) {
        const sharedBinder = await db.execute(sql`
          SELECT 1
          FROM binder_recipes br
          JOIN shared_binders sb ON br.binder_id = sb.binder_id
          WHERE br.recipe_id = ${params.id}
            AND sb.shared_with_id = ${session.user.id}
            AND sb.is_active = true
            AND sb.permission = 'admin'
          LIMIT 1
        `);
        if (sharedBinder.length > 0) {
          canDelete = true;
        }
      }
    }
    if (!canDelete) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this recipe' },
        { status: 403 }
      );
    }

    // First, delete all references in binder_recipes table
    await db.delete(binder_recipes)
      .where(eq(binder_recipes.recipe_id, params.id));

    // Then, delete all references in shared_recipes table
    await db.execute(sql`
      DELETE FROM shared_recipes WHERE recipe_id = ${params.id}
    `);

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
