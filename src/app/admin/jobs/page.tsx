'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminJobsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<{
    recommendations: boolean;
    trending: boolean;
  }>({
    recommendations: false,
    trending: false,
  });
  const [result, setResult] = useState<any>(null);

  // Trigger weekly recommendations for all users
  const triggerRecommendations = async () => {
    try {
      setLoading({ ...loading, recommendations: true });
      const response = await fetch('/api/jobs/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error triggering recommendations:', error);
      setResult({ error: String(error) });
    } finally {
      setLoading({ ...loading, recommendations: false });
    }
  };

  // Trigger trending calculation
  const triggerTrending = async () => {
    try {
      setLoading({ ...loading, trending: true });
      const response = await fetch('/api/jobs/trending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error triggering trending calculation:', error);
      setResult({ error: String(error) });
    } finally {
      setLoading({ ...loading, trending: false });
    }
  };

  // Navigate to Bull Board dashboard
  const navigateToBullBoard = () => {
    window.open('/api/admin/queues', '_blank');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Background Jobs Admin</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Trigger Jobs Manually</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">Recipe Recommendations</h3>
            <p className="text-gray-600 mb-4">Send recipe recommendations to all users.</p>
            <button
              className={`px-4 py-2 rounded-md w-full ${
                loading.recommendations
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
              onClick={triggerRecommendations}
              disabled={loading.recommendations}
            >
              {loading.recommendations ? 'Processing...' : 'Send Recommendations'}
            </button>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">Calculate Trending Recipes</h3>
            <p className="text-gray-600 mb-4">Update the trending recipes list.</p>
            <button
              className={`px-4 py-2 rounded-md w-full ${
                loading.trending
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
              onClick={triggerTrending}
              disabled={loading.trending}
            >
              {loading.trending ? 'Processing...' : 'Calculate Trending'}
            </button>
          </div>
        </div>
        
        <button
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md w-full"
          onClick={navigateToBullBoard}
        >
          Open Bull Board Dashboard
        </button>
      </div>
      
      {result && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Job Result</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 