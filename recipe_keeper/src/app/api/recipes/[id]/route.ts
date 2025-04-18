import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recipes } from '@/lib/schema';
import { authClient } from '@/lib/auth-client';
import { eq, and } from 'drizzle-orm';

// Get a single recipe by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: session } = await authClient.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recipeId = params.id;
    if (!recipeId) {
      return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 });
    }

    const recipe = await db
      .select()
      .from(recipes)
      .where(
        and(
          eq(recipes.id, recipeId),
          eq(recipes.userId, session.user.id)
        )
      )
      .limit(1);

    if (recipe.length === 0) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    return NextResponse.json(recipe[0]);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return NextResponse.json(
      { error: 'Error fetching recipe' },
      { status: 500 }
    );
  }
}

// Update a recipe
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: session } = await authClient.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recipeId = params.id;
    if (!recipeId) {
      return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 });
    }

    // Check if recipe exists and belongs to the user
    const existingRecipe = await db
      .select({ id: recipes.id })
      .from(recipes)
      .where(
        and(
          eq(recipes.id, recipeId),
          eq(recipes.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingRecipe.length === 0) {
      return NextResponse.json({ error: 'Recipe not found or not authorized to update' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, ingredients, instructions, cookingTime, servings } = body;

    // Validate required fields
    if (!title || !ingredients || !instructions) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update the recipe
    const updatedRecipe = await db
      .update(recipes)
      .set({
        title,
        description: description || '',
        ingredients,
        instructions,
        cookingTime: cookingTime ? parseInt(cookingTime) : null,
        servings: servings ? parseInt(servings) : null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(recipes.id, recipeId),
          eq(recipes.userId, session.user.id)
        )
      )
      .returning();

    return NextResponse.json(updatedRecipe[0]);
  } catch (error) {
    console.error('Error updating recipe:', error);
    return NextResponse.json(
      { error: 'Error updating recipe' },
      { status: 500 }
    );
  }
}

// Delete a recipe
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: session } = await authClient.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recipeId = params.id;
    if (!recipeId) {
      return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 });
    }

    // Delete the recipe if it belongs to the user
    const deletedRecipe = await db
      .delete(recipes)
      .where(
        and(
          eq(recipes.id, recipeId),
          eq(recipes.userId, session.user.id)
        )
      )
      .returning();

    if (deletedRecipe.length === 0) {
      return NextResponse.json({ error: 'Recipe not found or not authorized to delete' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return NextResponse.json(
      { error: 'Error deleting recipe' },
      { status: 500 }
    );
  }
} 