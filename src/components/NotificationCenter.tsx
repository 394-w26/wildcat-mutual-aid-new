import { useState } from 'react';
import type { Notification } from '../types/index';
import { updateNotificationStatus, markNotificationAsRead, updateRequestStatus, getRequest, deleteNotification } from '../utilities/database';

interface NotificationCenterProps {
  notifications: Notification[];
  onClose: () => void;
  onNotificationUpdate: () => void;
}

export default function NotificationCenter({
  notifications,
  onClose,
  onNotificationUpdate,
}: NotificationCenterProps) {
  const [error, setError] = useState('');

  const handleAcceptOffer = (notification: Notification) => {
    try {
      markNotificationAsRead(notification.notificationID);
      updateNotificationStatus(notification.notificationID, 'accepted');
      updateRequestStatus(notification.requestID, 'accepted');
      onNotificationUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept offer');
    }
  };

  const handleDeclineOffer = (notification: Notification) => {
    try {
      // Remove the notification completely when declined
      deleteNotification(notification.notificationID);
      onNotificationUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline offer');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {notifications.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No notifications yet</p>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const request = getRequest(notification.requestID);
              return (
                <div
                  key={notification.notificationID}
                  className={`p-4 border rounded-lg ${
                    notification.read
                      ? 'border-gray-200 bg-white'
                      : 'border-purple-300 bg-purple-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {notification.helperName} offered help
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.status === 'pending'
                          ? 'Waiting for your response'
                          : 'You accepted this offer'}
                      </p>
                    </div>
                    {notification.status === 'accepted' && (
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
                    <p className="text-sm font-semibold text-gray-900 mb-2">Helper Profile</p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Name:</span> {notification.helperName}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Year:</span> {notification.helperYear}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Major:</span> {notification.helperMajor}
                    </p>
                  </div>

                  {notification.status === 'accepted' && (
                    <div className="bg-green-100 border border-green-400 text-green-800 p-3 rounded-lg mb-3">
                      <p className="text-sm font-semibold">Contact Information</p>
                      <p className="text-sm mt-1">
                        <span className="font-semibold">Email:</span>{' '}
                        <span className="font-mono">{notification.helperEmail}</span>
                      </p>
                      <p className="text-xs text-green-700 mt-2">
                        Please reach out to coordinate your meet-up
                      </p>
                    </div>
                  )}

                  {notification.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptOffer(notification)}
                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineOffer(notification)}
                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
