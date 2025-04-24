import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSessionFromCookie } from '@/lib/session-helper';
import { sql } from 'drizzle-orm';

export default async function BindersPage() {
  const session = await getSessionFromCookie();
  if (!session?.user) {
    redirect('/auth/sign-in');
  }

  // Use raw SQL to avoid schema mismatch issues
  const binderResults = await db.execute(sql`
    SELECT id, user_id, title, created_at, updated_at
    FROM binders
    WHERE user_id = ${session.user.id}
    ORDER BY updated_at DESC
  `);

  const userBinders = binderResults as any[];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Recipe Binders</h1>
        <Link 
          href="/binders/new" 
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Binder
        </Link>
      </div>

      {userBinders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-2xl font-medium mb-4">Create Your First Recipe Binder</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Recipe binders help you organize your recipes into collections. Create a binder to get started with your cooking journey.
          </p>
          <Link 
            href="/binders/new" 
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition text-lg font-medium inline-flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Your First Binder
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userBinders.map((binder) => (
            <Link 
              key={binder.id} 
              href={`/binders/${binder.id}`}
              className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold mb-2 truncate">{binder.title}</h2>
                <div className="text-gray-500 text-sm">
                  Last updated: {new Date(binder.updated_at).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Fixed action button for creating binders */}
      <Link
        href="/binders/new"
        className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors"
        aria-label="Create Binder"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Link>
    </div>
  );
} 