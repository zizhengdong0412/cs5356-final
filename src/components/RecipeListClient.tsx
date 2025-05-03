"use client";
import { useState } from "react";
import RecipeCard from "./RecipeCard";

export default function RecipeListClient({ recipes: initialRecipes, badgeLabel }: {
  recipes: any[];
  badgeLabel?: string;
}) {
  const [recipes, setRecipes] = useState(initialRecipes);

  const handleDelete = (id: string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={{
            id: recipe.id,
            title: recipe.title ?? '',
            description: recipe.description ?? undefined,
            cookingTime: recipe.cooking_time ?? undefined,
            servings: recipe.servings ?? undefined,
            thumbnail: recipe.thumbnail ?? undefined,
            createdAt: typeof recipe.created_at === 'string' ? recipe.created_at : recipe.created_at?.toISOString?.() ?? ''
          }}
          canEdit={recipe.canEdit}
          canDelete={recipe.canDelete}
          onDelete={handleDelete}
          badgeLabel={badgeLabel}
        />
      ))}
    </div>
  );
} 