import { useEffect, useRef, useState, useCallback } from "react";
import socketService from "../services/socketService";
import { getAuthToken } from "../auth/auth";

/**
 * Custom hook for managing Socket.IO connection and notifications
 */
export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const notificationCallbackRef = useRef(null);
  const readCallbackRef = useRef(null);

  // Connect to socket when component mounts and user is authenticated
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    // Connect to socket
    const socket = socketService.connect();
    if (!socket) return;

    // Update connection status
    const updateConnectionStatus = () => {
      setIsConnected(socketService.isSocketConnected());
    };

    // Listen for connection changes
    socket.on("connect", updateConnectionStatus);
    socket.on("disconnect", updateConnectionStatus);
    socket.on("connect_error", updateConnectionStatus);

    // Subscribe to notifications
    socketService.subscribeToNotifications();

    // Listen for notification count updates
    const handleNotificationCount = (data) => {
      setNotificationCount(data.unread_count || 0);
    };
    socketService.on("notification:count", handleNotificationCount);

    // Listen for new notifications
    const handleNewNotification = (notification) => {
      console.log("🎧 [useSocket] handleNewNotification called:", notification);
      console.log(
        "🎧 [useSocket] notificationCallbackRef.current:",
        !!notificationCallbackRef.current
      );

      if (notificationCallbackRef.current) {
        console.log("🎧 [useSocket] Calling callback...");
        notificationCallbackRef.current(notification);
      } else {
        console.warn(
          "⚠️ [useSocket] No callback registered! Notification ignored."
        );
      }
      // Update count (increment by 1 for new notification)
      setNotificationCount((prev) => prev + 1);
    };
    socketService.on("notification:new", handleNewNotification);

    // Listen for notification read updates
    const handleNotificationRead = (data) => {
      if (readCallbackRef.current) {
        readCallbackRef.current(data);
      }
      // Update count (decrement by 1 when notification is read)
      setNotificationCount((prev) => Math.max(0, prev - 1));
    };
    socketService.on("notification:read", handleNotificationRead);

    // Initial connection status
    updateConnectionStatus();

    // Cleanup function
    return () => {
      socket.off("connect", updateConnectionStatus);
      socket.off("disconnect", updateConnectionStatus);
      socket.off("connect_error", updateConnectionStatus);

      socketService.off("notification:count", handleNotificationCount);
      socketService.off("notification:new", handleNewNotification);
      socketService.off("notification:read", handleNotificationRead);

      // Don't disconnect socket here as it might be used by other components
      // socketService.unsubscribeFromNotifications();
    };
  }, []);

  // Callback to handle new notifications
  const onNotification = useCallback((callback) => {
    console.log("🎯 [useSocket] onNotification called, registering callback");
    notificationCallbackRef.current = callback;
  }, []);

  // Callback to handle notification read events
  const onNotificationRead = useCallback((callback) => {
    readCallbackRef.current = callback;
  }, []);

  // Mark notification as read
  const markNotificationAsRead = useCallback((notificationId) => {
    socketService.markNotificationAsRead(notificationId);
  }, []);

  // Disconnect socket (cleanup)
  const disconnect = useCallback(() => {
    socketService.disconnect();
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    notificationCount,
    onNotification,
    onNotificationRead,
    markNotificationAsRead,
    disconnect,
  };
}

export default useSocket;
