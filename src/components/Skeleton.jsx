import React from 'react'
import './Skeleton.css'

export const Skeleton = ({ width, height, className = '', style = {} }) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: width || '100%',
        height: height || '20px',
        ...style
      }}
    />
  )
}

export const SkeletonCard = ({ lines = 3 }) => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-card-header">
        <Skeleton width="60%" height="20px" />
        <Skeleton width="40%" height="16px" />
      </div>
      <div className="skeleton-card-body">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} width={`${80 - i * 10}%`} height="14px" style={{ marginBottom: '8px' }} />
        ))}
      </div>
      <div className="skeleton-card-footer">
        <Skeleton width="30%" height="16px" />
      </div>
    </div>
  )
}

export const SkeletonTable = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="skeleton-table">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {Array.from({ length: cols }, (_, colIndex) => (
            <Skeleton
              key={colIndex}
              width={`${60 + Math.random() * 30}%`}
              height="16px"
              style={{ marginBottom: '8px' }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
