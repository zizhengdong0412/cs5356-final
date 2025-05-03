import { NextRequest, NextResponse } from 'next/server';
import { and, eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { getSessionFromCookie } from '@/lib/session-helper';
import { binders, binder_recipes, shared_binders } from '@/schema';
import { sql } from 'drizzle-orm';

// Get all binders for the current user
export async function GET() {
  try {
    const session = await getSessionFromCookie();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use raw SQL to avoid schema mismatches
    const userBinders = await db.execute(sql`
      SELECT id, user_id, title, created_at, updated_at
      FROM binders
      WHERE user_id = ${session.user.id}
      ORDER BY updated_at DESC
    `);

    return NextResponse.json({ binders: userBinders });
  } catch (error) {
    console.error("Error fetching binders:", error);
    return NextResponse.json({ error: "Failed to fetch binders" }, { status: 500 });
  }
}

// Create a new binder
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Use raw SQL to avoid schema mismatches
    const result = await db.execute(sql`
      INSERT INTO binders (user_id, title, created_at, updated_at)
      VALUES (${session.user.id}, ${title}, NOW(), NOW())
      RETURNING id, user_id, title, created_at, updated_at
    `);

    const newBinder = result[0];

    return NextResponse.json({ binder: newBinder }, { status: 201 });
  } catch (error) {
    console.error("Error creating binder:", error);
    return NextResponse.json({ error: "Failed to create binder" }, { status: 500 });
  }
} 