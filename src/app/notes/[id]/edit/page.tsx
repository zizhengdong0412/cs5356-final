'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { transformDatabaseRecipe } from '@/lib/recipe-transformers';
import { Ingredient, Instruction } from '@/lib/recipe-helpers';

interface Note {
  id: string;
  title: string;
  description: string;
  ingredients: Ingredient[] | string;
  instructions: Instruction[] | string;
  cooking_time: number | null;
  servings: number | null;
  type: string;
  created_at: string;
  updated_at: string;
}

const MEASUREMENT_UNITS = [
  'g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'oz', 'lb', 'piece', 'pinch'
] as const;

export default function EditNotePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    ingredients?: string;
    instructions?: string;
  }>({});

  // Structured ingredients and instructions
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', amount: 0, unit: 'g' }
  ]);
  
  const [instructions, setInstructions] = useState<Instruction[]>([
    { step: 1, text: '' }
  ]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cookingTime: '',
    servings: '',
    type: 'personal', // default to personal
  });

  useEffect(() => {
    const fetchNote = async () => {
      try {
        // 先检查用户会话
        const { data: session } = await authClient.getSession();
        
        if (!session?.user) {
          console.log("No valid session found in edit page");
          setError("Please sign in to edit this note");
          setLoading(false);
          return;
        }

        // 有了有效的会话，现在尝试获取笔记数据
        const response = await fetch(`/api/recipes/${params.id}`, {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError('Note not found');
          } else {
            const data = await response.json();
            setError(data.error || 'Failed to fetch note');
          }
          return;
        }

        const data = await response.json();
        setNote(data);

        // Parse ingredients and instructions if they're JSON strings
        let parsedIngredients: Ingredient[] = [];
        let parsedInstructions: Instruction[] = [];

        try {
          // Handle ingredients parsing
          if (typeof data.ingredients === 'string') {
            if (data.ingredients.startsWith('[')) {
              // It's a JSON string
              parsedIngredients = JSON.parse(data.ingredients);
            } else {
              // It's a plain text string, convert to structured format
              parsedIngredients = data.ingredients.split('\n')
                .filter(line => line.trim())
                .map((line, index) => ({
                  name: line.trim(),
                  amount: 1,
                  unit: '',
                }));
            }
          } else if (Array.isArray(data.ingredients)) {
            parsedIngredients = data.ingredients;
          }

          // Handle instructions parsing
          if (typeof data.instructions === 'string') {
            if (data.instructions.startsWith('[')) {
              // It's a JSON string
              parsedInstructions = JSON.parse(data.instructions);
            } else {
              // It's a plain text string, convert to structured format
              parsedInstructions = data.instructions.split('\n')
                .filter(line => line.trim())
                .map((line, index) => ({
                  step: index + 1,
                  text: line.trim(),
                }));
            }
          } else if (Array.isArray(data.instructions)) {
            parsedInstructions = data.instructions;
          }
        } catch (err) {
          console.error('Error parsing JSON data:', err);
          // If parsing fails, set default empty arrays
          parsedIngredients = [{ name: '', amount: 0, unit: 'g' }];
          parsedInstructions = [{ step: 1, text: '' }];
        }

        // Set the structured data
        setIngredients(parsedIngredients.length ? parsedIngredients : [{ name: '', amount: 0, unit: 'g' }]);
        setInstructions(parsedInstructions.length ? parsedInstructions : [{ step: 1, text: '' }]);
        
        setFormData({
          title: data.title || '',
          description: data.description || '',
          cookingTime: data.cooking_time ? String(data.cooking_time) : '',
          servings: data.servings ? String(data.servings) : '',
          type: data.type || 'personal',
        });
      } catch (err) {
        console.error('Error fetching note:', err);
        setError('An error occurred while fetching the note');
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [params.id, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error when user starts typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // Handle ingredient changes
  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string | number) => {
    setIngredients(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: field === 'amount' ? Number(value) : value
      };
      return updated;
    });

    // Clear validation error
    if (formErrors.ingredients) {
      setFormErrors((prev) => ({
        ...prev,
        ingredients: undefined,
      }));
    }
  };

  // Handle instruction changes
  const handleInstructionChange = (index: number, field: keyof Instruction, value: string | number) => {
    setInstructions(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: field === 'step' || field === 'time' ? Number(value) : value
      };
      return updated;
    });

    // Clear validation error
    if (formErrors.instructions) {
      setFormErrors((prev) => ({
        ...prev,
        instructions: undefined,
      }));
    }
  };

  // Add/remove ingredient functions
  const addIngredient = () => {
    setIngredients(prev => [
      ...prev,
      { name: '', amount: 0, unit: 'g' }
    ]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length <= 1) return;
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  // Add/remove instruction functions
  const addInstruction = () => {
    setInstructions(prev => [
      ...prev,
      { step: prev.length + 1, text: '' }
    ]);
  };

  const removeInstruction = (index: number) => {
    if (instructions.length <= 1) return;
    setInstructions(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      // Reorder steps
      return filtered.map((inst, i) => ({ ...inst, step: i + 1 }));
    });
  };

  const validateForm = () => {
    const errors: {
      title?: string;
      ingredients?: string;
      instructions?: string;
    } = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (ingredients.length === 0 || ingredients.every(i => !i.name.trim())) {
      errors.ingredients = 'At least one ingredient is required';
    }

    if (instructions.length === 0 || instructions.every(i => !i.text.trim())) {
      errors.instructions = 'At least one instruction is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Filter out empty ingredients and instructions
      const validIngredients = ingredients.filter(i => i.name.trim());
      const validInstructions = instructions.filter(i => i.text.trim());

      const response = await fetch(`/api/recipes/${params.id}`, {
        method: 'PATCH', // Use PATCH instead of PUT
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          ingredients: validIngredients,
          instructions: validInstructions,
          cookingTime: formData.cookingTime || null,
          servings: formData.servings || null,
          type: formData.type,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update note');
      }

      // Redirect to note details page
      router.push(`/notes/${params.id}`);
    } catch (err) {
      console.error('Error updating note:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to update note'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          
          {error === "Please sign in to edit this note" ? (
            <div className="space-y-4">
              <p className="text-gray-600">You need to be signed in to edit this note.</p>
              <Link 
                href="/auth/sign-in" 
                className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
            </div>
          ) : (
            <Link 
              href="/dashboard" 
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Return to Dashboard
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Edit Note</h1>
          <Link
            href={`/notes/${params.id}`}
            className="text-blue-500 hover:text-blue-600 font-medium flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Cancel
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                id="title"
                required
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                value={formData.title}
                onChange={handleChange}
              />
              {formErrors.title && <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            {/* Ingredients section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Ingredients <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addIngredient}
                  className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                >
                  + Add Ingredient
                </button>
              </div>
              <div className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Ingredient name"
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={ingredient.name}
                      onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={ingredient.amount || ''}
                      onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                      min="0"
                      step="0.1"
                    />
                    <select
                      className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={ingredient.unit}
                      onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                    >
                      {MEASUREMENT_UNITS.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Notes"
                      className="w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={ingredient.notes || ''}
                      onChange={(e) => handleIngredientChange(index, 'notes', e.target.value)}
                    />
                    {ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {formErrors.ingredients && (
                <p className="mt-1 text-sm text-red-600">{formErrors.ingredients}</p>
              )}
            </div>

            {/* Instructions section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Instructions <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addInstruction}
                  className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                >
                  + Add Step
                </button>
              </div>
              <div className="space-y-3">
                {instructions.map((instruction, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="mt-2 text-gray-500 text-sm">
                      {instruction.step}.
                    </span>
                    <div className="flex-1">
                      <textarea
                        placeholder="Instruction step"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={instruction.text}
                        onChange={(e) => handleInstructionChange(index, 'text', e.target.value)}
                        rows={2}
                      />
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="Time (minutes)"
                          className="w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          value={instruction.time || ''}
                          onChange={(e) => handleInstructionChange(index, 'time', e.target.value)}
                          min="0"
                        />
                        <span className="text-sm text-gray-500">minutes</span>
                      </div>
                    </div>
                    {instructions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInstruction(index)}
                        className="text-red-500 hover:text-red-600 mt-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {formErrors.instructions && (
                <p className="mt-1 text-sm text-red-600">{formErrors.instructions}</p>
              )}
            </div>

            {/* Cooking time and servings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="cookingTime" className="block text-sm font-medium text-gray-700">
                  Cooking Time (minutes)
                </label>
                <input
                  type="number"
                  name="cookingTime"
                  id="cookingTime"
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={formData.cookingTime}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="servings" className="block text-sm font-medium text-gray-700">
                  Servings
                </label>
                <input
                  type="number"
                  name="servings"
                  id="servings"
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={formData.servings}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 