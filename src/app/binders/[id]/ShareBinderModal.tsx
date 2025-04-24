'use client';

import { useState, useEffect } from 'react';

type Binder = {
  id: string;
  title: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
};

type ShareBinder = {
  id: string;
  binder_id: string;
  owner_id: string;
  shared_with_id: string | null;
  permission: 'view' | 'edit' | 'admin';
  share_code: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export default function ShareBinderModal({
  binder,
  onClose,
}: {
  binder: Binder;
  onClose: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [existingShares, setExistingShares] = useState<ShareBinder[]>([]);
  const [loading, setLoading] = useState(true);

  // Load existing shares
  useEffect(() => {
    const fetchShares = async () => {
      try {
        const response = await fetch(`/api/binders/${binder.id}/share`);
        if (response.ok) {
          const data = await response.json();
          setExistingShares(data.shares || []);
        }
      } catch (err) {
        console.error('Error fetching shares:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchShares();
  }, [binder.id]);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    setShowSuccess(false);

    try {
      const response = await fetch(`/api/binders/${binder.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permission: 'view',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to share binder');
      }

      const data = await response.json();
      const baseUrl = window.location.origin;
      setShareUrl(`${baseUrl}${data.shareUrl}`);
      setShowSuccess(true);
      
      // Refresh the shares list
      const sharesResponse = await fetch(`/api/binders/${binder.id}/share`);
      if (sharesResponse.ok) {
        const sharesData = await sharesResponse.json();
        setExistingShares(sharesData.shares || []);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevokeShare = async (shareId: string) => {
    if (!confirm('Are you sure you want to revoke this share?')) {
      return;
    }

    try {
      const response = await fetch(`/api/binders/${binder.id}/share`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shareId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to revoke share');
      }

      // Remove the revoked share from the list
      setExistingShares(existingShares.filter(share => share.id !== shareId));
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold">Share Binder</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <p className="mb-4">
            Create a shareable link for <b>{binder.title}</b> that anyone with the link can view.
          </p>

          {showSuccess ? (
            <div className="mb-6">
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                Binder shared successfully!
              </div>
              <div className="flex items-center bg-gray-100 p-2 rounded border">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-grow bg-transparent outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="ml-2 p-2 text-blue-600 hover:text-blue-800"
                  aria-label="Copy link"
                >
                  {copied ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleShare} className="mb-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Generating Link...' : 'Generate Shareable Link'}
              </button>
            </form>
          )}

          <div className="mt-8">
            <h4 className="font-medium mb-2">Existing Shares</h4>
            
            {loading ? (
              <p className="text-center text-gray-500 py-4">Loading shares...</p>
            ) : existingShares.length > 0 ? (
              <ul className="divide-y">
                {existingShares.map(share => (
                  <li key={share.id} className="py-3 flex justify-between items-center">
                    <div>
                      <div className="text-sm text-gray-500">
                        Shared {new Date(share.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-sm">
                        Permission: {share.permission}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevokeShare(share.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Revoke
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500 py-4">No shares yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 