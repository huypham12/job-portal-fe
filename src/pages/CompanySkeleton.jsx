import React from 'react'

export default function CompanySkeleton() {
  return (
    <div className="company-card skeleton">
      <div className="skeleton-line lg"></div>
      <div className="skeleton-line"></div>
      <div className="skeleton-line"></div>
      <div className="skeleton-chip-row">
        <span className="skeleton-chip"></span>
        <span className="skeleton-chip"></span>
        <span className="skeleton-chip"></span>
      </div>
    </div>
  )
}
