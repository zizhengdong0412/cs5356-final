import { motion } from 'framer-motion';
import Link from 'next/link';
import { Recipe } from '@/lib/recipe-helpers';

interface RecipeDisplayProps extends Recipe {
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
}

export default function RecipeDisplay({
  title,
  description,
  type,
  ingredients,
  instructions,
  cookingTime,
  servings,
  onEdit,
  onDelete,
  onShare,
}: RecipeDisplayProps) {
  // Ensure ingredients are in the right format (handle both string and object)
  const parsedIngredients = ingredients.map(ingredient => {
    // If ingredient is a string (JSON format), try to parse it
    if (typeof ingredient === 'string') {
      try {
        return JSON.parse(ingredient);
      } catch (e) {
        console.error('Error parsing ingredient:', e);
        return ingredient;
      }
    }
    return ingredient;
  });

  // Ensure instructions are in the right format (handle both string and object)
  const parsedInstructions = instructions.map(instruction => {
    // If instruction is a string (JSON format), try to parse it
    if (typeof instruction === 'string') {
      try {
        return JSON.parse(instruction);
      } catch (e) {
        console.error('Error parsing instruction:', e);
        return instruction;
      }
    }
    return instruction;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white shadow-lg rounded-lg overflow-hidden"
    >
      {/* Recipe Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-3xl font-bold text-gray-900"
          >
            {title}
          </motion.h1>
          
          <div className="flex space-x-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit
              </button>
            )}

            {onShare && (
              <button
                onClick={onShare}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                Share
              </button>
            )}

            {onDelete && (
              <button
                onClick={onDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </button>
            )}
          </div>
        </div>

        {description && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-gray-600"
          >
            {description}
          </motion.p>
        )}

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 flex items-center text-sm text-gray-500"
        >
          {type && <span className="capitalize">{type}</span>}
          {cookingTime && (
            <>
              <span className="mx-2">•</span>
              <span>{cookingTime} minutes</span>
            </>
          )}
          {servings && (
            <>
              <span className="mx-2">•</span>
              <span>{servings} servings</span>
            </>
          )}
        </motion.div>
      </div>

      {/* Recipe Content */}
      <div className="p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ingredients</h2>
          <ul className="list-disc pl-5 space-y-2">
            {parsedIngredients.map((ingredient, index) => (
              <li key={index} className="text-gray-700">
                {ingredient.amount} {ingredient.unit} {ingredient.name}
                {ingredient.notes && <span className="text-gray-500"> ({ingredient.notes})</span>}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
          <ol className="list-decimal pl-5 space-y-4">
            {parsedInstructions.map((instruction, index) => (
              <li key={index} className="text-gray-700">
                {instruction.text}
                {instruction.time && (
                  <span className="text-gray-500 ml-2">({instruction.time} minutes)</span>
                )}
              </li>
            ))}
          </ol>
        </motion.div>
      </div>
    </motion.div>
  );
} 