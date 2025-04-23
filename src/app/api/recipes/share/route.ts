import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recipes, shared_recipes, users } from '@/lib/schema';
import { validateSessionFromCookie } from '@/lib/server-auth-helper';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// 创建共享链接
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const { isAuthenticated, user } = await validateSessionFromCookie();
    
    if (!isAuthenticated || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 获取请求数据
    const body = await request.json();
    const { recipeId, permission, email } = body;
    
    if (!recipeId) {
      return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 });
    }

    if (!['view', 'edit', 'admin'].includes(permission)) {
      return NextResponse.json({ error: 'Invalid permission type' }, { status: 400 });
    }

    // 检查食谱是否存在且属于当前用户
    const recipeCheck = await db
      .select({ id: recipes.id })
      .from(recipes)
      .where(
        and(
          eq(recipes.id, recipeId),
          eq(recipes.user_id, user.id)
        )
      )
      .limit(1);

    if (recipeCheck.length === 0) {
      return NextResponse.json({ error: 'Recipe not found or not owned by user' }, { status: 404 });
    }

    // 生成唯一的共享码
    const shareCode = uuidv4().slice(0, 8);

    let sharedWithId = null;
    
    // 如果提供了邮箱，查找用户
    if (email) {
      const userLookup = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      if (userLookup.length > 0) {
        sharedWithId = userLookup[0].id;
      }
    }

    // 创建共享记录
    const shareResult = await db
      .insert(shared_recipes)
      .values({
        recipe_id: recipeId,
        owner_id: user.id,
        shared_with_id: sharedWithId,
        permission: permission,
        share_code: shareCode,
        is_active: true,
      })
      .returning();

    if (shareResult.length === 0) {
      return NextResponse.json({ error: 'Failed to create share' }, { status: 500 });
    }

    // 构建共享链接
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareLink = `${baseUrl}/shared/${shareCode}`;

    return NextResponse.json({
      success: true,
      share: {
        id: shareResult[0].id,
        shareCode,
        shareLink,
        permission,
        sharedWithEmail: email || null
      }
    });
  } catch (error) {
    console.error('Error creating recipe share:', error);
    return NextResponse.json(
      { error: 'Error creating recipe share' },
      { status: 500 }
    );
  }
}

// 获取食谱的共享记录
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const { isAuthenticated, user } = await validateSessionFromCookie();
    
    if (!isAuthenticated || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 获取查询参数
    const url = new URL(request.url);
    const recipeId = url.searchParams.get('recipeId');
    
    if (!recipeId) {
      return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 });
    }
    
    // 检查食谱是否存在且属于当前用户
    const recipeCheck = await db
      .select({ id: recipes.id })
      .from(recipes)
      .where(
        and(
          eq(recipes.id, recipeId),
          eq(recipes.user_id, user.id)
        )
      )
      .limit(1);

    if (recipeCheck.length === 0) {
      return NextResponse.json({ error: 'Recipe not found or not owned by user' }, { status: 404 });
    }
    
    // 获取食谱的所有共享记录
    const shares = await db
      .select({
        id: shared_recipes.id,
        recipeId: shared_recipes.recipe_id,
        sharedWithId: shared_recipes.shared_with_id,
        permission: shared_recipes.permission,
        shareCode: shared_recipes.share_code,
        isActive: shared_recipes.is_active,
        createdAt: shared_recipes.created_at,
      })
      .from(shared_recipes)
      .where(
        and(
          eq(shared_recipes.recipe_id, recipeId),
          eq(shared_recipes.owner_id, user.id),
          eq(shared_recipes.is_active, true)
        )
      );
    
    // 构建共享链接
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const sharesWithLinks = shares.map(share => ({
      ...share,
      shareLink: `${baseUrl}/shared/${share.shareCode}`
    }));
    
    return NextResponse.json({ shares: sharesWithLinks });
  } catch (error) {
    console.error('Error fetching recipe shares:', error);
    return NextResponse.json(
      { error: 'Error fetching recipe shares' },
      { status: 500 }
    );
  }
}

// 删除共享链接
export async function DELETE(request: NextRequest) {
  try {
    // 验证用户身份
    const { isAuthenticated, user } = await validateSessionFromCookie();
    
    if (!isAuthenticated || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 获取查询参数
    const url = new URL(request.url);
    const shareId = url.searchParams.get('shareId');
    
    if (!shareId) {
      return NextResponse.json({ error: 'Share ID is required' }, { status: 400 });
    }
    
    // 检查共享记录是否存在且属于当前用户
    const shareCheck = await db
      .select({ id: shared_recipes.id })
      .from(shared_recipes)
      .where(
        and(
          eq(shared_recipes.id, shareId),
          eq(shared_recipes.owner_id, user.id)
        )
      )
      .limit(1);

    if (shareCheck.length === 0) {
      return NextResponse.json({ error: 'Share not found or not owned by user' }, { status: 404 });
    }
    
    // 删除共享记录（将is_active设为false而不是实际删除）
    await db
      .update(shared_recipes)
      .set({ is_active: false, updated_at: new Date() })
      .where(eq(shared_recipes.id, shareId));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting recipe share:', error);
    return NextResponse.json(
      { error: 'Error deleting recipe share' },
      { status: 500 }
    );
  }
} 