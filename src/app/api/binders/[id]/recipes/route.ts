import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { getSessionFromCookie } from '@/lib/session-helper';
import { binders, binder_recipes, recipes, shared_binders, shared_recipes } from '@/schema';

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

    // Check if the binder exists and check permissions
    let canEdit = false;

    // Check if user is owner
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

    if (binderCheck.length > 0) {
      canEdit = true;
    } else {
      // Check shared permissions
      const sharedCheck = await db
        .select()
        .from(shared_binders)
        .where(
          and(
            eq(shared_binders.binder_id, binderId),
            eq(shared_binders.shared_with_id, session.user.id),
            eq(shared_binders.is_active, true)
          )
        )
        .limit(1);

      if (sharedCheck.length > 0) {
        const permission = sharedCheck[0].permission;
        if (permission === 'edit' || permission === 'admin') {
          canEdit = true;
        }
      }
    }

    if (!canEdit) {
      return NextResponse.json({ error: "You do not have permission to modify this binder" }, { status: 403 });
    }

    // Check if all recipes exist and belong to the user
    const recipeIdsToAdd = [];
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

      if (recipeCheck.length > 0) {
        // User owns the recipe, add as is
        recipeIdsToAdd.push(recipeId);
      } else {
        // Try to find a recipe shared with the user
        const sharedRecipe = await db
          .select()
          .from(shared_recipes)
          .where(
            and(
              eq(shared_recipes.recipe_id, recipeId),
              eq(shared_recipes.shared_with_id, session.user.id),
              eq(shared_recipes.is_active, true)
            )
          )
          .limit(1);
        if (sharedRecipe.length > 0) {
          // Clone the recipe as the user's own
          const originalRecipe = await db
            .select()
            .from(recipes)
            .where(eq(recipes.id, recipeId))
            .limit(1);
          if (originalRecipe.length > 0) {
            const r = originalRecipe[0];
            const insertResult = await db.insert(recipes).values({
              user_id: session.user.id,
              title: r.title,
              description: r.description,
              ingredients: r.ingredients,
              instructions: r.instructions,
              cooking_time: r.cooking_time,
              servings: r.servings,
              type: r.type,
              thumbnail: r.thumbnail,
            }).returning();
            recipeIdsToAdd.push(insertResult[0].id);
          } else {
            return NextResponse.json({ error: `Original recipe with ID ${recipeId} not found` }, { status: 404 });
          }
        } else {
          return NextResponse.json({ error: `Recipe with ID ${recipeId} not found or not accessible` }, { status: 404 });
        }
      }
    }

    // Add recipes to the binder
    const values = recipeIdsToAdd.map(recipeId => ({
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

    // Check if the binder exists and check permissions
    let canEdit = false;

    // Check if user is owner
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

    if (binderCheck.length > 0) {
      canEdit = true;
    } else {
      // Check shared permissions
      const sharedCheck = await db
        .select()
        .from(shared_binders)
        .where(
          and(
            eq(shared_binders.binder_id, binderId),
            eq(shared_binders.shared_with_id, session.user.id),
            eq(shared_binders.is_active, true)
          )
        )
        .limit(1);

      if (sharedCheck.length > 0) {
        const permission = sharedCheck[0].permission;
        if (permission === 'edit' || permission === 'admin') {
          canEdit = true;
        }
      }
    }

    if (!canEdit) {
      return NextResponse.json({ error: "You do not have permission to modify this binder" }, { status: 403 });
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