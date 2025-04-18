import { NextRequest, NextResponse } from 'next/server';
import { authClient } from '@/lib/auth-client';
import { db } from '@/lib/db';
import { recipes } from '@/lib/schema';
import { TheMealDBService } from '@/lib/themealdb';

// Simple parser to extract basic recipe data from HTML content
const parseRecipeFromHtml = (html: string) => {
  try {
    // This is a very simple implementation - in a production app,
    // you would use a more robust HTML parser and apply heuristics
    // or machine learning for better extraction
    
    // Basic extraction using regex patterns
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i) || 
                       html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Imported Recipe';
    
    // Look for typical recipe sections - using multiline matching instead of /s flag
    const ingredientsMatch = html.match(/<section[^>]*ingredients[^>]*>([^]*?)<\/section>/i) ||
                             html.match(/<div[^>]*ingredients[^>]*>([^]*?)<\/div>/i) ||
                             html.match(/<ul[^>]*>([^]*?)<\/ul>/i);
    
    const instructionsMatch = html.match(/<section[^>]*instructions[^>]*>([^]*?)<\/section>/i) ||
                              html.match(/<div[^>]*instructions[^>]*>([^]*?)<\/div>/i) ||
                              html.match(/<ol[^>]*>([^]*?)<\/ol>/i);
    
    // Extract text from HTML
    const stripHtml = (html: string) => {
      return html.replace(/<[^>]*>/g, '\n')
                .replace(/\n{2,}/g, '\n')
                .trim();
    };
    
    const ingredients = ingredientsMatch 
      ? stripHtml(ingredientsMatch[1]) 
      : 'No ingredients found. Please edit this recipe.';
    
    const instructions = instructionsMatch
      ? stripHtml(instructionsMatch[1])
      : 'No instructions found. Please edit this recipe.';
    
    return {
      title,
      description: 'Imported recipe - please edit the description',
      ingredients,
      instructions,
    };
  } catch (error) {
    console.error('Error parsing HTML:', error);
    return {
      title: 'Imported Recipe',
      description: 'Imported recipe - please edit this',
      ingredients: 'No ingredients found. Please edit this recipe.',
      instructions: 'No instructions found. Please edit this recipe.',
    };
  }
};

export async function GET(request: NextRequest) {
  try {
    // Check auth
    const { data: session } = await authClient.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get search query from URL parameters
    const searchParams = request.nextUrl.searchParams;
    const searchQuery = searchParams.get('search');
    
    if (!searchQuery) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }
    
    // Search for meals using TheMealDBService
    const meals = await TheMealDBService.searchMeals(searchQuery);
    
    return NextResponse.json({ meals });
  } catch (error) {
    console.error('Error searching recipes:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check auth
    const { data: session } = await authClient.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    if (!body.url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }
    
    // Fetch the URL content
    try {
      const response = await fetch(body.url);
      
      if (!response.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch URL content' },
          { status: 400 }
        );
      }
      
      const html = await response.text();
      const parsedRecipe = parseRecipeFromHtml(html);
      
      return NextResponse.json(parsedRecipe);
    } catch (error) {
      console.error('Error fetching URL:', error);
      return NextResponse.json(
        { error: 'Failed to fetch or parse URL content' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in import route:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 