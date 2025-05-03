"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function AddRecipesPage() {
  const router = useRouter();
  const params = useParams();
  const binderId = params?.id as string;
  const [recipes, setRecipes] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function fetchRecipes() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/binders/${binderId}/addable-recipes`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch recipes");
        const data = await res.json();
        setRecipes(data.recipes || []);
      } catch (e: any) {
        setError(e.message || "Error fetching recipes");
      } finally {
        setLoading(false);
      }
    }
    if (binderId) fetchRecipes();
  }, [binderId]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/binders/${binderId}/recipes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ recipeIds: Array.from(selected) })
      });
      if (!res.ok) throw new Error("Failed to add recipes");
      setSuccess("Recipes added to binder!");
      setSelected(new Set());
      router.refresh();
    } catch (e: any) {
      setError(e.message || "Error adding recipes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Add Existing Recipes to Binder</h1>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      {success && <div className="mb-4 text-green-600">{success}</div>}
      {loading && <div className="mb-4">Loading...</div>}
      <form onSubmit={e => { e.preventDefault(); handleAdd(); }}>
        <div className="space-y-2 mb-6">
          {recipes.length === 0 && !loading && <div>No recipes available to add.</div>}
          {recipes.map(recipe => (
            <label key={recipe.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.has(recipe.id)}
                onChange={() => toggleSelect(recipe.id)}
                className="form-checkbox"
              />
              <span>{recipe.title}</span>
            </label>
          ))}
        </div>
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          disabled={selected.size === 0 || loading}
        >
          Add to Binder
        </button>
      </form>
    </div>
  );
} 