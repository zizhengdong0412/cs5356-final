'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    userCount: 0,
    recipeCount: 0,
    jobCount: {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
    },
  });
  
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // This would be a real API call in production
    // For now, we'll use mock data
    const fetchData = async () => {
      try {
        setLoading(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        setStats({
          userCount: 25,
          recipeCount: 142,
          jobCount: {
            waiting: 2,
            active: 1,
            completed: 45,
            failed: 3,
          },
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading dashboard data...</div>
      </div>
    );
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 mb-1">Total Users</div>
          <div className="text-3xl font-bold">{stats.userCount}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 mb-1">Total Recipes</div>
          <div className="text-3xl font-bold">{stats.recipeCount}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 mb-1">Active Jobs</div>
          <div className="text-3xl font-bold">{stats.jobCount.active}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 mb-1">Waiting Jobs</div>
          <div className="text-3xl font-bold">{stats.jobCount.waiting}</div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href="/admin/jobs" 
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-md px-4 py-2 text-center"
          >
            Manage Background Jobs
          </Link>
          
          <Link 
            href="/admin/users" 
            className="bg-green-500 hover:bg-green-600 text-white rounded-md px-4 py-2 text-center"
          >
            Manage Users
          </Link>
          
          <button 
            onClick={() => window.open('/api/admin/queues', '_blank')}
            className="bg-purple-500 hover:bg-purple-600 text-white rounded-md px-4 py-2"
          >
            View Job Queue
          </button>
        </div>
      </div>
    </div>
  );
} 