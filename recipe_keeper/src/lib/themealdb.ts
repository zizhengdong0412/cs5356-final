/**
 * Service for interacting with TheMealDB API
 * https://www.themealdb.com/api.php
 */

export type Meal = {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strTags: string | null;
  strYoutube: string | null;
  strIngredient1: string | null;
  strIngredient2: string | null;
  strIngredient3: string | null;
  strIngredient4: string | null;
  strIngredient5: string | null;
  strIngredient6: string | null;
  strIngredient7: string | null;
  strIngredient8: string | null;
  strIngredient9: string | null;
  strIngredient10: string | null;
  strIngredient11: string | null;
  strIngredient12: string | null;
  strIngredient13: string | null;
  strIngredient14: string | null;
  strIngredient15: string | null;
  strIngredient16: string | null;
  strIngredient17: string | null;
  strIngredient18: string | null;
  strIngredient19: string | null;
  strIngredient20: string | null;
  strMeasure1: string | null;
  strMeasure2: string | null;
  strMeasure3: string | null;
  strMeasure4: string | null;
  strMeasure5: string | null;
  strMeasure6: string | null;
  strMeasure7: string | null;
  strMeasure8: string | null;
  strMeasure9: string | null;
  strMeasure10: string | null;
  strMeasure11: string | null;
  strMeasure12: string | null;
  strMeasure13: string | null;
  strMeasure14: string | null;
  strMeasure15: string | null;
  strMeasure16: string | null;
  strMeasure17: string | null;
  strMeasure18: string | null;
  strMeasure19: string | null;
  strMeasure20: string | null;
  strSource: string | null;
  strImageSource: string | null;
  strCreativeCommonsConfirmed: string | null;
  dateModified: string | null;
};

export type MealResponse = {
  meals: Meal[] | null;
};

export class TheMealDBService {
  private static baseUrl = 'https://www.themealdb.com/api/json/v1/1';

  /**
   * Search for meals by name
   */
  static async searchMeals(query: string): Promise<Meal[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search.php?s=${encodeURIComponent(query)}`);
      const data: MealResponse = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error('Error searching meals:', error);
      return [];
    }
  }

  /**
   * Get a meal by ID
   */
  static async getMealById(id: string): Promise<Meal | null> {
    try {
      const response = await fetch(`${this.baseUrl}/lookup.php?i=${id}`);
      const data: MealResponse = await response.json();
      return data.meals?.[0] || null;
    } catch (error) {
      console.error('Error getting meal by ID:', error);
      return null;
    }
  }

  /**
   * Get a random meal
   */
  static async getRandomMeal(): Promise<Meal | null> {
    try {
      const response = await fetch(`${this.baseUrl}/random.php`);
      const data: MealResponse = await response.json();
      return data.meals?.[0] || null;
    } catch (error) {
      console.error('Error getting random meal:', error);
      return null;
    }
  }

  /**
   * Get meals by first letter
   */
  static async getMealsByFirstLetter(letter: string): Promise<Meal[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search.php?f=${letter}`);
      const data: MealResponse = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error('Error getting meals by first letter:', error);
      return [];
    }
  }

  /**
   * Get meals by ingredient
   */
  static async getMealsByIngredient(ingredient: string): Promise<Meal[]> {
    try {
      const response = await fetch(`${this.baseUrl}/filter.php?i=${encodeURIComponent(ingredient)}`);
      const data: MealResponse = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error('Error getting meals by ingredient:', error);
      return [];
    }
  }

  /**
   * Get meals by category
   */
  static async getMealsByCategory(category: string): Promise<Meal[]> {
    try {
      const response = await fetch(`${this.baseUrl}/filter.php?c=${encodeURIComponent(category)}`);
      const data: MealResponse = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error('Error getting meals by category:', error);
      return [];
    }
  }

  /**
   * Get meals by area
   */
  static async getMealsByArea(area: string): Promise<Meal[]> {
    try {
      const response = await fetch(`${this.baseUrl}/filter.php?a=${encodeURIComponent(area)}`);
      const data: MealResponse = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error('Error getting meals by area:', error);
      return [];
    }
  }

  /**
   * Get all categories
   */
  static async getCategories(): Promise<{ strCategory: string }[]> {
    try {
      const response = await fetch(`${this.baseUrl}/categories.php`);
      const data = await response.json();
      return data.categories || [];
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  /**
   * Get all areas
   */
  static async getAreas(): Promise<{ strArea: string }[]> {
    try {
      const response = await fetch(`${this.baseUrl}/list.php?a=list`);
      const data = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error('Error getting areas:', error);
      return [];
    }
  }

  /**
   * Get all ingredients
   */
  static async getIngredients(): Promise<{ strIngredient: string }[]> {
    try {
      const response = await fetch(`${this.baseUrl}/list.php?i=list`);
      const data = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error('Error getting ingredients:', error);
      return [];
    }
  }

  /**
   * Get latest meals (limited to 10)
   */
  static async getLatestMeals(): Promise<Meal[]> {
    try {
      // Since TheMealDB doesn't have a direct endpoint for latest meals,
      // we'll get a random selection of meals
      const promises = Array(10).fill(0).map(() => this.getRandomMeal());
      const meals = await Promise.all(promises);
      return meals.filter((meal): meal is Meal => meal !== null);
    } catch (error) {
      console.error('Error getting latest meals:', error);
      return [];
    }
  }
} 