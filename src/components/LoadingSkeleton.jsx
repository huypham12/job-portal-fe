import React from 'react'
import './LoadingSkeleton.css'

export default function LoadingSkeleton({
  type = 'default',
  lines = 1,
  className = ''
}) {
  const renderSkeleton = () => {
    switch (type) {
      case 'job-card':
        return (
          <div className="skeleton job-card-skeleton">
            <div className="skeleton-header">
              <div className="skeleton-avatar skeleton-pulse"></div>
              <div className="skeleton-text">
                <div className="skeleton-line skeleton-pulse" style={{ width: '80%' }}></div>
                <div className="skeleton-line skeleton-pulse" style={{ width: '60%' }}></div>
                <div className="skeleton-line skeleton-pulse" style={{ width: '40%' }}></div>
              </div>
            </div>
            <div className="skeleton-meta">
              <div className="skeleton-badge skeleton-pulse" style={{ width: '60px' }}></div>
              <div className="skeleton-badge skeleton-pulse" style={{ width: '50px' }}></div>
              <div className="skeleton-line skeleton-pulse" style={{ width: '70px' }}></div>
            </div>
            <div className="skeleton-description">
              <div className="skeleton-line skeleton-pulse" style={{ width: '100%' }}></div>
              <div className="skeleton-line skeleton-pulse" style={{ width: '90%' }}></div>
              <div className="skeleton-line skeleton-pulse" style={{ width: '80%' }}></div>
            </div>
            <div className="skeleton-skills">
              {Array.from({ length: 4 }, (_, i) => (
                <div
                  key={i}
                  className="skeleton-skill skeleton-pulse"
                  style={{ width: `${30 + Math.random() * 40}px` }}
                ></div>
              ))}
            </div>
          </div>
        )

      case 'text':
        return (
          <div className="skeleton text-skeleton">
            {Array.from({ length: lines }, (_, i) => (
              <div
                key={i}
                className="skeleton-line skeleton-pulse"
                style={{
                  width: i === lines - 1 ? '60%' : '100%',
                  height: '16px',
                  marginBottom: '8px'
                }}
              ></div>
            ))}
          </div>
        )

      case 'card':
        return (
          <div className="skeleton card-skeleton">
            <div className="skeleton-image skeleton-pulse" style={{ height: '200px' }}></div>
            <div className="skeleton-content">
              <div className="skeleton-line skeleton-pulse" style={{ width: '80%', height: '24px', marginBottom: '12px' }}></div>
              <div className="skeleton-line skeleton-pulse" style={{ width: '60%', height: '16px', marginBottom: '8px' }}></div>
              <div className="skeleton-line skeleton-pulse" style={{ width: '40%', height: '16px' }}></div>
            </div>
          </div>
        )

      default:
        return (
          <div className="skeleton default-skeleton">
            <div className="skeleton-line skeleton-pulse" style={{ width: '100%', height: '20px' }}></div>
          </div>
        )
    }
  }

  return (
    <div className={`loading-skeleton ${className}`} aria-hidden="true">
      {renderSkeleton()}
    </div>
  )
}
