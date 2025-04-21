'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';

interface Note {
  id: string;
  title: string;
  description: string;
  ingredients: string;
  instructions: string;
  cooking_time: number | null;
  servings: number | null;
  type: string;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
}

interface ShareRecord {
  id: string;
  recipeId: string;
  sharedWithId: string | null;
  permission: 'view' | 'edit' | 'admin';
  shareCode: string;
  isActive: boolean;
  createdAt: string;
  shareLink: string;
}

export default function NotePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [redirectedToLogin, setRedirectedToLogin] = useState(false);
  
  // Share related state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<'view' | 'edit' | 'admin'>('view');
  const [sharingStatus, setSharingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [shareError, setShareError] = useState<string | null>(null);
  const [createdShareLink, setCreatedShareLink] = useState<string | null>(null);
  const [existingShares, setExistingShares] = useState<ShareRecord[]>([]);
  const [isLoadingShares, setIsLoadingShares] = useState(false);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        // 使用client-side验证会话状态
        const { data: session } = await authClient.getSession();
        
        if (!session?.user) {
          console.log("No valid session found, but not redirecting");
          setError("Please sign in to view this note");
          setLoading(false);
          return;
        }

        // 有了有效的会话，现在尝试获取笔记数据
        const response = await fetch(`/api/recipes/${params.id}`, {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
          }
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Note not found');
          } else {
            const data = await response.json();
            setError(data.error || 'Failed to fetch note');
          }
          return;
        }
        
        const data = await response.json();
        setNote(data);
        
        // 如果成功获取笔记，顺便获取共享记录
        await fetchShares();
      } catch (err) {
        console.error('Error fetching note:', err);
        setError('An error occurred while fetching the note');
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [params.id, router]);

  // 获取笔记的所有共享记录
  const fetchShares = async () => {
    try {
      setIsLoadingShares(true);
      const response = await fetch(`/api/recipes/share?recipeId=${params.id}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        console.error('Error fetching shares:', await response.text());
        return;
      }
      
      const data = await response.json();
      setExistingShares(data.shares || []);
    } catch (err) {
      console.error('Error fetching shares:', err);
    } finally {
      setIsLoadingShares(false);
    }
  };
  
  // 处理创建共享链接
  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSharingStatus('loading');
      setShareError(null);
      
      const response = await fetch('/api/recipes/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          recipeId: params.id,
          permission: sharePermission,
          email: shareEmail.trim() || null,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to share note');
      }
      
      const data = await response.json();
      setSharingStatus('success');
      setCreatedShareLink(data.share.shareLink);
      
      // 重新获取共享记录
      await fetchShares();
      
      // 如果是通过链接共享（没有指定邮箱），则清除邮箱
      if (!shareEmail.trim()) {
        setShareEmail('');
      }
    } catch (err) {
      console.error('Error sharing note:', err);
      setSharingStatus('error');
      setShareError(err instanceof Error ? err.message : 'Failed to share note');
    }
  };
  
  // 处理删除共享链接
  const handleDeleteShare = async (shareId: string) => {
    try {
      const response = await fetch(`/api/recipes/share?shareId=${shareId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete share');
      }
      
      // 重新获取共享记录
      await fetchShares();
    } catch (err) {
      console.error('Error deleting share:', err);
      alert('Failed to delete share link');
    }
  };
  
  // 复制链接到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Link copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
        alert('Failed to copy link. Please copy it manually.');
      });
  };

  const handleDelete = async () => {
    if (!note) return;
    
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/recipes/${note.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete note');
      }

      router.push('/dashboard');
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          
          {error === "Please sign in to view this note" ? (
            <div className="space-y-4">
              <p className="text-gray-600">You need to be signed in to view this note.</p>
              <Link 
                href="/auth/sign-in" 
                className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
            </div>
          ) : (
            <Link 
              href="/dashboard" 
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Return to Dashboard
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Note Not Found</h1>
          <p className="text-gray-700 mb-6">The requested note could not be found.</p>
          <Link 
            href="/dashboard" 
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back to dashboard link */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-blue-500 hover:text-blue-600 font-medium flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Note header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold text-gray-900">{note.title}</h1>
              
              <div className="flex space-x-2">
                <Link
                  href={`/notes/${note.id}/edit`}
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
                </Link>

                <button
                  onClick={() => setShowShareModal(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
                  aria-label="Share note"
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

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
                  aria-label="Delete note"
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
              </div>
            </div>

            {note.description && (
              <p className="mt-4 text-gray-600">{note.description}</p>
            )}

            <div className="mt-4 flex items-center text-sm text-gray-500">
              <span className="capitalize">{note.type}</span>
              {note.cooking_time && (
                <>
                  <span className="mx-2">•</span>
                  <span>{note.cooking_time} minutes</span>
                </>
              )}
              {note.servings && (
                <>
                  <span className="mx-2">•</span>
                  <span>{note.servings} servings</span>
                </>
              )}
            </div>
          </div>

          {/* Note content */}
          <div className="p-6">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Ingredients</h2>
              <ul className="list-disc pl-5 space-y-2">
                {note.ingredients.split('\n').map((ingredient, index) => (
                  <li key={index} className="text-gray-700">
                    {ingredient.trim()}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
              <div className="prose max-w-none text-gray-700">
                {note.instructions.split('\n').map((instruction, index) => (
                  <p key={index} className="mb-4">
                    {instruction.trim()}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Note</h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to delete this note? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 border border-transparent rounded-md text-sm font-medium text-white"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Share Note</h3>
              <button 
                onClick={() => {
                  setShowShareModal(false);
                  setSharingStatus('idle');
                  setCreatedShareLink(null);
                  setShareError(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* 共享表单 */}
            <form onSubmit={handleShare}>
              <div className="mb-4">
                <label htmlFor="share-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Share with (optional)
                </label>
                <input
                  type="email"
                  id="share-email"
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  disabled={sharingStatus === 'loading'}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Leave blank to generate a shareable link
                </p>
              </div>
              
              <div className="mb-4">
                <label htmlFor="share-permission" className="block text-sm font-medium text-gray-700 mb-1">
                  Permission
                </label>
                <select
                  id="share-permission"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={sharePermission}
                  onChange={(e) => setSharePermission(e.target.value as 'view' | 'edit' | 'admin')}
                  disabled={sharingStatus === 'loading'}
                >
                  <option value="view">View only</option>
                  <option value="edit">Can edit</option>
                  <option value="admin">Admin (can share with others)</option>
                </select>
              </div>
              
              {shareError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  {shareError}
                </div>
              )}
              
              {/* 成功创建共享链接后显示 */}
              {sharingStatus === 'success' && createdShareLink && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Share Link:</p>
                  <div className="flex items-center">
                    <input
                      type="text"
                      readOnly
                      value={createdShareLink}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(createdShareLink)}
                      className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-r-md"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowShareModal(false);
                    setSharingStatus('idle');
                    setCreatedShareLink(null);
                    setShareError(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={sharingStatus === 'loading'}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white disabled:opacity-50"
                  disabled={sharingStatus === 'loading'}
                >
                  {sharingStatus === 'loading' ? 'Creating...' : 'Create Share Link'}
                </button>
              </div>
            </form>
            
            {/* 现有共享链接列表 */}
            {existingShares.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Existing Shares</h4>
                <ul className="space-y-3">
                  {existingShares.map((share) => (
                    <li key={share.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-800">
                            {share.permission} access
                          </span>
                          <span className="ml-2 py-1 px-2 text-xs rounded-full bg-gray-200 text-gray-700">
                            {share.shareCode}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(share.shareLink)}
                          className="text-blue-500 hover:text-blue-700 text-xs"
                        >
                          Copy link
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteShare(share.id)}
                        className="text-red-500 hover:text-red-700"
                        aria-label="Delete share"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 