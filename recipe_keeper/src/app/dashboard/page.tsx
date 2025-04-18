'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { authClient, type Session, signOut } from '@/lib/auth-client';

type Recipe = {
  id: string;
  title: string;
  category: string;
  image: string;
  url: string;
};

type PinnedNote = {
  id: string;
  title: string;
};

export default function Dashboard() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recipes] = useState<Recipe[]>([
    {
      id: '1',
      title: 'The Grinch Peppermint Sugar Cookies',
      category: 'Desserts',
      image: '/recipes/grinch-cookies.jpg',
      url: 'https://dailydishrecipes.com/the-grinch-peppermint-sugar-cookies/',
    },
    {
      id: '2',
      title: 'Spiced Turmeric Coffee Latte',
      category: 'Drinks',
      image: '/recipes/turmeric-latte.jpg',
      url: 'https://dailydishrecipes.com/spiced-turmeric-coffee-latte/',
    },
  ]);
  const [pinnedNotes, setPinnedNotes] = useState<PinnedNote[]>([
    { id: '1', title: 'Grocery List' },
    { id: '2', title: 'Recipe Ideas' },
    { id: '3', title: 'Lemon Tart' },
    { id: '4', title: 'Quinoa Salad' },
  ]);

  useEffect(() => {
    authClient.getSession().then((data) => {
      if (!data || 'code' in data) {
        router.push('/auth/sign-in');
      } else {
        const sessionData = data as unknown as Session;
        setSession(sessionData);
        setIsLoading(false);
      }
    });
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/sign-in');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Recipe book</h1>
        <div className="flex space-x-3">
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
            Share
          </button>
          <button 
            onClick={handleSignOut}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* What's new section */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">What's new</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recipes.map((recipe) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <a href={recipe.url} target="_blank" rel="noopener noreferrer" className="block">
                <div className="relative h-48 w-full">
                  <Image
                    src={recipe.image}
                    alt={recipe.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <span className="text-sm text-indigo-600 font-medium">{recipe.category}</span>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">{recipe.title}</h3>
                </div>
              </a>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Pinned notes section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Pinned notes</h2>
        <div className="space-y-2">
          {pinnedNotes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-900 text-white p-4 rounded-lg"
            >
              <span className="text-sm">{note.title}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 