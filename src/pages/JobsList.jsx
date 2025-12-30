import React from 'react'
import JobsErrorState from './JobsErrorState.jsx'
import JobsSkeletonList from './JobsSkeletonList.jsx'

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  return (
    <div className="pagination">
      <button disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
        Previous
      </button>
      {pages.map((page) => (
        <button
          key={page}
          className={page === currentPage ? 'active' : ''}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
      <button disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
        Next
      </button>
    </div>
  )
}

export default function JobsList({
  jobs,
  isLoading,
  error,
  onRetry,
  totalPages,
  currentPage,
  onPageChange,
  showPagination,
  JobCardComponent
}) {
  return (
    <div className="jobs-list-card">
      {error && (
        <JobsErrorState
          title="Không tải được danh sách việc làm"
          subtitle="Hiển thị dữ liệu mẫu để bạn tiếp tục xem."
          onRetry={onRetry}
        />
      )}

      {isLoading ? (
        <JobsSkeletonList />
      ) : jobs && jobs.length ? (
        <>
          <div className="jobs-grid">
            {jobs.map((job) => (
              <JobCardComponent key={job.id} job={job} />
            ))}
          </div>
          {showPagination && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
          )}
        </>
      ) : (
        <div className="state-card empty">
          <h3>Không tìm thấy việc làm</h3>
          <p>Hãy thử thay đổi bộ lọc hoặc từ khóa.</p>
        </div>
      )}
    </div>
  )
}
