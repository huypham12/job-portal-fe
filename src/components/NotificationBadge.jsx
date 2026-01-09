import React, { useState, useEffect, useRef } from 'react'
import { notificationPoller } from '../services/notificationService'
import './NotificationBadge.css'

/**
 * NotificationBadge Component
 * Displays unread notification count with visual indicator
 */
export default function NotificationBadge({ children, onClick }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  // Buffer updates to avoid rapid re-renders when many notifications arrive quickly
  const pendingCountRef = useRef(null)
  const flushTimeoutRef = useRef(null)

  useEffect(() => {
    // Set initial count
    setUnreadCount(notificationPoller.getCurrentCount())

    // Add listener for count changes
    const handleCountChange = (count) => {
      // Buffer incoming counts and flush at most once per 500ms
      pendingCountRef.current = count
      if (!flushTimeoutRef.current) {
        flushTimeoutRef.current = setTimeout(() => {
          setUnreadCount(pendingCountRef.current || 0)
          flushTimeoutRef.current = null
        }, 500)
      }
    }

    notificationPoller.addListener(handleCountChange)

    // Cleanup
    return () => {
      notificationPoller.removeListener(handleCountChange)
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current)
        flushTimeoutRef.current = null
      }
    }
  }, [])

  const handleClick = (event) => {
    if (onClick) {
      onClick(event)
    }
  }

  return (
    <div className="notification-badge-container" onClick={handleClick}>
      {children}
      {unreadCount > 0 && (
        <span className="notification-badge">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      {isLoading && (
        <span className="notification-badge-loading">
          <span className="loading-dot"></span>
        </span>
      )}
    </div>
  )
}
