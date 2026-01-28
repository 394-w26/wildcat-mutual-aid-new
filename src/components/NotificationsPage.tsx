import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../utilities/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { Notification, Request } from '../types/index';
import {
  getRequest,
  updateOfferStatus,
  getPendingNotifications,
} from '../utilities/database';
import Layout from './Layout';
import { getCategoryStyle } from './Dashboard';

export default function NotificationsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [requestsMap, setRequestsMap] = useState<Record<string, Request>>({});
  const [acceptedNotifications, setAcceptedNotifications] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    } else if (!currentUser.year || !currentUser.major) {
      navigate('/create-profile');
    }
  }, [currentUser, navigate]);

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
  }, [refreshNotifications]);

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

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read && !acceptedNotifications.has(n.notificationID)).length,
    [notifications, acceptedNotifications]
  );

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
    <Layout unreadCount={unreadCount}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
        <p className="text-gray-600 mt-1">People who want to help you</p>
      </div>

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

      {notifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="text-gray-900 font-medium mb-2">No notifications yet</p>
          <p className="text-gray-500 text-sm">When someone offers to help with your requests, you'll see it here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => {
            const request = requestsMap[notification.requestID];
            const effectiveStatus = acceptedNotifications.has(notification.notificationID)
              ? 'accepted'
              : notification.status;
            const category = getCategoryStyle((request as Request & { category?: string })?.category || 'other');

            return (
              <div
                key={notification.notificationID}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${
                  effectiveStatus === 'pending'
                    ? 'border-purple-200 bg-gradient-to-r from-purple-50/50 to-white'
                    : 'border-gray-100'
                }`}
              >
                {/* Header */}
                <div className="px-5 py-4">
                  <div className="flex items-start gap-4">
                    {/* Helper Avatar */}
                    <div className="shrink-0">
                      {notification.helperPhotoURL ? (
                        <img
                          src={notification.helperPhotoURL}
                          alt={notification.helperName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">
                          {notification.helperName}
                        </h3>
                        {effectiveStatus === 'accepted' && (
                          <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                            Accepted
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {notification.helperYear} · {notification.helperMajor}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {getRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Request Context */}
                  {request && (
                    <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${category.color}`}>
                          {category.icon && <span className="mr-1">{category.icon}</span>}
                          {category.label}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900 text-sm">
                        {request.title}
                      </p>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                        {request.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {effectiveStatus === 'pending' && (
                  <div className="px-5 pb-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAcceptOffer(notification)}
                        className="flex-1 bg-green-600 text-white py-2.5 px-4 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineOffer(notification)}
                        className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}

                {/* Contact Info - shown after accepting */}
                {effectiveStatus === 'accepted' && (
                  <div className="px-5 pb-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="font-semibold text-green-800">
                          Contact Information
                        </p>
                      </div>
                      <a
                        href={`mailto:${notification.helperEmail}`}
                        className="flex items-center gap-2 text-green-700 hover:text-green-800 font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {notification.helperEmail}
                      </a>
                      <p className="text-green-600 text-sm mt-2">
                        Reach out to coordinate your meet-up!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
