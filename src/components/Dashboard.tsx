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

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    } else if (!currentUser.year || !currentUser.major) {
      navigate('/create-profile');
    }
  }, [currentUser, navigate]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [checkingOffer, setCheckingOffer] = useState<boolean>(false);
  const [alreadyOffered, setAlreadyOffered] = useState<boolean>(false);
  const [showMyRequestsOnly, setShowMyRequestsOnly] = useState<boolean>(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('hasSeenWelcome', 'true');
  };

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
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const handleRefreshRequests = useCallback(async () => {
    const getAll = async () => {
      try {
        const result = await getAllRequests();
        setRequests(result);
      } catch (err) {
        console.error(err);
      }
    };

    getAll();
  }, []);

  useEffect(() => {
    handleRefreshRequests();
  }, []);

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
      setTimeout(() => setSuccess(''), 3000);
      setSelectedRequest(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to offer help');
    }
  };

  const handleCloseRequest = async (request: Request) => {
    try {
      await updateRequestStatus(request.requestID, 'closed');
      setSuccess('Request closed successfully');
      setTimeout(() => setSuccess(''), 3000);
      await handleRefreshRequests();
      setSelectedRequest(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close request');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Popup */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-8">
            <h2 className="text-3xl font-bold text-purple-900 mb-4 text-center">
              Welcome to Wildcat Help!
            </h2>
            <div className="space-y-4 text-gray-700">
              <p className="text-lg">Here's how to use this platform:</p>
              <ul className="space-y-3 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-purple-900 font-bold mt-1">+</span>
                  <span>
                    Click the <strong>+ button</strong> to create a new request
                    for help
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-900 font-bold mt-1">🔔</span>
                  <span>
                    Check the <strong>bell icon</strong> for notifications when
                    someone offers to help you
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-900 font-bold mt-1">👥</span>
                  <span>
                    Browse requests from other students and{' '}
                    <strong>offer help</strong> by clicking on them
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-900 font-bold mt-1">✓</span>
                  <span>
                    <strong>Accept or decline</strong> offers in your
                    notifications to connect with helpers
                  </span>
                </li>
              </ul>
            </div>
            <button
              onClick={handleCloseWelcome}
              className="w-full mt-6 bg-purple-900 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-800 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900 to-purple-700 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Wildcat Help
            </h1>
            <p className="text-xs text-purple-200">Northwestern University</p>
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setShowRequestForm(true)}
              className="bg-white w-10 h-10 rounded-full hover:bg-purple-100 transition-colors flex items-center justify-center"
              title="Create request"
            >
              <svg
                className="w-5 h-5 text-purple-900"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <div className="relative">
              <button
                onClick={() => navigate('/notifications')}
                className="bg-white text-purple-900 w-10 h-10 rounded-full hover:bg-purple-100 transition-colors flex items-center justify-center"
                title="Notifications"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={() => setShowWelcome(true)}
              className="bg-white text-purple-900 w-10 h-10 rounded-full hover:bg-purple-100 transition-colors flex items-center justify-center font-bold text-xl"
              title="Help"
            >
              ?
            </button>
            <button
              onClick={() => navigate('/profile-settings')}
              className="bg-white text-purple-900 w-10 h-10 rounded-full hover:bg-purple-100 transition-colors"
              title="Profile Settings"
            >
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              )}
            </button>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome, {currentUser?.displayName}!
          </h2>
          <p className="text-gray-600">
            {currentUser?.year} • {currentUser?.major}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {/* Filter toggle */}
        <div className="mb-4">
          <button
            className="bg-purple-700 text-white rounded-lg border px-2 py-1.5"
            onClick={() => setShowMyRequestsOnly(!showMyRequestsOnly)}
          >
            {showMyRequestsOnly ? 'Show all requests' : 'Show only my requests'}
          </button>
        </div>

        {/* Request list or detail view */}
        {!selectedRequest ? (
          <div className="space-y-4">
            {requests.filter(
              (request) =>
                !showMyRequestsOnly || request.creatorID === currentUser?.uid
            ).length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500 mb-4">
                  {showMyRequestsOnly
                    ? 'You have no requests yet'
                    : 'No requests yet'}
                </p>
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="bg-purple-900 text-white px-6 py-2 rounded-lg hover:bg-purple-800 transition-colors"
                >
                  Create the first request
                </button>
              </div>
            ) : (
              requests
                .filter(
                  (request) =>
                    !showMyRequestsOnly ||
                    request.creatorID === currentUser?.uid
                )
                .map((request) => (
                  <div
                    key={request.requestID}
                    onClick={() => setSelectedRequest(request)}
                    className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.title}
                        </h3>
                        <p className="text-gray-600 mt-2">
                          {request.description}
                        </p>
                        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                          <span>By {request.creatorName}</span>
                          <span>
                            {new Date(request.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            request.status === 'open'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {request.status === 'open' ? 'Open' : 'Closed'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <button
              onClick={() => setSelectedRequest(null)}
              className="text-blue-500 hover:text-blue-700 mb-4 flex items-center gap-1"
            >
              ← Back to requests
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {selectedRequest.title}
            </h2>
            <p className="text-gray-600 mb-6">{selectedRequest.description}</p>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Request details
              </h3>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Posted by:</span>{' '}
                {selectedRequest.creatorName}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Year:</span>{' '}
                {selectedRequest.creatorYear}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Major:</span>{' '}
                {selectedRequest.creatorMajor}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Email:</span>{' '}
                {selectedRequest.creatorEmail}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Status:</span>{' '}
                <span
                  className={`font-semibold ${
                    selectedRequest.status === 'open'
                      ? 'text-yellow-600'
                      : 'text-gray-600'
                  }`}
                >
                  {selectedRequest.status === 'open' ? 'Open' : 'Closed'}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Posted:</span>{' '}
                {new Date(selectedRequest.createdAt).toLocaleString()}
              </p>
            </div>

            {currentUser?.uid !== selectedRequest.creatorID &&
              selectedRequest.status === 'open' &&
              (alreadyOffered ? (
                <div className="bg-blue-100 border border-blue-400 text-blue-700 p-4 rounded-lg">
                  <p className="font-semibold">
                    ✓ You already offered help on this request
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => handleOfferHelp(selectedRequest)}
                  disabled={checkingOffer}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  {checkingOffer ? 'Checking...' : 'Offer Help'}
                </button>
              ))}

            {currentUser?.uid === selectedRequest.creatorID && (
              <>
                {selectedRequest.status === 'open' && (
                  <button
                    onClick={() => handleCloseRequest(selectedRequest)}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                  >
                    Close Request
                  </button>
                )}
                {selectedRequest.status === 'closed' && (
                  <div className="bg-gray-100 border border-gray-400 text-gray-700 p-4 rounded-lg">
                    <p className="font-semibold">This request is closed</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {showRequestForm && (
        <RequestForm
          onClose={() => setShowRequestForm(false)}
          onSuccess={() => {
            handleRefreshRequests();
            setError('');
          }}
        />
      )}
    </div>
  );
}
