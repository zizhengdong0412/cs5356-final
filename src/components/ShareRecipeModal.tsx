import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, LinkIcon, UserIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface ShareRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: string;
  recipeName: string;
}

interface Share {
  id: string;
  shared_with_id: string | null;
  permission: 'view' | 'edit' | 'admin';
  share_code: string;
  created_at: string;
  shared_with_email?: string;
}

export default function ShareRecipeModal({ isOpen, onClose, recipeId, recipeName }: ShareRecipeModalProps) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit' | 'admin'>('view');
  const [shares, setShares] = useState<Share[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchShares = async () => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/share`);
      if (!response.ok) throw new Error('Failed to fetch shares');
      const data = await response.json();
      setShares(data.shares);
    } catch (error) {
      console.error('Error fetching shares:', error);
      toast.error('Failed to load shares');
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchShares();
    }
  }, [isOpen, recipeId]);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/recipes/${recipeId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, permission }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to share recipe');
      }

      const data = await response.json();
      setEmail('');
      setPermission('view');
      await fetchShares();
      toast.success('Recipe shared successfully');
    } catch (error) {
      console.error('Error sharing recipe:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to share recipe');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (shareId: string) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/share`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareId }),
      });

      if (!response.ok) throw new Error('Failed to revoke share');

      await fetchShares();
      toast.success('Share revoked successfully');
    } catch (error) {
      console.error('Error revoking share:', error);
      toast.error('Failed to revoke share');
    }
  };

  const copyShareLink = (shareCode: string) => {
    const shareUrl = `${window.location.origin}/shared/recipes/${shareCode}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied to clipboard');
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Share Recipe: {recipeName}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-full p-1 hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-6 w-6 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleShare} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Share with (email)
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Enter email address"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="permission" className="block text-sm font-medium text-gray-700">
                      Permission Level
                    </label>
                    <select
                      id="permission"
                      value={permission}
                      onChange={(e) => setPermission(e.target.value as 'view' | 'edit' | 'admin')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="view">View</option>
                      <option value="edit">Edit</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isLoading ? 'Sharing...' : 'Share Recipe'}
                  </button>
                </form>

                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Active Shares</h4>
                  <div className="space-y-2">
                    {shares.map((share) => (
                      <div
                        key={share.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                      >
                        <div className="flex items-center space-x-2">
                          {share.shared_with_id ? (
                            <UserIcon className="h-5 w-5 text-gray-400" />
                          ) : (
                            <LinkIcon className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <p className="text-sm text-gray-900">
                              {share.shared_with_email || 'Link Share'}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">{share.permission}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!share.shared_with_id && (
                            <button
                              onClick={() => copyShareLink(share.share_code)}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              Copy Link
                            </button>
                          )}
                          <button
                            onClick={() => handleRevoke(share.id)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Revoke
                          </button>
                        </div>
                      </div>
                    ))}
                    {shares.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-2">
                        No active shares
                      </p>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 