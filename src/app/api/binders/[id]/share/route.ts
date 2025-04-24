import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { getSessionFromCookie } from '@/lib/session-helper';
import { binders, shared_binders, binderPermissionTypeEnum } from '@/schema';

// Share a binder with a user or via link
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
    const { sharedWithId, permission = 'view' } = await request.json();

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

    // Generate a random share code
    const shareCode = crypto.randomBytes(6).toString('hex');

    // Create the share record
    const [sharedBinder] = await db
      .insert(shared_binders)
      .values({
        binder_id: binderId,
        owner_id: session.user.id,
        shared_with_id: sharedWithId || null,
        permission: permission as typeof binderPermissionTypeEnum.enumValues[number],
        share_code: shareCode,
      })
      .returning();

    return NextResponse.json({ 
      sharedBinder,
      shareUrl: `/shared/binders/${shareCode}`
    });
  } catch (error) {
    console.error("Error sharing binder:", error);
    return NextResponse.json({ error: "Failed to share binder" }, { status: 500 });
  }
}

// Get all shares for a binder
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromCookie();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const binderId = params.id;

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

    // Get all shares for this binder
    const shares = await db
      .select()
      .from(shared_binders)
      .where(
        and(
          eq(shared_binders.binder_id, binderId),
          eq(shared_binders.is_active, true)
        )
      );

    return NextResponse.json({ shares });
  } catch (error) {
    console.error("Error fetching binder shares:", error);
    return NextResponse.json({ error: "Failed to fetch binder shares" }, { status: 500 });
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

    const binderId = params.id;
    const { shareId } = await request.json();

    if (!shareId) {
      return NextResponse.json({ error: "Share ID is required" }, { status: 400 });
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

    // Deactivate the share
    await db
      .update(shared_binders)
      .set({ is_active: false })
      .where(
        and(
          eq(shared_binders.id, shareId),
          eq(shared_binders.binder_id, binderId),
          eq(shared_binders.owner_id, session.user.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking binder share:", error);
    return NextResponse.json({ error: "Failed to revoke binder share" }, { status: 500 });
  }
} 