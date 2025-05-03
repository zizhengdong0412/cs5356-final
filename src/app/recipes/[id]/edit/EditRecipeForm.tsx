'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import RecipeForm from '../../../../components/RecipeForm';
import { Recipe } from '../../../../types/recipe';

interface EditRecipeFormProps {
  recipeId: string;
}

export default function EditRecipeForm({ recipeId }: EditRecipeFormProps) {
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await fetch(`/api/recipes/${recipeId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch recipe');
        }
        const data = await response.json();
        
        // Convert string values to numbers for cookingTime and servings
        const convertedRecipe: Recipe = {
          ...data,
          cookingTime: data.cookingTime ? Number(data.cookingTime) : null,
          servings: data.servings ? Number(data.servings) : null,
          // Ensure ingredients and instructions are properly formatted
          ingredients: data.ingredients.map((ing: any) => ({
            ...ing,
            amount: Number(ing.amount)
          })),
          instructions: data.instructions.map((inst: any) => ({
            ...inst,
            step: Number(inst.step),
            time: inst.time ? Number(inst.time) : undefined
          }))
        };
        
        setRecipe(convertedRecipe);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [recipeId]);

  const handleSubmit = async (formData: Recipe) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update recipe');
      }

      // First refresh the data
      router.refresh();
      // Then navigate back to the recipe page
      router.push(`/recipes/${recipeId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update recipe');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!recipe) {
    return <div>Recipe not found</div>;
  }

  return (
    <RecipeForm
      mode="edit"
      initialData={recipe}
      onSubmit={handleSubmit}
      onCancel={() => router.push(`/recipes/${recipeId}`)}
    />
  );
} 