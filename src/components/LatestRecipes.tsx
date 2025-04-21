'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { TheMealDBService, Meal } from '@/lib/themealdb';

export default function LatestRecipes() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

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
  };

  const closeMealDetails = () => {
    setSelectedMeal(null);
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