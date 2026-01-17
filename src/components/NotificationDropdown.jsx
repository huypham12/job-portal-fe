import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  NotificationService,
  notificationPoller,
} from "../services/notificationService";
import NotificationBadge from "./NotificationBadge";
import "./NotificationDropdown.css";

function formatDate(dateString) {
  if (!dateString) return "--";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes <= 1 ? "Vừa xong" : `${diffMinutes} phút trước`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)} giờ trước`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)} ngày trước`;
    } else {
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
  } catch {
    return "--";
  }
}

export default function NotificationDropdown({ isOpen, onToggle }) {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 1,
  });

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onToggle(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onToggle]);

  const loadNotifications = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const response = await NotificationService.getNotifications({
        page,
        limit: 10,
      });

      const data = response?.data || [];
      const pag = response?.pagination || {
        page: 1,
        limit: 10,
        total: data.length,
        total_pages: 1,
      };

      setNotifications(data);
      setPagination(pag);
    } catch (err) {
      setError(err?.message || "Không thể tải thông báo");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId, event) => {
    event.stopPropagation();
    try {
      await NotificationService.markAsRead(notificationId);
      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      // Refresh global unread count so badge updates
      notificationPoller.refresh().catch(() => {});
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, is_read: true }))
      );
      // Refresh global unread count
      notificationPoller.refresh().catch(() => {});
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const handleDelete = async (notificationId, event) => {
    event.stopPropagation();
    try {
      await NotificationService.deleteNotification(notificationId);
      // Remove from local state
      setNotifications((prev) =>
        prev.filter((notif) => notif.id !== notificationId)
      );
      // Refresh global unread count
      notificationPoller.refresh().catch(() => {});
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read if not already
    if (!notification.is_read) {
      handleMarkAsRead(notification.id, { stopPropagation: () => {} });
    }

    // Close dropdown before navigation
    onToggle(false);

    // Navigate using action_url from backend if available
    if (notification.action_url) {
      navigate(notification.action_url);
      notificationPoller.refresh().catch(() => {});
      return;
    }

    // Fallback: construct URL based on notification type and metadata
    const url = constructNavigationUrl(notification);
    if (url) {
      navigate(url);
    }

    // Ensure global unread count updates after navigation
    notificationPoller.refresh().catch(() => {});
  };

  const constructNavigationUrl = (notification) => {
    const { type, data, metadata } = notification;
    const meta = metadata || data || {};

    // Get user role from localStorage
    const userRole = localStorage.getItem("user_role") || "candidate";

    // Application-related notifications
    if (type?.includes("APPLICATION")) {
      const applicationId = meta.application_id || meta.applicationId;
      if (applicationId) {
        if (userRole === "recruiter") {
          return `/recruiter/applications/${applicationId}`;
        }
        return `/applications/${applicationId}`;
      }
    }

    // Job-related notifications
    if (type?.includes("JOB")) {
      const jobId = meta.job_id || meta.jobId;
      if (jobId) {
        if (userRole === "recruiter") {
          return `/recruiter/jobs/${jobId}/manage`;
        }
        return `/jobs/${jobId}`;
      }
    }

    // Interview-related notifications
    if (type?.includes("INTERVIEW")) {
      const applicationId = meta.application_id || meta.applicationId;
      if (applicationId) {
        if (userRole === "recruiter") {
          return `/recruiter/applications/${applicationId}`;
        }
        return `/applications/${applicationId}`;
      }
    }

    // Offer-related notifications
    if (type?.includes("OFFER")) {
      const applicationId = meta.application_id || meta.applicationId;
      if (applicationId) {
        if (userRole === "recruiter") {
          return `/recruiter/applications/${applicationId}`;
        }
        return `/applications/${applicationId}`;
      }
    }

    // Connection/Interest notifications
    if (type?.includes("CONNECTION") || type?.includes("INTEREST")) {
      const interestId = meta.interest_id || meta.interestId;
      if (interestId) {
        if (userRole === "recruiter") {
          return `/recruiter/connections/${interestId}`;
        }
        return `/candidate/connections/${interestId}`;
      }
    }

    // Stage-related notifications
    if (type?.includes("STAGE")) {
      const applicationId = meta.application_id || meta.applicationId;
      if (applicationId) {
        if (userRole === "recruiter") {
          return `/recruiter/applications/${applicationId}`;
        }
        return `/applications/${applicationId}`;
      }
    }

    // Default fallback based on role
    if (userRole === "recruiter") {
      return "/recruiter/dashboard";
    }
    return "/candidate/dashboard";
  };

  const handleViewAll = () => {
    // TODO: Navigate to full notifications page
    console.log("Navigate to full notifications page");
    onToggle(false);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="notification-dropdown-container" ref={dropdownRef}>
      <NotificationBadge onClick={() => onToggle(!isOpen)}>
        <button className="notification-button">🔔</button>
      </NotificationBadge>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Thông báo</h3>
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading && <div className="notification-loading">Đang tải...</div>}

            {error && (
              <div className="notification-error">
                <p>{error}</p>
                <button onClick={() => loadNotifications()}>Thử lại</button>
              </div>
            )}

            {!loading && !error && notifications.length === 0 && (
              <div className="notification-empty">
                <p>Không có thông báo nào</p>
              </div>
            )}

            {!loading && !error && notifications.length > 0 && (
              <>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${
                      !notification.is_read ? "unread" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-content">
                      <p className="notification-message">
                        {notification.message || notification.title}
                      </p>
                      <span className="notification-time">
                        {formatDate(notification.created_at)}
                      </span>
                    </div>
                    <div className="notification-actions">
                      {!notification.is_read && (
                        <button
                          className="mark-read-btn"
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          title="Đánh dấu đã đọc"
                        >
                          ✓
                        </button>
                      )}
                      <button
                        className="delete-btn"
                        onClick={(e) => handleDelete(notification.id, e)}
                        title="Xóa thông báo"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}

                {pagination.total_pages > 1 && (
                  <div className="notification-pagination">
                    <button
                      disabled={pagination.page <= 1}
                      onClick={() => loadNotifications(pagination.page - 1)}
                    >
                      Trước
                    </button>
                    <span>
                      Trang {pagination.page} / {pagination.total_pages}
                    </span>
                    <button
                      disabled={pagination.page >= pagination.total_pages}
                      onClick={() => loadNotifications(pagination.page + 1)}
                    >
                      Sau
                    </button>
                  </div>
                )}

                <div className="notification-footer">
                  <button className="view-all-btn" onClick={handleViewAll}>
                    Xem tất cả thông báo
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
