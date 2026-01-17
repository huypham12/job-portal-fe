import React from 'react'
import JobCard from './JobCard.jsx'
import LoadingSkeleton from './LoadingSkeleton.jsx'
import NoResults from './NoResults.jsx'
import Pagination from './Pagination.jsx'
import './JobList.css'
import { normalizeSearchHit } from '../lib/normalizeSearchHit.js'

export default function JobList({
  jobs = [],
  loading = false,
  error = null,
  onJobClick,
  onPageChange,
  currentPage = 1,
  totalPages = 1,
  showPagination = true,
  emptyMessage = 'Không tìm thấy công việc nào phù hợp với tiêu chí của bạn.',
  className = ''
}) {
  // Handle job click with error boundary
  const handleJobClick = (job) => {
    try {
      onJobClick?.(job)
    } catch (error) {
      console.error('Error handling job click:', error)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className={`job-list loading ${className}`}>
        <div className="job-grid">
          {Array.from({ length: 6 }, (_, index) => (
            <LoadingSkeleton key={index} type="job-card" />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={`job-list error ${className}`}>
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Có lỗi xảy ra</h3>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  // Empty state
  if (!jobs.length) {
    return (
      <div className={`job-list empty ${className}`}>
        <NoResults message={emptyMessage} />
      </div>
    )
  }

  return (
    <div className={`job-list ${className}`}>
      <div className="job-grid">
        {jobs.map((hit, index) => {
          // normalize each hit to a stable job object
          const job = normalizeSearchHit(hit)
          return (
            <JobCard
              key={job.id || `job-${index}`}
              job={job}
              highlight={job.highlight}
              onClick={() => handleJobClick(job)}
            />
          )
        })}
      </div>

      {showPagination && totalPages > 1 && (
        <div className="pagination-container">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  )
}
