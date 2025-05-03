'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  
  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white shadow">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Recipe Binder Admin</h1>
          <Link 
            href="/dashboard" 
            className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
          >
            Back to App
          </Link>
        </div>
      </header>
      
      <div className="container mx-auto py-6 px-4 flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="bg-white shadow rounded-lg overflow-hidden">
            <div className="bg-blue-800 text-white p-4">
              <h2 className="font-semibold">Admin Panel</h2>
            </div>
            <ul className="divide-y">
              <li>
                <Link 
                  href="/admin/dashboard" 
                  className={`block p-4 hover:bg-blue-50 ${
                    pathname === '/admin/dashboard' ? 'bg-blue-100 font-medium' : ''
                  }`}
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/jobs" 
                  className={`block p-4 hover:bg-blue-50 ${
                    pathname === '/admin/jobs' ? 'bg-blue-100 font-medium' : ''
                  }`}
                >
                  Background Jobs
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/users" 
                  className={`block p-4 hover:bg-blue-50 ${
                    pathname === '/admin/users' ? 'bg-blue-100 font-medium' : ''
                  }`}
                >
                  User Management
                </Link>
              </li>
            </ul>
          </nav>
        </aside>
        
        <main className="flex-grow">
          {children}
        </main>
      </div>
    </div>
  );
} 