import { io } from "socket.io-client";
import { getAuthToken } from "../auth/auth";

// Get base URL from environment variable
// VITE_API_URL might include /api suffix, we need to remove it for socket connection
const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:4000/api";
const BASE = API_URL.replace(/\/api\/?$/, "").replace(/\/$/, "");

console.log("🔌 Socket.IO connecting to:", BASE);

/**
 * Socket.IO Service for real-time communication with backend
 */
class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventListeners = new Map();
  }

  /**
   * Connect to Socket.IO server
   */
  connect() {
    // If already connected, don't create new connection
    if (this.socket?.connected) {
      console.log("🔌 Socket already connected, socket ID:", this.socket.id);
      return this.socket;
    }

    // If socket exists but disconnected, try to reconnect
    if (this.socket && !this.socket.connected) {
      console.log("🔌 Socket exists but disconnected, reconnecting...");
      this.socket.connect();
      return this.socket;
    }

    const token = getAuthToken();
    if (!token) {
      console.warn("⚠️ No auth token available for socket connection");
      return null;
    }

    try {
      console.log("🔌 Attempting to connect to Socket.IO server:", BASE);
      this.socket = io(BASE, {
        auth: {
          token: token,
        },
        transports: ["websocket", "polling"],
        forceNew: true,
        timeout: 5000,
      });

      // Connection event handlers
      this.socket.on("connect", () => {
        console.log("✅ Connected to Socket.IO server");
        console.log("   Socket ID:", this.socket.id);
        this.isConnected = true;
      });

      this.socket.on("disconnect", (reason) => {
        console.log("❌ Disconnected from Socket.IO server:", reason);
        this.isConnected = false;
      });

      this.socket.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error.message);
        console.error("   Make sure backend is running on:", BASE);
        this.isConnected = false;
      });

      // Handle new notifications
      this.socket.on("notification:new", (notification) => {
        console.log("📩 New notification received:", notification);
        this.emit("notification:new", notification);
      });

      // Handle notification count updates
      this.socket.on("notification:count", (data) => {
        this.emit("notification:count", data);
      });

      // Handle notification read updates
      this.socket.on("notification:read", (data) => {
        this.emit("notification:read", data);
      });

      return this.socket;
    } catch (error) {
      console.error("Failed to initialize socket connection:", error);
      return null;
    }
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Subscribe to notifications
   */
  subscribeToNotifications() {
    if (!this.socket) {
      console.warn("Socket not connected, cannot subscribe to notifications");
      return;
    }

    this.socket.emit("subscribe:notifications");
    console.log("📬 Subscribed to notifications");
  }

  /**
   * Unsubscribe from notifications
   */
  unsubscribeFromNotifications() {
    if (!this.socket) return;

    this.socket.emit("unsubscribe:notifications");
    console.log("📭 Unsubscribed from notifications");
  }

  /**
   * Mark notification as read
   */
  markNotificationAsRead(notificationId) {
    if (!this.socket) {
      console.warn("Socket not connected, cannot mark notification as read");
      return;
    }

    this.socket.emit("notification:read", { notificationId });
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
    console.log(
      `🎧 Listener registered for '${event}' (total: ${
        this.eventListeners.get(event).length
      })`
    );
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (!this.eventListeners.has(event)) return;

    const listeners = this.eventListeners.get(event);
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    if (!this.eventListeners.has(event)) {
      console.warn("⚠️ No listeners registered for event:", event);
      return;
    }

    const listeners = this.eventListeners.get(event);
    console.log(`📢 Emitting '${event}' to ${listeners.length} listener(s)`);

    listeners.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error("Error in event listener:", error);
      }
    });
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socket: this.socket,
    };
  }

  /**
   * Check if socket is connected
   */
  isSocketConnected() {
    return this.socket?.connected || false;
  }
}

// Create singleton instance
export const socketService = new SocketService();

// Export to window for debugging
if (typeof window !== "undefined") {
  window.socketServiceDebug = socketService;
  console.log("🔧 socketService available at window.socketServiceDebug");
}

export default socketService;
