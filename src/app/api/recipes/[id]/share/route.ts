import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { getSessionFromCookie } from '@/lib/session-helper';
import { recipes, shared_recipes, permissionTypeEnum } from '@/schema';
import { users } from '@/lib/schema';

// Share a recipe with a user or via link
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromCookie();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recipeId = params.id;
    const { sharedWithId, permission = 'view', email } = await request.json();

    // Check if the recipe exists and belongs to the user
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
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Generate a random share code
    const shareCode = crypto.randomBytes(6).toString('hex');

    let resolvedSharedWithId = sharedWithId || null;
    // If email is provided, look up user by email
    if (email) {
      const userLookup = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (userLookup.length > 0) {
        resolvedSharedWithId = userLookup[0].id;
      } else {
        return NextResponse.json({ error: "User with this email not found" }, { status: 404 });
      }
    }

    // Create the share record
    const [sharedRecipe] = await db
      .insert(shared_recipes)
      .values({
        recipe_id: recipeId,
        owner_id: session.user.id,
        shared_with_id: resolvedSharedWithId,
        permission: permission as typeof permissionTypeEnum.enumValues[number],
        share_code: shareCode,
      })
      .returning();

    return NextResponse.json({ 
      sharedRecipe,
      shareUrl: `/shared/recipes/${shareCode}`
    });
  } catch (error) {
    console.error("Error sharing recipe:", error);
    return NextResponse.json({ error: "Failed to share recipe" }, { status: 500 });
  }
}

// Get all shares for a recipe
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromCookie();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recipeId = params.id;

    // Check if the recipe exists and belongs to the user
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
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Get all shares for this recipe
    const shares = await db
      .select()
      .from(shared_recipes)
      .where(
        and(
          eq(shared_recipes.recipe_id, recipeId),
          eq(shared_recipes.is_active, true)
        )
      );

    return NextResponse.json({ shares });
  } catch (error) {
    console.error("Error fetching recipe shares:", error);
    return NextResponse.json({ error: "Failed to fetch recipe shares" }, { status: 500 });
  }
}

// Revoke a share
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromCookie();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recipeId = params.id;
    const { shareId } = await request.json();

    if (!shareId) {
      return NextResponse.json({ error: "Share ID is required" }, { status: 400 });
    }

    // Check if the recipe exists and belongs to the user
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
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Deactivate the share
    await db
      .update(shared_recipes)
      .set({ is_active: false })
      .where(
        and(
          eq(shared_recipes.id, shareId),
          eq(shared_recipes.recipe_id, recipeId),
          eq(shared_recipes.owner_id, session.user.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking recipe share:", error);
    return NextResponse.json({ error: "Failed to revoke recipe share" }, { status: 500 });
  }
} 