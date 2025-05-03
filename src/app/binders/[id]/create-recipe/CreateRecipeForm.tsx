'use client';

import { useRouter } from 'next/navigation';
import RecipeForm from '../../../../components/RecipeForm';
import { Recipe } from '../../../../types/recipe';

interface CreateRecipeFormProps {
  binderId: string;
  binderTitle: string;
}

export default function CreateRecipeForm({ binderId, binderTitle }: CreateRecipeFormProps) {
  const router = useRouter();

  const handleSubmit = async (formData: Recipe) => {
    const response = await fetch('/api/recipes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...formData,
        binderId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create recipe');
    }

    // First refresh the data
    router.refresh();
    // Then navigate back to the binder
    router.push(`/binders/${binderId}`);
  };

  return (
    <RecipeForm
      mode="create"
      onSubmit={handleSubmit}
      onCancel={() => router.push(`/binders/${binderId}`)}
      binderId={binderId}
    />
  );
} 