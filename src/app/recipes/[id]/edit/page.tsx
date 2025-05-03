import { Suspense } from 'react';
import EditRecipeForm from './EditRecipeForm';

export default function EditRecipePage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Edit Recipe</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <EditRecipeForm recipeId={params.id} />
      </Suspense>
    </div>
  );
} 