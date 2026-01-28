import { useState } from 'react';
import { requestFormSchema, type RequestFormData } from '../types/index';
import { createRequest } from '../utilities/database';
import { useAuth } from '../utilities/AuthContext';

interface RequestFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { id: 'rides', label: 'Rides', icon: '🚗', description: 'Need a ride somewhere' },
  { id: 'tutoring', label: 'Tutoring', icon: '📚', description: 'Academic help' },
  { id: 'errands', label: 'Errands', icon: '🛒', description: 'Shopping, pickups, etc.' },
  { id: 'moving', label: 'Moving', icon: '📦', description: 'Help moving items' },
  { id: 'other', label: 'Other', icon: '💬', description: 'Anything else' },
];

export default function RequestForm({ onClose, onSuccess }: RequestFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!category) {
      setError('Please select a category');
      return;
    }

    setIsLoading(true);

    try {
      const data: RequestFormData = { title, description };
      const validated = requestFormSchema.parse(data);

      if (!currentUser || !currentUser.email || !currentUser.displayName || !currentUser.year || !currentUser.major) {
        throw new Error('User not authenticated');
      }

      await createRequest(
        validated.title,
        validated.description,
        currentUser.uid,
        currentUser.email,
        currentUser.displayName,
        currentUser.year,
        currentUser.major,
        category
      );

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-purple-700 px-6 py-5">
          <h2 className="text-2xl font-bold text-white">Create Request</h2>
          <p className="text-purple-200 text-sm mt-1">Ask the community for help</p>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                What type of help do you need?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      category === cat.id
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <p className={`text-sm font-medium mt-1 ${
                      category === cat.id ? 'text-purple-900' : 'text-gray-900'
                    }`}>
                      {cat.label}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Title
                <span className="text-gray-400 font-normal ml-2">
                  {title.length}/100
                </span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="e.g., Need a ride to HMart this weekend"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
                <span className="text-gray-400 font-normal ml-2">
                  {description.length}/500
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                required
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                placeholder="Provide more details about what you need help with, when you need it, etc."
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-purple-900 text-white rounded-xl font-semibold hover:bg-purple-800 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create Request'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
