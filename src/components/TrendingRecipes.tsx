'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

type TrendingRecipe = {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  type: string;
};

export default function TrendingRecipes() {
  const [trending, setTrending] = useState<TrendingRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/recipes/trending', {
          cache: 'no-store',
          next: { revalidate: 3600 }, // Revalidate every hour
        });

        if (!response.ok) {
          throw new Error('Failed to fetch trending recipes');
        }

        const data = await response.json();
        setTrending(data.trending || []);
      } catch (err) {
        console.error('Error fetching trending recipes:', err);
        setError('Failed to load trending recipes');
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  if (loading) {
    return (
      <div className="my-8">
        <h2 className="text-2xl font-bold mb-4">Trending Recipes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-lg h-64 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-8">
        <h2 className="text-2xl font-bold mb-4">Trending Recipes</h2>
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4">
          {error}
        </div>
      </div>
    );
  }

  if (trending.length === 0) {
    return null; // Don't show section if no trending recipes
  }

  return (
    <div className="my-8">
      <h2 className="text-2xl font-bold mb-4">Trending Recipes</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {trending.map((recipe, index) => (
          <motion.div
            key={recipe.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div className="h-40 relative">
              {recipe.image ? (
                <Image
                  src={recipe.image}
                  alt={recipe.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="bg-gray-200 h-full w-full flex items-center justify-center">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}
            </div>
            
            <div className="p-4">
              <h3 className="font-bold text-lg mb-1 truncate">{recipe.title}</h3>
              {recipe.description && (
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                  {recipe.description}
                </p>
              )}
              <Link
                href={`/recipes/${recipe.id}`}
                className="text-blue-500 hover:text-blue-700 text-sm font-medium"
              >
                View Recipe →
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 