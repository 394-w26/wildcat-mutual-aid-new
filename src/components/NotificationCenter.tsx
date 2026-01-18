import { useState, useEffect } from "react";
import type { Notification, Request } from "../types/index";
import {
  updateRequestStatus,
  getRequest,
  updateOfferStatus,
} from "../utilities/database";

interface NotificationCenterProps {
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  onClose: () => void;
  onNotificationUpdate: () => void;
}

export default function NotificationCenter({
  notifications,
  onClose,
  onNotificationUpdate,
  setNotifications,
}: NotificationCenterProps) {
  const [error, setError] = useState("");
  const [requestsMap, setRequestsMap] = useState<Record<string, Request>>({});

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
      // Update the offer and request status in the database
      await updateOfferStatus(
        notification.requestID,
        notification.offerID,
        "accepted"
      );
      await updateRequestStatus(notification.requestID, "accepted");

      // Update the notification status to 'accepted' in the notifications array
      const updatedNotifications = notifications.map((n) =>
        n.notificationID === notification.notificationID
          ? { ...n, status: "accepted" }
          : n
      );

      // Update the state to reflect the changes in the UI
      setNotifications(updatedNotifications as Notification[]);
      onNotificationUpdate(); // Trigger any external updates if necessary
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept offer");
    }
  };

  const handleDeclineOffer = async (notification: Notification) => {
    try {
      // Remove the declined notification from the list
      const updatedNotifications = notifications.filter(
        (n) => n.notificationID !== notification.notificationID
      );
      setNotifications(updatedNotifications);
      onNotificationUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decline offer");
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
              const request = requestsMap[notification.requestID];
              return (
                <div
                  key={notification.notificationID}
                  className={`p-4 border rounded-lg ${
                    notification.read
                      ? "border-gray-200 bg-white"
                      : "border-purple-300 bg-purple-50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {notification.helperName} offered help
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.status === "pending"
                          ? "Waiting for your response"
                          : "You accepted this offer"}
                      </p>
                    </div>
                    {notification.status === "accepted" && (
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
                      <span className="font-semibold">Name:</span>{" "}
                      {notification.helperName}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Year:</span>{" "}
                      {notification.helperYear}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Major:</span>{" "}
                      {notification.helperMajor}
                    </p>
                  </div>

                  {notification.status === "pending" && (
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

                  {notification.status === "accepted" && (
                    <div className="bg-green-100 border border-green-400 text-green-800 p-3 rounded-lg mt-3">
                      <p className="text-sm font-semibold">
                        Contact Information
                      </p>
                      <p className="text-sm mt-1">
                        <span className="font-semibold">Email:</span>{" "}
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
      </div>
    </div>
  );
}
