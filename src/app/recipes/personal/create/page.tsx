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

export default function CreatePersonalRecipePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ingredients: '',
    instructions: '',
    cookingTime: '',
    servings: '',
    type: 'personal',
  });
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
    if (!formData.ingredients.trim()) {
      newErrors.ingredients = 'Ingredients are required';
      isValid = false;
    } else if (formData.ingredients.split('\n').length < 2) {
      newErrors.ingredients = 'Please enter at least 2 ingredients (one per line)';
      isValid = false;
    }

    // Instructions validation
    if (!formData.instructions.trim()) {
      newErrors.instructions = 'Instructions are required';
      isValid = false;
    } else if (formData.instructions.length < 30) {
      newErrors.instructions = 'Instructions should be at least 30 characters';
      isValid = false;
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
        body: JSON.stringify(formData),
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

                <div>
                  <label htmlFor="ingredients" className="block text-sm font-medium text-gray-700">
                    Ingredients <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="ingredients"
                    id="ingredients"
                    rows={5}
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      errors.ingredients ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter each ingredient on a new line"
                    value={formData.ingredients}
                    onChange={handleChange}
                    aria-describedby={errors.ingredients ? "ingredients-error" : undefined}
                  />
                  {errors.ingredients ? (
                    <p className="mt-1 text-sm text-red-600" id="ingredients-error">
                      {errors.ingredients}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">
                      Add one ingredient per line, including amount (e.g., "2 cups flour")
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="instructions" className="block text-sm font-medium text-gray-700">
                    Instructions <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="instructions"
                    id="instructions"
                    rows={5}
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      errors.instructions ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter step-by-step instructions"
                    value={formData.instructions}
                    onChange={handleChange}
                    aria-describedby={errors.instructions ? "instructions-error" : undefined}
                  />
                  {errors.instructions ? (
                    <p className="mt-1 text-sm text-red-600" id="instructions-error">
                      {errors.instructions}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">
                      Provide clear, step-by-step instructions
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="cookingTime" className="block text-sm font-medium text-gray-700">
                      Cooking Time (minutes) <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="number"
                      name="cookingTime"
                      id="cookingTime"
                      min="1"
                      className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        errors.cookingTime ? 'border-red-300' : 'border-gray-300'
                      }`}
                      value={formData.cookingTime}
                      onChange={handleChange}
                      aria-describedby={errors.cookingTime ? "cookingTime-error" : undefined}
                    />
                    {errors.cookingTime && (
                      <p className="mt-1 text-sm text-red-600" id="cookingTime-error">
                        {errors.cookingTime}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="servings" className="block text-sm font-medium text-gray-700">
                      Servings <span className="text-gray-400">(optional)</span>
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
                      aria-describedby={errors.servings ? "servings-error" : undefined}
                    />
                    {errors.servings && (
                      <p className="mt-1 text-sm text-red-600" id="servings-error">
                        {errors.servings}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
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