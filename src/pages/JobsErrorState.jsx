import React from 'react'

export default function JobsErrorState({ title, subtitle, onRetry }) {
  return (
    <div className="jobs-error-card">
      <div className="jobs-error-text">
        <strong>{title}</strong>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <button className="jobs-error-btn" onClick={onRetry}>
        Thử lại
      </button>
    </div>
  )
}
