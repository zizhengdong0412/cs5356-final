// Define ingredient structure
export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  notes?: string;
}

// Define instruction structure
export interface Instruction {
  step: number;
  text: string;
  time?: number;
}

export interface Recipe {
  id?: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  cookingTime: number | null;
  servings: number | null;
  notes: string;
  imageUrl: string;
  sourceUrl: string;
  type?: string;
  thumbnail?: string | null;
} 