import { useState, useEffect } from 'react';
import { useAuth } from '../utilities/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { Notification, Request } from '../types/index';
import {
  getRequest,
  updateOfferStatus,
  getPendingNotifications,
} from '../utilities/database';

export default function NotificationsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [requestsMap, setRequestsMap] = useState<Record<string, Request>>({});
  const [acceptedNotifications, setAcceptedNotifications] = useState<
    Set<string>
  >(new Set());

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    } else if (!currentUser.year || !currentUser.major) {
      navigate('/create-profile');
    }
  }, [currentUser, navigate]);

  const refreshNotifications = async () => {
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
  };

  useEffect(() => {
    refreshNotifications();
  }, [currentUser]);

  useEffect(() => {
    const fetchRequests = async () => {
      const requests: Record<string, Request> = {};
      for (const notification of notifications) {
        if (!requests[notification.requestID]) {
          const request = await getRequest(notification.requestID);
          if (request) {
            requests[notification.requestID] = request;
          }
        }
      }
      setRequestsMap(requests);
    };
    fetchRequests();
  }, [notifications]);

  const handleAcceptOffer = async (notification: Notification) => {
    try {
      await updateOfferStatus(
        notification.requestID,
        notification.offerID,
        'accepted'
      );
      setAcceptedNotifications((prev) =>
        new Set(prev).add(notification.notificationID)
      );
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept offer');
    }
  };

  const handleDeclineOffer = async (notification: Notification) => {
    try {
      await updateOfferStatus(
        notification.requestID,
        notification.offerID,
        'declined'
      );
      refreshNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline offer');
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
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-white text-purple-900 px-4 py-2 rounded-lg hover:bg-purple-100 transition-colors font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Notifications</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const request = requestsMap[notification.requestID];
              const effectiveStatus = acceptedNotifications.has(
                notification.notificationID
              )
                ? 'accepted'
                : notification.status;

              return (
                <div
                  key={notification.notificationID}
                  className={`bg-white p-6 border rounded-lg shadow-sm ${
                    notification.read
                      ? 'border-gray-200'
                      : 'border-purple-300 bg-purple-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={notification.helperPhotoURL}
                        alt={notification.helperName}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {notification.helperName} offered help
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {effectiveStatus === 'pending'
                            ? 'Waiting for your response'
                            : 'You accepted this offer'}
                        </p>
                      </div>
                    </div>
                    {effectiveStatus === 'accepted' && (
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-semibold">
                        ✓ Accepted
                      </div>
                    )}
                  </div>

                  {request && (
                    <div className="bg-white border border-gray-300 p-3 rounded-lg mb-3">
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        Request: {request.title}
                      </p>
                      <p className="text-sm text-gray-700">
                        {request.description}
                      </p>
                    </div>
                  )}

                  <div className="bg-gray-50 p-3 rounded-lg mb-3 border border-gray-200">
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Helper Profile
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Name:</span>{' '}
                      {notification.helperName}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Year:</span>{' '}
                      {notification.helperYear}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Major:</span>{' '}
                      {notification.helperMajor}
                    </p>
                  </div>

                  {effectiveStatus === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleAcceptOffer(notification)}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineOffer(notification)}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  {effectiveStatus === 'accepted' && (
                    <div className="bg-green-100 border border-green-400 text-green-800 p-3 rounded-lg mt-3">
                      <p className="text-sm font-semibold">
                        Contact Information
                      </p>
                      <p className="text-sm mt-1">
                        <span className="font-semibold">Email:</span>{' '}
                        <span className="font-mono">
                          {notification.helperEmail}
                        </span>
                      </p>
                      <p className="text-xs text-green-700 mt-2">
                        Please reach out to coordinate your meet-up
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
