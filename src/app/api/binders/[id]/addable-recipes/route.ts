import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromCookie } from '@/lib/session-helper';
import { recipes, binder_recipes } from '@/schema';
import { eq, and, sql } from 'drizzle-orm';

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

  let addableRecipes;
  if (inBinderIds.length > 0) {
    // Inject UUIDs directly as a comma-separated list
    const idList = inBinderIds.map(id => `'${id}'`).join(',');
    addableRecipes = await db
      .select()
      .from(recipes)
      .where(
        and(
          eq(recipes.user_id, session.user.id),
          sql.raw(`${recipes.id.name} NOT IN (${idList})`)
        )
      );
  } else {
    addableRecipes = await db
      .select()
      .from(recipes)
      .where(eq(recipes.user_id, session.user.id));
  }

  return NextResponse.json({ recipes: addableRecipes });
} 