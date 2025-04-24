import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { getSessionFromCookie } from '@/lib/session-helper';
import { binders, binder_recipes, recipes } from '@/schema';

// Add recipe(s) to a binder
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromCookie();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const binderId = params.id;
    const { recipeIds } = await request.json();

    if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0) {
      return NextResponse.json({ error: "Recipe IDs are required" }, { status: 400 });
    }

    // Check if the binder exists and belongs to the user
    const binderCheck = await db
      .select()
      .from(binders)
      .where(
        and(
          eq(binders.id, binderId),
          eq(binders.user_id, session.user.id)
        )
      )
      .limit(1);

    if (binderCheck.length === 0) {
      return NextResponse.json({ error: "Binder not found" }, { status: 404 });
    }

    // Check if all recipes exist and belong to the user
    for (const recipeId of recipeIds) {
      const recipeCheck = await db
        .select()
        .from(recipes)
        .where(
          and(
            eq(recipes.id, recipeId),
            eq(recipes.user_id, session.user.id)
          )
        )
        .limit(1);

      if (recipeCheck.length === 0) {
        return NextResponse.json({ error: `Recipe with ID ${recipeId} not found` }, { status: 404 });
      }
    }

    // Add recipes to the binder
    const values = recipeIds.map(recipeId => ({
      binder_id: binderId,
      recipe_id: recipeId
    }));

    await db.insert(binder_recipes).values(values);

    // Update the binder's updated_at timestamp
    await db
      .update(binders)
      .set({ updated_at: new Date() })
      .where(eq(binders.id, binderId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding recipes to binder:", error);
    return NextResponse.json({ error: "Failed to add recipes to binder" }, { status: 500 });
  }
}

// Remove recipe from a binder
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromCookie();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const binderId = params.id;
    const { recipeId } = await request.json();

    if (!recipeId) {
      return NextResponse.json({ error: "Recipe ID is required" }, { status: 400 });
    }

    // Check if the binder exists and belongs to the user
    const binderCheck = await db
      .select()
      .from(binders)
      .where(
        and(
          eq(binders.id, binderId),
          eq(binders.user_id, session.user.id)
        )
      )
      .limit(1);

    if (binderCheck.length === 0) {
      return NextResponse.json({ error: "Binder not found" }, { status: 404 });
    }

    // Remove the recipe from the binder
    await db
      .delete(binder_recipes)
      .where(
        and(
          eq(binder_recipes.binder_id, binderId),
          eq(binder_recipes.recipe_id, recipeId)
        )
      );

    // Update the binder's updated_at timestamp
    await db
      .update(binders)
      .set({ updated_at: new Date() })
      .where(eq(binders.id, binderId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing recipe from binder:", error);
    return NextResponse.json({ error: "Failed to remove recipe from binder" }, { status: 500 });
  }
} 