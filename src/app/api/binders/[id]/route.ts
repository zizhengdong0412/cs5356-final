import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { eq, and } from 'drizzle-orm/expressions';
import { binders } from '@/lib/db/schema/binders';
import { auth } from '@/lib/auth';
import { validateSession } from '@/lib/session-helper';

// Get a single binder with its recipes
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await validateSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const binderId = params.id;

  // Get binder details
  const binderResults = await db.execute(sql`
    SELECT id, user_id, title, description, created_at, updated_at
    FROM binders
    WHERE id = ${binderId} AND user_id = ${session.user.id}
    LIMIT 1
  `);

  if (binderResults.length === 0) {
    return NextResponse.json(
      { error: 'Binder not found or unauthorized' },
      { status: 404 }
    );
  }

  const binder = binderResults[0];

  // Get all recipes in this binder
  const recipesResults = await db.execute(sql`
    SELECT r.id, r.title, r.description, r.cooking_time, r.servings, r.thumbnail, r.created_at
    FROM recipes r
    JOIN binder_recipes br ON br.recipe_id = r.id
    WHERE br.binder_id = ${binderId}
    ORDER BY br.added_at DESC
  `);

  return NextResponse.json({
    binder,
    recipes: recipesResults
  });
}

// Update a binder
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await validateSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const binderId = params.id;
  
  try {
    const body = await request.json();
    const { title, description } = body;

    // Ensure binder exists and belongs to user
    const binderResults = await db.execute(sql`
      SELECT id
      FROM binders
      WHERE id = ${binderId} AND user_id = ${session.user.id}
      LIMIT 1
    `);

    if (binderResults.length === 0) {
      return NextResponse.json(
        { error: 'Binder not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update binder
    await db.execute(sql`
      UPDATE binders
      SET 
        title = ${title},
        description = ${description},
        updated_at = NOW()
      WHERE id = ${binderId}
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating binder:', error);
    return NextResponse.json(
      { error: 'Failed to update binder' },
      { status: 500 }
    );
  }
}

// Delete a binder
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await validateSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const binderId = params.id;

  try {
    // Ensure binder exists and belongs to user
    const binderResults = await db.execute(sql`
      SELECT id
      FROM binders
      WHERE id = ${binderId} AND user_id = ${session.user.id}
      LIMIT 1
    `);

    if (binderResults.length === 0) {
      return NextResponse.json(
        { error: 'Binder not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete binder recipes first
    await db.execute(sql`
      DELETE FROM binder_recipes
      WHERE binder_id = ${binderId}
    `);

    // Delete shared binders
    await db.execute(sql`
      DELETE FROM shared_binders
      WHERE binder_id = ${binderId}
    `);

    // Delete binder
    await db.execute(sql`
      DELETE FROM binders
      WHERE id = ${binderId} AND user_id = ${session.user.id}
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting binder:', error);
    return NextResponse.json(
      { error: 'Failed to delete binder' },
      { status: 500 }
    );
  }
} 