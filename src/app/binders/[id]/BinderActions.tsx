'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ShareBinderModal from './ShareBinderModal';

type Binder = {
  id: string;
  title: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
};

export default function BinderActions({ binder }: { binder: Binder }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${binder.title}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/binders/${binder.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete binder');
      }

      router.push('/binders');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setIsDeleting(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex space-x-2">
        <Link
          href={`/binders/${binder.id}/edit`}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Edit
        </Link>
        <button
          onClick={() => setShowShareModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Share
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      {showShareModal && (
        <ShareBinderModal
          binder={binder}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
} 