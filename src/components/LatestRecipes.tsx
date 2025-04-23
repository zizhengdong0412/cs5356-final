'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { TheMealDBService, Meal } from '@/lib/themealdb';
import { useRouter } from 'next/navigation';

export default function LatestRecipes() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const latestMeals = await TheMealDBService.getLatestMeals();
        setMeals(latestMeals);
      } catch (err) {
        setError('Failed to fetch latest recipes');
        console.error('Error fetching latest meals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMeals();
  }, []);

  const handleMealClick = (meal: Meal) => {
    setSelectedMeal(meal);
    setSaveSuccess(false);
    setSaveError(null);
  };

  const closeMealDetails = () => {
    setSelectedMeal(null);
  };

  const handleSaveRecipe = async () => {
    if (!selectedMeal) return;

    try {
      setIsSaving(true);
      setSaveError(null);
      
      // Format ingredients from TheMealDB format as structured objects
      const ingredientsArray = [];
      for (let i = 1; i <= 20; i++) {
        const ingredient = selectedMeal[`strIngredient${i}` as keyof Meal];
        const measure = selectedMeal[`strMeasure${i}` as keyof Meal] as string;
        
        if (ingredient && ingredient.trim() !== '') {
          // Parse measure to extract amount and unit
          const measureStr = measure || '';
          const numberMatch = measureStr.match(/([0-9]+(\.[0-9]+)?)/);
          const amount = numberMatch ? parseFloat(numberMatch[1]) : 1;
          const unit = measureStr.replace(/([0-9]+(\.[0-9]+)?)/g, '').trim();
          
          ingredientsArray.push({
            name: ingredient.trim(),
            amount: amount,
            unit: unit,
            notes: ''
          });
        }
      }

      // Format instructions as structured objects
      const instructionsArray = selectedMeal.strInstructions
        .split(/\r?\n/)
        .filter((line: string) => line.trim())
        .map((text: string, index: number) => ({
          step: index + 1,
          text: text.trim()
        }));

      // Create recipe object with structured data
      const recipe = {
        title: selectedMeal.strMeal,
        description: `${selectedMeal.strCategory} recipe from ${selectedMeal.strArea}`,
        ingredients: ingredientsArray,
        instructions: instructionsArray,
        type: 'external',
        thumbnail: selectedMeal.strMealThumb,
      };

      // Log the recipe data for debugging
      console.log('Saving recipe with data:', JSON.stringify(recipe));

      // Save recipe to backend
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(recipe),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Server error response:', data);
        throw new Error(data.error || 'Failed to save recipe');
      }

      const data = await response.json();
      setSaveSuccess(true);
      
      // Navigate to the recipe page after a short delay
      setTimeout(() => {
        router.push(`/recipes/${data.id}`);
      }, 1500);
    } catch (err) {
      console.error('Error saving recipe:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to save recipe');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-4">
        {error}
      </div>
    );
  }

  if (meals.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        No recipes found
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {meals.map((meal) => (
          <motion.div
            key={meal.idMeal}
            className="block group cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleMealClick(meal)}
          >
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative h-48">
                <Image
                  src={meal.strMealThumb}
                  alt={meal.strMeal}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <div className="text-sm text-gray-500 mb-1">
                  {meal.strCategory}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                  {meal.strMeal}
                </h3>
                <div className="text-sm text-gray-500 mt-1">
                  {meal.strArea}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recipe Details Modal */}
      {selectedMeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{selectedMeal.strMeal}</h2>
                <button 
                  onClick={closeMealDetails}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="relative h-64 md:h-80">
                  <Image
                    src={selectedMeal.strMealThumb}
                    alt={selectedMeal.strMeal}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Category</h3>
                    <p>{selectedMeal.strCategory}</p>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Cuisine</h3>
                    <p>{selectedMeal.strArea}</p>
                  </div>
                  {selectedMeal.strTags && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">Tags</h3>
                      <p>{selectedMeal.strTags}</p>
                    </div>
                  )}
                  
                  {/* Save Recipe Button */}
                  <div className="mt-4">
                    <button
                      onClick={handleSaveRecipe}
                      disabled={isSaving || saveSuccess}
                      className={`w-full px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors flex items-center justify-center ${
                        saveSuccess 
                          ? 'bg-green-500 text-white cursor-default' 
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : saveSuccess ? (
                        <>
                          <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Saved! Redirecting...
                        </>
                      ) : (
                        <>
                          <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          Save Recipe (with sharing options)
                        </>
                      )}
                    </button>
                    
                    {saveError && (
                      <p className="mt-2 text-sm text-red-600">{saveError}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Ingredients</h3>
                <ul className="list-disc pl-5 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => {
                    const ingredient = selectedMeal[`strIngredient${num}` as keyof Meal];
                    const measure = selectedMeal[`strMeasure${num}` as keyof Meal];
                    if (ingredient && ingredient.trim() !== '') {
                      return (
                        <li key={num}>
                          {measure && measure.trim() !== '' ? `${measure} ${ingredient}` : ingredient}
                        </li>
                      );
                    }
                    return null;
                  })}
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Instructions</h3>
                <div className="whitespace-pre-line">{selectedMeal.strInstructions}</div>
              </div>
              
              {selectedMeal.strYoutube && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Video Tutorial</h3>
                  <a 
                    href={selectedMeal.strYoutube} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Watch on YouTube
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 