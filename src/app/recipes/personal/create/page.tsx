'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  notes?: string;
}

interface Instruction {
  step: number;
  text: string;
  time?: number;
}

// Validation type for tracking field-specific errors
type ValidationErrors = {
  title?: string;
  ingredients?: string;
  instructions?: string;
  cookingTime?: string;
  servings?: string;
  general?: string;
};

const MEASUREMENT_UNITS = [
  'g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'oz', 'lb', 'piece', 'pinch'
] as const;

export default function CreatePersonalRecipePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cookingTime: '',
    servings: '',
    type: 'personal' as const,
  });
  
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', amount: 0, unit: 'g', notes: '' }
  ]);
  
  const [instructions, setInstructions] = useState<Instruction[]>([
    { step: 1, text: '', time: undefined }
  ]);

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Check for authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: session } = await authClient.getSession();
        if (!session) {
          console.log('No auth session found, redirecting to login...');
          router.push('/auth/sign-in');
          return;
        }
        console.log('Auth session found:', session.user.email);
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/auth/sign-in');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
      isValid = false;
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
      isValid = false;
    }

    // Ingredients validation
    if (ingredients.length === 0) {
      newErrors.ingredients = 'At least one ingredient is required';
      isValid = false;
    } else {
      const hasEmptyIngredient = ingredients.some(ing => !ing.name.trim() || ing.amount <= 0);
      if (hasEmptyIngredient) {
        newErrors.ingredients = 'All ingredients must have a name and valid amount';
        isValid = false;
      }
    }

    // Instructions validation
    if (instructions.length === 0) {
      newErrors.instructions = 'At least one instruction step is required';
      isValid = false;
    } else {
      const hasEmptyInstruction = instructions.some(inst => !inst.text.trim());
      if (hasEmptyInstruction) {
        newErrors.instructions = 'All instruction steps must have text';
        isValid = false;
      }
    }

    // Cooking time validation (if provided)
    if (formData.cookingTime && (isNaN(Number(formData.cookingTime)) || Number(formData.cookingTime) <= 0)) {
      newErrors.cookingTime = 'Cooking time must be a positive number';
      isValid = false;
    }

    // Servings validation (if provided)
    if (formData.servings && (isNaN(Number(formData.servings)) || Number(formData.servings) <= 0)) {
      newErrors.servings = 'Servings must be a positive number';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear the error for this field when user starts typing
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string | number) => {
    setIngredients(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: field === 'amount' ? Number(value) : value
      };
      return updated;
    });
  };

  const handleInstructionChange = (index: number, field: keyof Instruction, value: string | number) => {
    setInstructions(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: field === 'time' ? Number(value) : value
      };
      return updated;
    });
  };

  const addIngredient = () => {
    setIngredients(prev => [
      ...prev,
      { name: '', amount: 0, unit: 'g', notes: '' }
    ]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const addInstruction = () => {
    setInstructions(prev => [
      ...prev,
      { step: prev.length + 1, text: '', time: undefined }
    ]);
  };

  const removeInstruction = (index: number) => {
    setInstructions(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      // Reorder steps
      return filtered.map((inst, i) => ({ ...inst, step: i + 1 }));
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          ingredients,
          instructions
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create recipe');
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating recipe:', error);
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-lg text-gray-700">Loading...</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Create New Recipe</h1>
              <Link
                href="/dashboard"
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Dashboard
              </Link>
            </div>

            {submitError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6">
              <div className="space-y-6">
                {/* Title field */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Recipe Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    id="title"
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      errors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                    value={formData.title}
                    onChange={handleChange}
                    aria-describedby={errors.title ? "title-error" : undefined}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600" id="title-error">
                      {errors.title}
                    </p>
                  )}
                </div>

                {/* Description field */}
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
                          value={ingredient.notes}
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
                  {errors.ingredients && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.ingredients}
                    </p>
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
                  {errors.instructions && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.instructions}
                    </p>
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
                      className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        errors.cookingTime ? 'border-red-300' : 'border-gray-300'
                      }`}
                      value={formData.cookingTime}
                      onChange={handleChange}
                    />
                    {errors.cookingTime && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.cookingTime}
                      </p>
                    )}
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
                      className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        errors.servings ? 'border-red-300' : 'border-gray-300'
                      }`}
                      value={formData.servings}
                      onChange={handleChange}
                    />
                    {errors.servings && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.servings}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Recipe'}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
} 