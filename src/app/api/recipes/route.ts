import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recipes } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { validateSessionFromCookie } from '@/lib/server-auth-helper';

export async function POST(request: Request) {
  try {
    // Log all cookies and headers for debugging
    const cookieHeader = request.headers.get('cookie');
    console.log('Request cookies header:', cookieHeader);
    
    // Try our server-side session validator
    const { isAuthenticated, user } = await validateSessionFromCookie();
    
    if (!isAuthenticated || !user) {
      console.log('No valid session found');
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'No valid session found, please sign in' 
      }, { status: 401 });
    }

    const body = await request.json();
    // Extract fields with proper client-side names
    const { 
      title, 
      description, 
      ingredients, 
      instructions, 
      cookingTime, // Changed from cooking_time to match form field
      servings,
      type // This field exists in the form and now in DB too
    } = body;

    console.log('Recipe data received:', body); // Log for debugging

    if (!title || !ingredients || !instructions) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Now we can include the type field since it exists in the database
    const recipe = await db
      .insert(recipes)
      .values({
        user_id: user.id,
        title,
        description: description || '',
        ingredients,
        instructions,
        cooking_time: cookingTime ? parseInt(cookingTime) : null, // Map cookingTime to cooking_time
        servings: servings ? parseInt(servings) : null,
        type: type || 'personal', // Use the type from the form or default to 'personal'
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
    // Try our server-side session validator
    const { isAuthenticated, user } = await validateSessionFromCookie();
    
    if (!isAuthenticated || !user) {
      console.log('No valid session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If we have a valid session, get user's recipes
    console.log('Fetching recipes for user:', user.id);
    
    try {
      const userRecipes = await db
        .select()
        .from(recipes)
        .where(eq(recipes.user_id, user.id));

      // Return empty array if no recipes found
      return NextResponse.json(userRecipes || []);
    } catch (dbError) {
      console.error('Database error fetching recipes:', dbError);
      // Return empty array instead of error to prevent UI issues
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json(
      { error: 'Error fetching recipes' },
      { status: 500 }
    );
  }
} 