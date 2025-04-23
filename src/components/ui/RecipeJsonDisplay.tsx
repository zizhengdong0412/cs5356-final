import React from 'react';

interface RecipeJsonDisplayProps {
  data: any;
  label: string;
}

export function RecipeJsonDisplay({ data, label }: RecipeJsonDisplayProps) {
  const formatData = (jsonData: any) => {
    try {
      // If it's a string that's actually JSON, parse it
      if (typeof jsonData === 'string') {
        try {
          return JSON.parse(jsonData);
        } catch (e) {
          return jsonData;
        }
      }
      return jsonData;
    } catch (error) {
      console.error('Error formatting data:', error);
      return jsonData;
    }
  };

  const formattedData = formatData(data);

  return (
    <div className="my-4">
      <h3 className="text-lg font-semibold mb-2">{label}</h3>
      <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60 text-sm">
        {JSON.stringify(formattedData, null, 2)}
      </pre>
    </div>
  );
} 