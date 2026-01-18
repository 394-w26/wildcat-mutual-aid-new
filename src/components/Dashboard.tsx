import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../utilities/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  getAllRequests,
  getNotificationsByUser,
  createOffer,
  createNotification,
  getOfferByRequestAndHelper,
} from '../utilities/database';
import type { Request, Notification } from '../types/index';
import RequestForm from './RequestForm';
import NotificationCenter from './NotificationCenter';

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
  const [showNotifications, setShowNotifications] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(
    currentUser ? getNotificationsByUser(currentUser.uid) : []
  );
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [checkingOffer, setCheckingOffer] = useState<boolean>(false);
  const [alreadyOffered, setAlreadyOffered] = useState<boolean>(false);

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

  const unreadCount = notifications.filter((n) => !n.read).length;
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


  const handleRefreshNotifications = useCallback(() => {
    if (currentUser) {
      setNotifications(getNotificationsByUser(currentUser.uid));
    }
  }, [currentUser]);

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
      const offer = await createOffer(
        request.requestID,
        currentUser.uid,
        currentUser.email,
        currentUser.displayName
      );

      // createNotification(
      //   request.creatorID,
      //   offer.offerID,
      //   request.requestID,
      //   currentUser.uid,
      //   currentUser.displayName,
      //   currentUser.email,
      //   currentUser.year,
      //   currentUser.major,
      //   'pending'
      // );

      setSuccess(`Offer sent to ${request.creatorName}!`);
      setTimeout(() => setSuccess(''), 3000);
      setSelectedRequest(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to offer help');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900 to-purple-700 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Wildcat Mutual Aid
            </h1>
            <p className="text-xs text-purple-200">Northwestern University</p>
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setShowRequestForm(true)}
              className="bg-white text-purple-900 p-2 rounded-full hover:bg-purple-100 transition-colors font-bold text-xl"
              title="Create request"
            >
              +
            </button>
            <div className="relative">
              <button
                onClick={() => setShowNotifications(true)}
                className="bg-white text-purple-900 p-2 rounded-full hover:bg-purple-100 transition-colors"
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

        {/* Request list or detail view */}
        {!selectedRequest ? (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500 mb-4">No requests yet</p>
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="bg-purple-900 text-white px-6 py-2 rounded-lg hover:bg-purple-800 transition-colors"
                >
                  Create the first request
                </button>
              </div>
            ) : (
              requests.map((request) => (
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
                            : request.status === 'accepted'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {request.status === 'open'
                          ? 'Open'
                          : request.status === 'accepted'
                            ? 'Accepted'
                            : 'Closed'}
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
                      : selectedRequest.status === 'accepted'
                        ? 'text-green-600'
                        : 'text-gray-600'
                  }`}
                >
                  {selectedRequest.status === 'open'
                    ? 'Open'
                    : selectedRequest.status === 'accepted'
                      ? 'Accepted'
                      : 'Closed'}
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

            {selectedRequest.status === 'accepted' && (
              <div className="bg-green-100 border border-green-400 text-green-700 p-4 rounded-lg">
                <p className="font-semibold">This request has been accepted</p>
              </div>
            )}

            {currentUser?.uid === selectedRequest.creatorID &&
              selectedRequest.status === 'closed' && (
                <div className="bg-gray-100 border border-gray-400 text-gray-700 p-4 rounded-lg">
                  <p className="font-semibold">This request is closed</p>
                </div>
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

      {showNotifications && (
        <NotificationCenter
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onNotificationUpdate={handleRefreshNotifications}
        />
      )}
    </div>
  );
}
