import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recipes, shared_recipes, users } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

// 根据共享码获取食谱详情
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    if (!params.code) {
      return NextResponse.json({ error: 'Share code is required' }, { status: 400 });
    }

    // 查找共享记录
    const share = await db
      .select({
        id: shared_recipes.id,
        recipeId: shared_recipes.recipe_id,
        ownerId: shared_recipes.owner_id,
        sharedWithId: shared_recipes.shared_with_id,
        permission: shared_recipes.permission,
        shareCode: shared_recipes.share_code,
        isActive: shared_recipes.is_active,
        createdAt: shared_recipes.created_at,
      })
      .from(shared_recipes)
      .where(
        and(
          eq(shared_recipes.share_code, params.code),
          eq(shared_recipes.is_active, true)
        )
      )
      .limit(1);

    if (share.length === 0) {
      return NextResponse.json({ error: 'Share not found or inactive' }, { status: 404 });
    }

    // 获取食谱详情
    const recipe = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, share[0].recipeId))
      .limit(1);

    if (recipe.length === 0) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // 获取分享者的信息
    const owner = await db
      .select({
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, share[0].ownerId))
      .limit(1);

    const ownerInfo = owner.length > 0 
      ? owner[0] 
      : { name: null, email: 'Unknown' };

    return NextResponse.json({ 
      recipe: recipe[0],
      share: {
        ...share[0],
        owner: ownerInfo
      }
    });
  } catch (error) {
    console.error('Error fetching shared recipe:', error);
    return NextResponse.json(
      { error: 'Error fetching shared recipe' },
      { status: 500 }
    );
  }
} 