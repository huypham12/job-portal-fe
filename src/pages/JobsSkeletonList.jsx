import React from 'react'

export default function JobsSkeletonList() {
  return (
    <div className="jobs-grid">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="job-card skeleton">
          <div className="skeleton-line lg" />
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
          <div className="skeleton-tags">
            <span className="skeleton-chip" />
            <span className="skeleton-chip" />
            <span className="skeleton-chip" />
          </div>
        </div>
      ))}
    </div>
  )
}
