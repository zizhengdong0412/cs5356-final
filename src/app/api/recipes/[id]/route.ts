import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recipes } from '@/lib/schema';
import { authClient } from '@/lib/auth-client';
import { eq, and } from 'drizzle-orm';
import { sendEmail } from '@/lib/email'; // 👈 Added SendGrid utility
import { validateSessionFromCookie } from '@/lib/server-auth-helper';

// Get a single recipe by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 使用服务端 session 验证方式，更可靠
    const { isAuthenticated, user } = await validateSessionFromCookie();
    
    if (!isAuthenticated || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recipeId = params.id;
    if (!recipeId) {
      return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 });
    }

    // 确保 user.id 存在
    if (!user.id) {
      console.error('User id is missing in the session');
      return NextResponse.json({ error: 'User session is invalid' }, { status: 401 });
    }

    console.log(`Fetching recipe ${recipeId} for user ${user.id}`);

    const recipe = await db
      .select()
      .from(recipes)
      .where(
        and(
          eq(recipes.id, recipeId),
          eq(recipes.user_id, user.id)
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
    // 使用服务端 session 验证方式
    const { isAuthenticated, user } = await validateSessionFromCookie();
    
    if (!isAuthenticated || !user) {
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
          eq(recipes.user_id, user.id)
        )
      )
      .limit(1);

    if (existingRecipe.length === 0) {
      return NextResponse.json({ error: 'Recipe not found or not authorized to update' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, ingredients, instructions, cookingTime, servings, type } = body;

    if (!title || !ingredients || !instructions) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const updatedRecipe = await db
      .update(recipes)
      .set({
        title,
        description: description || '',
        ingredients,
        instructions,
        cooking_time: cookingTime ? parseInt(cookingTime) : null,
        servings: servings ? parseInt(servings) : null,
        type: type || 'personal', // Ensure type is updated
        updated_at: new Date(),
      })
      .where(
        and(
          eq(recipes.id, recipeId),
          eq(recipes.user_id, user.id)
        )
      )
      .returning();

    // Try to send email but don't block if it fails
    try {
      // Only send email if SENDGRID_API_KEY is configured
      if (process.env.SENDGRID_API_KEY) {
        await sendEmail({
          to: user.email,
          subject: "🍳 Recipe Updated!",
          text: `Your recipe "${title}" was updated successfully.`,
        });
      }
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // Don't fail the request due to email error
    }

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
    // 使用服务端 session 验证方式
    const { isAuthenticated, user } = await validateSessionFromCookie();
    
    if (!isAuthenticated || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recipeId = params.id;
    if (!recipeId) {
      return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 });
    }

    const deletedRecipe = await db
      .delete(recipes)
      .where(
        and(
          eq(recipes.id, recipeId),
          eq(recipes.user_id, user.id)
        )
      )
      .returning();

    if (deletedRecipe.length === 0) {
      return NextResponse.json({ error: 'Recipe not found or not authorized to delete' }, { status: 404 });
    }

    // Try to send email but don't block if it fails
    try {
      // Only send email if SENDGRID_API_KEY is configured
      if (process.env.SENDGRID_API_KEY) {
        await sendEmail({
          to: user.email,
          subject: "🗑️ Recipe Deleted",
          text: `Your recipe "${deletedRecipe[0].title}" has been deleted.`,
        });
      }
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // Don't fail the request due to email error
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
