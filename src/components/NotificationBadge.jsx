import React, { useState, useEffect } from "react";
import { notificationPoller } from "../services/notificationService";
import { useSocket } from "../hooks/useSocket";
import "./NotificationBadge.css";

/**
 * NotificationBadge Component
 * Displays unread notification count with visual indicator
 */
export default function NotificationBadge({ children, onClick }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const { isConnected, onNotification } = useSocket();

  useEffect(() => {
    // Set initial count
    setUnreadCount(notificationPoller.getCurrentCount());

    // Add listener for count changes from polling
    const handleCountChange = (count) => {
      setUnreadCount(count);
    };

    notificationPoller.addListener(handleCountChange);

    // Cleanup
    return () => {
      notificationPoller.removeListener(handleCountChange);
    };
  }, []);

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = onNotification(() => {
      // Immediately refresh count when new notification arrives
      notificationPoller.refresh().catch(console.error);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isConnected, onNotification]);

  const handleClick = (event) => {
    if (onClick) {
      onClick(event);
    }
  };

  return (
    <div className="notification-badge-container" onClick={handleClick}>
      {children}
      {unreadCount > 0 && (
        <span className="notification-badge">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </div>
  );
}
