import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { getSessionFromCookie } from '@/lib/session-helper';
import { binders, binder_recipes, recipes, shared_binders } from '@/schema';

// Get a shared binder by its share code
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const shareCode = params.code;

    // Find the share record
    const shareRecord = await db
      .select({
        share: shared_binders,
        binder: binders
      })
      .from(shared_binders)
      .innerJoin(binders, eq(shared_binders.binder_id, binders.id))
      .where(
        and(
          eq(shared_binders.share_code, shareCode),
          eq(shared_binders.is_active, true)
        )
      )
      .limit(1);

    if (shareRecord.length === 0) {
      return NextResponse.json({ error: "Shared binder not found" }, { status: 404 });
    }

    const { share, binder } = shareRecord[0];

    // Get all recipes in this binder
    const binderRecipes = await db
      .select({
        recipe: recipes
      })
      .from(binder_recipes)
      .innerJoin(recipes, eq(binder_recipes.recipe_id, recipes.id))
      .where(eq(binder_recipes.binder_id, binder.id));

    return NextResponse.json({
      binder,
      recipes: binderRecipes.map(br => br.recipe),
      permission: share.permission
    });
  } catch (error) {
    console.error("Error fetching shared binder:", error);
    return NextResponse.json({ error: "Failed to fetch shared binder" }, { status: 500 });
  }
} 