import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recipes } from '@/lib/schema';
import { authClient } from '@/lib/auth-client';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const { data: session } = await authClient.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, ingredients, instructions, cookingTime, servings } = body;

    if (!title || !ingredients || !instructions) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const recipe = await db
      .insert(recipes)
      .values({
        id: uuidv4(),
        userId: session.user.id,
        title,
        description: description || '',
        ingredients,
        instructions,
        cookingTime: cookingTime ? parseInt(cookingTime) : null,
        servings: servings ? parseInt(servings) : null,
        type: 'personal',
      })
      .returning();

    return NextResponse.json(recipe[0]);
  } catch (error) {
    console.error('Error creating recipe:', error);
    return NextResponse.json(
      { error: 'Error creating recipe' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { data: session } = await authClient.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRecipes = await db
      .select()
      .from(recipes)
      .where(eq(recipes.userId, session.user.id))
      .orderBy(recipes.createdAt);

    return NextResponse.json(userRecipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json(
      { error: 'Error fetching recipes' },
      { status: 500 }
    );
  }
} 