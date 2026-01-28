import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '../utilities/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  getAllRequests,
  createOffer,
  getOfferByRequestAndHelper,
  getPendingNotifications,
  updateRequestStatus,
} from '../utilities/database';
import type { Request, Notification } from '../types/index';
import RequestForm from './RequestForm';
import Layout from './Layout';

// Request categories with colors and icons
const CATEGORIES = [
  { id: 'all', label: 'All', color: 'bg-gray-100 text-gray-700', activeColor: 'bg-purple-900 text-white' },
  { id: 'rides', label: 'Rides', color: 'bg-blue-100 text-blue-700', activeColor: 'bg-blue-600 text-white', icon: '🚗' },
  { id: 'tutoring', label: 'Tutoring', color: 'bg-green-100 text-green-700', activeColor: 'bg-green-600 text-white', icon: '📚' },
  { id: 'errands', label: 'Errands', color: 'bg-orange-100 text-orange-700', activeColor: 'bg-orange-600 text-white', icon: '🛒' },
  { id: 'moving', label: 'Moving', color: 'bg-purple-100 text-purple-700', activeColor: 'bg-purple-600 text-white', icon: '📦' },
  { id: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700', activeColor: 'bg-gray-600 text-white', icon: '💬' },
];

export function getCategoryStyle(categoryId: string) {
  const category = CATEGORIES.find(c => c.id === categoryId);
  return category || CATEGORIES[CATEGORIES.length - 1];
}

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    } else if (!currentUser.year || !currentUser.major) {
      navigate('/create-profile');
    }
  }, [currentUser, navigate]);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [checkingOffer, setCheckingOffer] = useState<boolean>(false);
  const [alreadyOffered, setAlreadyOffered] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'mine' | 'offer'>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [userOffers, setUserOffers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkOffer = async () => {
      if (selectedRequest && currentUser) {
        setCheckingOffer(true);
        try {
          const offer = await getOfferByRequestAndHelper(
            selectedRequest.requestID,
            currentUser.uid
          );
          setAlreadyOffered(!!offer);
        } catch (err) {
          console.error('Error checking offer:', err);
          setAlreadyOffered(false);
        } finally {
          setCheckingOffer(false);
        }
      } else {
        setAlreadyOffered(false);
      }
    };
    checkOffer();
  }, [selectedRequest, currentUser]);

  const refreshNotifications = useCallback(async () => {
    if (currentUser) {
      try {
        const pendingOffers = await getPendingNotifications(currentUser.uid);
        const notificationsToDisplay: Notification[] = pendingOffers.map(
          (offer) => ({
            notificationID: `${offer.requestID}_${offer.offerID}`,
            userID: currentUser.uid,
            offerID: offer.offerID,
            requestID: offer.requestID,
            helperID: offer.helperID,
            helperName: offer.helperName,
            helperEmail: offer.helperEmail,
            helperYear: offer.helperYear,
            helperMajor: offer.helperMajor,
            helperPhotoURL: offer.helperPhotoURL,
            status: offer.status as 'pending' | 'accepted',
            createdAt: offer.createdAt,
            read: false,
          })
        );
        setNotifications(notificationsToDisplay);
      } catch (err) {
        console.error('Error refreshing notifications:', err);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    refreshNotifications();
    const notificationInterval = setInterval(refreshNotifications, 5000);
    return () => clearInterval(notificationInterval);
  }, [refreshNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const handleRefreshRequests = useCallback(async () => {
    const getAll = async () => {
      try {
        const result = await getAllRequests();
        setRequests(result);
        
        // Build set of requests where user has offered help
        if (currentUser) {
          const offersSet = new Set<string>();
          for (const request of result) {
            const offer = await getOfferByRequestAndHelper(
              request.requestID,
              currentUser.uid
            );
            if (offer) {
              offersSet.add(request.requestID);
            }
          }
          setUserOffers(offersSet);
        }
      } catch (err) {
        console.error(err);
      }
    };

    getAll();
  }, [currentUser]);

  useEffect(() => {
    handleRefreshRequests();
    const requestInterval = setInterval(handleRefreshRequests, 5000);
    return () => clearInterval(requestInterval);
  }, [handleRefreshRequests]);

  const handleOfferHelp = async (request: Request) => {
    if (
      !currentUser ||
      !currentUser.email ||
      !currentUser.displayName ||
      !currentUser.year ||
      !currentUser.major
    )
      return;

    try {
      await createOffer(
        request.requestID,
        currentUser.uid,
        currentUser.email,
        currentUser.displayName,
        currentUser.year,
        currentUser.major,
        currentUser.photoURL || ''
      );

      setSuccess(`Offer sent to ${request.creatorName}!`);
      setTimeout(() => setSuccess(''), 4000);
      setSelectedRequest(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to offer help');
    }
  };

  const handleCloseRequest = async (request: Request) => {
    try {
      await updateRequestStatus(request.requestID, 'closed');
      setSuccess('Request closed successfully');
      setTimeout(() => setSuccess(''), 4000);
      await handleRefreshRequests();
      setSelectedRequest(null);
      setShowCloseConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close request');
    }
  };

  // Filter requests based on active filters
  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      // Filter by ownership
      if (activeFilter === 'mine' && request.creatorID !== currentUser?.uid) {
        return false;
      }
      // Filter by offers user has made
      if (activeFilter === 'offer' && !userOffers.has(request.requestID)) {
        return false;
      }
      // Filter by category
      if (activeCategory !== 'all') {
        const requestCategory = (request as Request & { category?: string }).category || 'other';
        if (requestCategory !== activeCategory) {
          return false;
        }
      }
      return true;
    });
  }, [requests, activeFilter, activeCategory, currentUser?.uid, userOffers]);

  // Helper function for relative time
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

  return (
    <Layout unreadCount={unreadCount} onCreateRequest={() => setShowRequestForm(true)}>
      {/* Welcome Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back, {currentUser?.displayName?.split(' ')[0]}!
        </h2>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
          <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
          <button onClick={() => setSuccess('')} className="ml-auto text-green-500 hover:text-green-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-4">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeFilter === 'all'
                ? 'bg-white text-purple-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Requests
          </button>
          <button
            onClick={() => setActiveFilter('mine')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeFilter === 'mine'
                ? 'bg-white text-purple-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Requests
          </button>
          <button
            onClick={() => setActiveFilter('offer')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeFilter === 'offer'
                ? 'bg-white text-purple-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Offers Sent
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6 overflow-x-auto pb-2 -mx-4 px-4">
        <div className="flex gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
                activeCategory === category.id
                  ? category.activeColor
                  : category.color + ' hover:opacity-80'
              }`}
            >
              {category.icon && <span className="mr-1">{category.icon}</span>}
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Request List */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-500 mb-4">
              {activeFilter === 'mine'
                ? 'You haven\'t created any requests yet'
                : 'No requests found'}
            </p>
            <button
              onClick={() => setShowRequestForm(true)}
              className="bg-purple-900 text-white px-6 py-2.5 rounded-xl hover:bg-purple-800 transition-colors font-semibold"
            >
              Create a Request
            </button>
          </div>
        ) : (
          filteredRequests.map((request) => {
            const category = getCategoryStyle((request as Request & { category?: string }).category || 'other');
            return (
              <div
                key={request.requestID}
                onClick={() => setSelectedRequest(request)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-purple-200 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${category.color}`}>
                        {category.icon && <span className="mr-1">{category.icon}</span>}
                        {category.label}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          request.status === 'open'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {request.status === 'open' ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-900 transition-colors">
                      {request.title}
                    </h3>
                    <p className="text-gray-600 mt-1 line-clamp-2">
                      {request.description}
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {request.creatorName}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {getRelativeTime(request.createdAt)}
                      </span>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Request Detail Slide-over Panel */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelectedRequest(null)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Panel Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 z-10">
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-lg font-semibold text-gray-900">Request Details</h2>
            </div>

            {/* Panel Content */}
            <div className="p-6">
              {/* Category & Status */}
              <div className="flex items-center gap-2 mb-4">
                {(() => {
                  const category = getCategoryStyle((selectedRequest as Request & { category?: string }).category || 'other');
                  return (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${category.color}`}>
                      {category.icon && <span className="mr-1">{category.icon}</span>}
                      {category.label}
                    </span>
                  );
                })()}
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedRequest.status === 'open'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {selectedRequest.status === 'open' ? 'Open' : 'Closed'}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {selectedRequest.title}
              </h3>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">{selectedRequest.description}</p>

              {/* Requester Info Card */}
              <div className="bg-gray-50 rounded-xl p-5 mb-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Posted by
                </h4>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <span className="font-medium">{selectedRequest.creatorName}</span>
                  </p>
                  <p className="text-gray-600 text-sm">
                    {selectedRequest.creatorYear} · {selectedRequest.creatorMajor}
                  </p>
                  <p className="text-gray-500 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Posted {getRelativeTime(selectedRequest.createdAt)}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              {currentUser?.uid !== selectedRequest.creatorID &&
                selectedRequest.status === 'open' && (
                  <>
                    {alreadyOffered ? (
                      <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-xl flex items-center gap-3">
                        <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="font-semibold">You've offered to help!</p>
                          <p className="text-sm text-blue-600">Waiting for {selectedRequest.creatorName} to respond</p>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOfferHelp(selectedRequest)}
                        disabled={checkingOffer}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                      >
                        {checkingOffer ? (
                          <>
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Checking...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            Offer to Help
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}

              {currentUser?.uid === selectedRequest.creatorID && (
                <>
                  {selectedRequest.status === 'open' && !showCloseConfirm && (
                    <button
                      onClick={() => setShowCloseConfirm(true)}
                      className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Close Request
                    </button>
                  )}
                  {showCloseConfirm && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-red-700 font-medium mb-3">
                        Are you sure you want to close this request?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowCloseConfirm(false)}
                          className="flex-1 py-2 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleCloseRequest(selectedRequest)}
                          className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                        >
                          Close Request
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedRequest.status === 'closed' && (
                    <div className="bg-gray-100 border border-gray-300 text-gray-700 p-4 rounded-xl">
                      <p className="font-semibold">This request has been closed</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Request Modal */}
      {showRequestForm && (
        <RequestForm
          onClose={() => setShowRequestForm(false)}
          onSuccess={() => {
            handleRefreshRequests();
            setError('');
          }}
        />
      )}
    </Layout>
  );
}
