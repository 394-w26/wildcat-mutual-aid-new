import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../utilities/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { Offer, Request } from '../types/index';
import {
  getAcceptedOffersForMyRequests,
  getMyAcceptedOffers,
} from '../utilities/database';
import Layout from './Layout';
import { getCategoryStyle } from './Dashboard';

type HistoryItem = Offer & { request: Request };

export default function HistoryPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [receivedHelp, setReceivedHelp] = useState<HistoryItem[]>([]);
  const [sentHelp, setSentHelp] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    } else if (!currentUser.year || !currentUser.major) {
      navigate('/create-profile');
    }
  }, [currentUser, navigate]);

  const loadHistory = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [received, sent] = await Promise.all([
        getAcceptedOffersForMyRequests(currentUser.uid),
        getMyAcceptedOffers(currentUser.uid),
      ]);
      setReceivedHelp(received);
      setSentHelp(sent);
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const getRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const currentItems = activeTab === 'received' ? receivedHelp : sentHelp;

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">History</h2>
        <p className="text-gray-600 mt-1">Your past connections</p>
      </div>

      {/* Tab Toggle */}
      <div className="mb-6">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'received'
                ? 'bg-white text-purple-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            Help Received
            {receivedHelp.length > 0 && (
              <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                {receivedHelp.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'sent'
                ? 'bg-white text-purple-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            Help Given
            {sentHelp.length > 0 && (
              <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                {sentHelp.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading history...</p>
        </div>
      ) : currentItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-900 font-medium mb-2">
            {activeTab === 'received' ? 'No help received yet' : 'No help given yet'}
          </p>
          <p className="text-gray-500 text-sm">
            {activeTab === 'received'
              ? 'When someone helps with your requests, they\'ll appear here'
              : 'When your offers to help are accepted, they\'ll appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentItems.map((item) => {
            const category = getCategoryStyle((item.request as Request & { category?: string }).category || 'other');
            const isReceived = activeTab === 'received';
            
            return (
              <div
                key={`${item.requestID}_${item.offerID}`}
                onClick={() => setSelectedItem(item)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-purple-200 transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="shrink-0">
                    {isReceived ? (
                      item.helperPhotoURL ? (
                        <img
                          src={item.helperPhotoURL}
                          alt={item.helperName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-green-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${category.color}`}>
                        {category.icon && <span className="mr-1">{category.icon}</span>}
                        {category.label}
                      </span>
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                        Connected
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 group-hover:text-purple-900 transition-colors">
                      {item.request.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mt-1">
                      {isReceived ? (
                        <>Helped by <span className="font-medium">{item.helperName}</span></>
                      ) : (
                        <>You helped <span className="font-medium">{item.request.creatorName}</span></>
                      )}
                    </p>
                    
                    <p className="text-xs text-gray-400 mt-2">
                      {getRelativeTime(item.createdAt)}
                    </p>
                  </div>

                  <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Slide-over Panel */}
      {selectedItem && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Panel Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 z-10">
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-lg font-semibold text-gray-900">Connection Details</h2>
            </div>

            {/* Panel Content */}
            <div className="p-6">
              {/* Status Badge */}
              <div className="flex items-center gap-2 mb-4">
                {(() => {
                  const category = getCategoryStyle((selectedItem.request as Request & { category?: string }).category || 'other');
                  return (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${category.color}`}>
                      {category.icon && <span className="mr-1">{category.icon}</span>}
                      {category.label}
                    </span>
                  );
                })()}
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                  Connected
                </span>
              </div>

              {/* Request Title & Description */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {selectedItem.request.title}
              </h3>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                {selectedItem.request.description}
              </p>

              {/* Contact Info Card - This is the main value! */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="font-semibold text-green-800 text-lg">Contact Information</h4>
                </div>
                
                {activeTab === 'received' ? (
                  // User received help - show helper's info
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {selectedItem.helperPhotoURL ? (
                        <img
                          src={selectedItem.helperPhotoURL}
                          alt={selectedItem.helperName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-green-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-green-900">{selectedItem.helperName}</p>
                        <p className="text-sm text-green-700">{selectedItem.helperYear} · {selectedItem.helperMajor}</p>
                      </div>
                    </div>
                    <a
                      href={`mailto:${selectedItem.helperEmail}`}
                      className="flex items-center gap-2 text-green-700 hover:text-green-800 font-medium bg-green-100 px-4 py-2.5 rounded-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {selectedItem.helperEmail}
                    </a>
                  </div>
                ) : (
                  // User gave help - show requester's info
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-green-900">{selectedItem.request.creatorName}</p>
                        <p className="text-sm text-green-700">{selectedItem.request.creatorYear} · {selectedItem.request.creatorMajor}</p>
                      </div>
                    </div>
                    <a
                      href={`mailto:${selectedItem.request.creatorEmail}`}
                      className="flex items-center gap-2 text-green-700 hover:text-green-800 font-medium bg-green-100 px-4 py-2.5 rounded-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {selectedItem.request.creatorEmail}
                    </a>
                  </div>
                )}
              </div>

              {/* Timeline Info */}
              <div className="bg-gray-50 rounded-xl p-5">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Timeline
                </h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Request posted:</span>{' '}
                    {new Date(selectedItem.request.createdAt).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Connection made:</span>{' '}
                    {new Date(selectedItem.createdAt).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
