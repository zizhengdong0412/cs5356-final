'use client'

import Image from "next/image";
import Link from 'next/link';
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center px-6 py-12 sm:px-12 bg-gray-50 font-[var(--font-geist-sans)] text-gray-800">
      
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
      <Image src="/logo.jpg" alt="Recipe Keeper Logo" width={40} height={40} />
      </motion.div>

      {/* Main Message */}
      <motion.h1 className="text-3xl sm:text-5xl font-bold text-center max-w-2xl leading-tight"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        Organize Your Favorite Recipes Effortlessly
      </motion.h1>

      <motion.p className="text-gray-600 text-center max-w-xl mt-4 text-base sm:text-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.4 }}
      >
        Create binders, save ingredients, and build your personal recipe collection. Anytime, anywhere.
      </motion.p>

      {/* Buttons */}
      <motion.div className="mt-8 flex flex-col sm:flex-row gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Link
          href="/dashboard"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base px-6 py-3 rounded-full transition font-medium text-center"
        >
          Explore My Binders
        </Link>
        <Link
          href="/auth/sign-in"
          className="border border-gray-300 hover:border-gray-500 text-gray-700 hover:text-black text-sm sm:text-base px-6 py-3 rounded-full transition font-medium text-center"
        >
          Sign In
        </Link>
        </motion.div>

      {/* Feature for App */}
      <section className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl w-full" aria-label="App Features">
        <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition">
          <h3 className="text-lg font-semibold mb-2">Recipe Binders</h3>
          <p className="text-sm text-gray-600">
            Organize your recipes into personalized collections — like “Holiday Favorites” or “Quick Weeknight Meals”.
          </p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition">
          <h3 className="text-lg font-semibold mb-2">Smart Ingredient Lists</h3>
          <p className="text-sm text-gray-600">
            Add ingredients with specific units and quantities. We’ll make shopping lists easy later.
          </p>
        </div>
      </section>

      {/* Footers */}
      <footer className="mt-16 text-xs text-gray-400 text-center">
        &copy; 2025 Recipe Keeper. Made with Next.js.
      </footer>
    </div>
  )
}