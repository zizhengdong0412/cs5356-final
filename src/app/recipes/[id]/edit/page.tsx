'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';

// Validation type for tracking field-specific errors
type ValidationErrors = {
  title?: string;
  ingredients?: string;
  instructions?: string;
  cookingTime?: string;
  servings?: string;
  general?: string;
};

// Define ingredient structure
interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  notes?: string;
}

// Define instruction structure
interface Instruction {
  step: number;
  text: string;
  time?: number;
}

interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: Ingredient[] | string;
  instructions: Instruction[] | string;
  cookingTime: number | null;
  servings: number | null;
  type: string;
  thumbnail: string | null;
}

export default function EditRecipePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cookingTime: '',
    servings: '',
  });
  
  // Structured state for ingredients and instructions
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Available unit options
  const unitOptions = ['g', 'kg', 'oz', 'lb', 'cup', 'tbsp', 'tsp', 'ml', 'l', 'piece', 'pinch', 'to taste'];

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        // Check if user is authenticated
        const { data: session } = await authClient.getSession();
        if (!session) {
          router.push('/auth/sign-in');
          return;
        }

        // Fetch the recipe
        const response = await fetch(`/api/recipes/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setFetchError('Recipe not found');
          } else {
            const data = await response.json();
            setFetchError(data.error || 'Failed to fetch recipe');
          }
          return;
        }
        
        const recipe: Recipe = await response.json();
        
        // Set basic form data
        setFormData({
          title: recipe.title,
          description: recipe.description || '',
          cookingTime: recipe.cookingTime?.toString() || '',
          servings: recipe.servings?.toString() || '',
        });
        
        // Parse ingredients
        try {
          let parsedIngredients: Ingredient[];
          if (typeof recipe.ingredients === 'string') {
            parsedIngredients = JSON.parse(recipe.ingredients);
          } else {
            parsedIngredients = recipe.ingredients as Ingredient[];
          }
          setIngredients(parsedIngredients);
        } catch (error) {
          console.error('Error parsing ingredients:', error);
          setIngredients([{ name: '', amount: 0, unit: 'g', notes: '' }]);
        }
        
        // Parse instructions
        try {
          let parsedInstructions: Instruction[];
          if (typeof recipe.instructions === 'string') {
            parsedInstructions = JSON.parse(recipe.instructions);
          } else {
            parsedInstructions = recipe.instructions as Instruction[];
          }
          // Make sure instructions have step numbers if missing
          parsedInstructions = parsedInstructions.map((instr, idx) => ({
            ...instr,
            step: instr.step || idx + 1
          }));
          setInstructions(parsedInstructions);
        } catch (error) {
          console.error('Error parsing instructions:', error);
          setInstructions([{ step: 1, text: '', time: undefined }]);
        }
      } catch (err) {
        console.error('Error fetching recipe:', err);
        setFetchError('An error occurred while fetching the recipe');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [params.id, router]);

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
      // Check for invalid ingredients - allow 0 as a valid amount
      const invalidIngredient = ingredients.find(
        ing => !ing.name.trim() || ing.amount === undefined || ing.amount < 0 || !ing.unit
      );
      if (invalidIngredient) {
        newErrors.ingredients = 'All ingredients must have a name, amount (≥ 0), and unit';
        isValid = false;
      }
    }

    // Instructions validation
    if (instructions.length === 0) {
      newErrors.instructions = 'At least one instruction is required';
      isValid = false;
    } else {
      const invalidInstruction = instructions.find(instr => !instr.text.trim());
      if (invalidInstruction) {
        newErrors.instructions = 'All instructions must have text';
        isValid = false;
      }
    }

    // Cooking time validation (if provided)
    if (formData.cookingTime && (isNaN(Number(formData.cookingTime)) || Number(formData.cookingTime) < 0)) {
      newErrors.cookingTime = 'Cooking time must be a positive number';
      isValid = false;
    }

    // Servings validation (if provided)
    if (formData.servings && (isNaN(Number(formData.servings)) || Number(formData.servings) < 0)) {
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

  // Handle ingredient change
  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string | number) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { 
      ...newIngredients[index], 
      [field]: field === 'amount' ? Number(value) || 0 : value 
    };
    setIngredients(newIngredients);
    
    // Clear ingredient errors when user edits
    if (errors.ingredients) {
      setErrors(prev => ({ ...prev, ingredients: undefined }));
    }
  };

  // Handle instruction change
  const handleInstructionChange = (index: number, field: keyof Instruction, value: string | number) => {
    const newInstructions = [...instructions];
    newInstructions[index] = { 
      ...newInstructions[index], 
      [field]: field === 'time' ? (Number(value) || undefined) : 
               field === 'step' ? Number(value) : value 
    };
    setInstructions(newInstructions);
    
    // Clear instruction errors when user edits
    if (errors.instructions) {
      setErrors(prev => ({ ...prev, instructions: undefined }));
    }
  };

  // Add new ingredient
  const addIngredient = () => {
    setIngredients([
      ...ingredients, 
      { name: '', amount: 0, unit: 'g', notes: '' }
    ]);
  };

  // Remove ingredient at index
  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  // Add new instruction step
  const addInstruction = () => {
    const nextStep = instructions.length > 0 
      ? Math.max(...instructions.map(i => i.step)) + 1 
      : 1;
    setInstructions([
      ...instructions, 
      { step: nextStep, text: '', time: undefined }
    ]);
  };

  // Remove instruction at index
  const removeInstruction = (index: number) => {
    const newInstructions = instructions.filter((_, i) => i !== index);
    // Re-number steps to be sequential
    const renumbered = newInstructions.map((instr, idx) => ({
      ...instr,
      step: idx + 1
    }));
    setInstructions(renumbered);
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
      // Create the request payload
      const payload = {
        ...formData,
        cookingTime: formData.cookingTime ? Number(formData.cookingTime) : null,
        servings: formData.servings ? Number(formData.servings) : null,
        ingredients: ingredients,
        instructions: instructions,
      };
      
      console.log('Submitting recipe data:', payload);
      
      const response = await fetch(`/api/recipes/${params.id}`, {
        method: 'PUT', // Change back to PUT method as the API might expect this
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.text();
      console.log('Response:', response.status, responseData);

      if (!response.ok) {
        let errorMessage = `Failed to update recipe: ${response.status}`;
        try {
          const errorData = JSON.parse(responseData);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
          console.error('Server error response:', errorData);
        } catch (e) {
          console.error('Could not parse error response as JSON');
        }
        throw new Error(errorMessage);
      }

      // Success! Navigate back to recipe page
      console.log('Update successful');
      router.push(`/recipes/${params.id}`);
    } catch (error) {
      console.error('Error updating recipe:', error);
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
          <p className="text-gray-700 mb-6">{fetchError}</p>
          <Link 
            href="/dashboard" 
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Recipe</h1>
          <Link
            href={`/recipes/${params.id}`}
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
            Back to Recipe
          </Link>
        </div>

        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6">
          <div className="space-y-8">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Recipe Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`mt-1 block w-full border ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (optional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="cookingTime" className="block text-sm font-medium text-gray-700">
                  Cooking Time (minutes, optional)
                </label>
                <input
                  type="number"
                  id="cookingTime"
                  name="cookingTime"
                  min="1"
                  value={formData.cookingTime}
                  onChange={handleChange}
                  className={`mt-1 block w-full border ${
                    errors.cookingTime ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.cookingTime && <p className="mt-1 text-sm text-red-600">{errors.cookingTime}</p>}
              </div>

              <div>
                <label htmlFor="servings" className="block text-sm font-medium text-gray-700">
                  Servings (optional)
                </label>
                <input
                  type="number"
                  id="servings"
                  name="servings"
                  min="1"
                  value={formData.servings}
                  onChange={handleChange}
                  className={`mt-1 block w-full border ${
                    errors.servings ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.servings && <p className="mt-1 text-sm text-red-600">{errors.servings}</p>}
              </div>
            </div>

            {/* Structured Ingredients Section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Ingredients <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addIngredient}
                  className="text-blue-500 hover:text-blue-700 font-medium flex items-center text-sm"
                >
                  <span className="mr-1">+</span> Add Ingredient
                </button>
              </div>
              
              {errors.ingredients && (
                <p className="mt-1 mb-2 text-sm text-red-600">{errors.ingredients}</p>
              )}
              
              <div className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="flex flex-wrap items-center gap-2">
                    <div className="flex-grow min-w-[180px]">
                      <input
                        type="text"
                        placeholder="Ingredient name"
                        value={ingredient.name}
                        onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                        className={`w-full border ${!ingredient.name.trim() && 'border-red-300'} border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      />
                    </div>
                    
                    <div className="w-24">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Amount"
                        value={ingredient.amount || ''}
                        onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                        className={`w-full border ${ingredient.amount < 0 && 'border-red-300'} border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      />
                    </div>
                    
                    <div className="w-28">
                      <select
                        value={ingredient.unit}
                        onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                        className={`w-full border ${!ingredient.unit && 'border-red-300'} border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      >
                        {unitOptions.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex-grow min-w-[120px]">
                      <input
                        type="text"
                        placeholder="Notes"
                        value={ingredient.notes || ''}
                        onChange={(e) => handleIngredientChange(index, 'notes', e.target.value)}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="text-red-500 hover:text-red-700"
                      aria-label="Remove ingredient"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Structured Instructions Section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Instructions <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addInstruction}
                  className="text-blue-500 hover:text-blue-700 font-medium flex items-center text-sm"
                >
                  <span className="mr-1">+</span> Add Step
                </button>
              </div>
              
              {errors.instructions && (
                <p className="mt-1 mb-2 text-sm text-red-600">{errors.instructions}</p>
              )}
              
              <div className="space-y-4">
                {instructions.map((instruction, index) => (
                  <div key={index} className="flex flex-col gap-2 p-4 border border-gray-200 rounded-md">
                    <div className="flex justify-between items-start">
                      <div className="text-lg font-medium text-gray-700">{instruction.step}.</div>
                      <button
                        type="button"
                        onClick={() => removeInstruction(index)}
                        className="text-red-500 hover:text-red-700"
                        aria-label="Remove instruction"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <div>
                      <textarea
                        rows={3}
                        placeholder="Instruction text"
                        value={instruction.text}
                        onChange={(e) => handleInstructionChange(index, 'text', e.target.value)}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="block text-sm text-gray-600 mr-2">Time:</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Minutes"
                        value={instruction.time || ''}
                        onChange={(e) => handleInstructionChange(index, 'time', e.target.value)}
                        className="w-32 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-500">minutes</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => router.push(`/recipes/${params.id}`)}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isSubmitting ? 'Saving...' : 'Save Recipe'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 