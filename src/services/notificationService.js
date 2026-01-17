/**
 * Notification Service
 * Handles all notification-related API calls
 */

import { api } from "../lib/api";

export const NotificationService = {
  /**
   * Get paginated list of notifications
   * @param {Object} params - Pagination and filter parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 20)
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  getNotifications: (params = {}) => {
    const queryParams = new URLSearchParams();
    queryParams.append("page", String(params.page || 1));
    queryParams.append("limit", String(params.limit || 20));

    const query = queryParams.toString();
    // Normalize backend response to frontend-friendly shape.
    // Backend may return:
    // 1) { data: [...], pagination: { ... } }
    // 2) { notifications: [...] }
    // 3) an array directly [...]
    return api
      .get(`/api/notifications${query ? `?${query}` : ""}`)
      .then((res) => {
        const payload = res || {};

        // extract items from several possible shapes
        let items = [];
        if (Array.isArray(payload)) {
          items = payload;
        } else if (Array.isArray(payload.data)) {
          items = payload.data;
        } else if (Array.isArray(payload.notifications)) {
          items = payload.notifications;
        } else if (Array.isArray(payload.items)) {
          items = payload.items;
        }

        const pagSrc =
          payload.pagination || payload.meta || payload.paging || {};

        const normalized = (items || []).map((n) => ({
          id: n.id,
          title: n.title || null,
          // UI expects `message` and `created_at` and `data` keys
          message: n.content || n.title || n.message || "",
          created_at: n.sent_at || n.created_at || n.timestamp || null,
          data: n.metadata || n.data || {},
          action_url: n.action_url || n.actionUrl || null,
          action_text: n.action_text || n.actionText || null,
          is_read: !!(n.read === true || n.is_read === true),
          raw: n,
        }));

        return {
          data: normalized,
          pagination: {
            page: pagSrc.current_page || pagSrc.page || 1,
            limit: pagSrc.per_page || pagSrc.limit || params.limit || 20,
            total: pagSrc.total_count || pagSrc.total || normalized.length,
            total_pages: pagSrc.total_pages || 1,
          },
        };
      });
  },

  /**
   * Get unread notification count
   * @returns {Promise<{data: {count: number}}>}
   */
  getUnreadCount: () => api.get("/api/notifications/unread-count"),

  /**
   * Mark all notifications as read
   * @returns {Promise<{message: string}>}
   */
  markAllAsRead: () => api.patch("/api/notifications/mark-all-read"),

  /**
   * Mark a specific notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<{message: string}>}
   */
  markAsRead: (notificationId) =>
    api.patch(`/api/notifications/${notificationId}/read`),

  /**
   * Delete a notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise<{message: string}>}
   */
  deleteNotification: (notificationId) =>
    api.del(`/api/notifications/${notificationId}`),
};

/**
 * Notification polling utilities
 */
export class NotificationPoller {
  constructor() {
    this.intervalId = null;
    this.listeners = new Set();
    this.unreadCount = 0;
    this.isRefreshing = false; // Prevent concurrent refreshes
  }

  /**
   * Start polling for unread count
   * @param {number} intervalMs - Polling interval in milliseconds (default: 30000)
   */
  startPolling(intervalMs = 30000) {
    if (this.intervalId) {
      this.stopPolling();
    }

    // Immediately refresh once, then start interval polling
    this.refresh();

    this.intervalId = setInterval(async () => {
      try {
        const response = await NotificationService.getUnreadCount();
        // Backend returns { unread_count, by_type } - normalize to { data: { count } }
        const payload = response?.data || response || {};
        // support both shapes
        const newCount =
          (payload.count !== undefined && payload.count) ||
          payload.unread_count ||
          payload.unreadCount ||
          0;

        if (newCount !== this.unreadCount) {
          this.unreadCount = newCount;
          this.notifyListeners(newCount);
        }
      } catch (error) {
        console.error("Failed to poll notification count:", error);
      }
    }, intervalMs);
  }

  /**
   * Stop polling
   */
  stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Add listener for unread count changes
   * @param {Function} callback - Callback function that receives the new count
   */
  addListener(callback) {
    this.listeners.add(callback);
  }

  /**
   * Remove listener
   * @param {Function} callback - Callback function to remove
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of count change
   * @param {number} count - New unread count
   */
  notifyListeners(count) {
    this.listeners.forEach((callback) => {
      try {
        callback(count);
      } catch (error) {
        console.error("Error in notification listener:", error);
      }
    });
  }

  /**
   * Get current unread count
   * @returns {number}
   */
  getCurrentCount() {
    return this.unreadCount;
  }

  /**
   * Manually refresh count (optimized to prevent concurrent calls)
   */
  async refresh() {
    // Prevent multiple simultaneous refresh calls
    if (this.isRefreshing) {
      return;
    }

    this.isRefreshing = true;

    try {
      const response = await NotificationService.getUnreadCount();
      const payload = response?.data || response || {};
      const newCount =
        (payload.count !== undefined && payload.count) ||
        payload.unread_count ||
        payload.unreadCount ||
        0;

      // Only notify if count changed
      if (newCount !== this.unreadCount) {
        this.unreadCount = newCount;
        this.notifyListeners(newCount);
      }
    } catch (error) {
      console.error("Failed to refresh notification count:", error);
    } finally {
      this.isRefreshing = false;
    }
  }
}

// Global notification poller instance
export const notificationPoller = new NotificationPoller();
