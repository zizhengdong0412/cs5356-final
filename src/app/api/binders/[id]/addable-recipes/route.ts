import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromCookie } from '@/lib/session-helper';
import { recipes, binder_recipes, shared_recipes } from '@/schema';
import { eq, and, sql, or } from 'drizzle-orm';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromCookie();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const binderId = params.id;

  // Get all recipe IDs already in the binder
  const inBinder = await db
    .select({ recipe_id: binder_recipes.recipe_id })
    .from(binder_recipes)
    .where(eq(binder_recipes.binder_id, binderId));
  const inBinderIds = inBinder.map(r => r.recipe_id);

  // Get recipes owned by the user
  const ownedRecipes = await db
    .select()
    .from(recipes)
    .where(eq(recipes.user_id, session.user.id));

  // Get recipes shared with the user
  const sharedRecipeIds = await db
    .select({ recipe_id: shared_recipes.recipe_id })
    .from(shared_recipes)
    .where(and(
      eq(shared_recipes.shared_with_id, session.user.id),
      eq(shared_recipes.is_active, true)
    ));
  const sharedIds = sharedRecipeIds.map(r => r.recipe_id);
  let sharedRecipes: any[] = [];
  if (sharedIds.length > 0) {
    const idList = sharedIds.map(id => `'${id}'`).join(',');
    sharedRecipes = await db
      .select()
      .from(recipes)
      .where(sql.raw(`${recipes.id.name} IN (${idList})`));
  }

  // Combine owned and shared recipes, filter out those already in the binder
  const allAddable = [...ownedRecipes, ...sharedRecipes].filter(
    r => !inBinderIds.includes(r.id)
  );

  return NextResponse.json({ recipes: allAddable });
} 