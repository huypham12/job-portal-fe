import React from 'react'
import './Pagination.css'

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  maxVisiblePages = 5,
  showFirstLast = true,
  className = ''
}) {
  if (totalPages <= 1) return null

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page)
    }
  }

  const getVisiblePages = () => {
    const delta = Math.floor(maxVisiblePages / 2)
    let start = Math.max(1, currentPage - delta)
    let end = Math.min(totalPages, start + maxVisiblePages - 1)

    // Adjust start if we're near the end
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1)
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const visiblePages = getVisiblePages()
  const showStartEllipsis = visiblePages[0] > 2
  const showEndEllipsis = visiblePages[visiblePages.length - 1] < totalPages - 1

  return (
    <nav
      className={`pagination ${className}`}
      aria-label="Phân trang kết quả tìm kiếm"
      role="navigation"
    >
      <ul className="pagination-list">
        {/* First page */}
        {showFirstLast && currentPage > 1 && (
          <li>
            <button
              onClick={() => handlePageChange(1)}
              className="pagination-button pagination-first"
              aria-label="Trang đầu"
              title="Trang đầu"
            >
              ‹‹
            </button>
          </li>
        )}

        {/* Previous page */}
        <li>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="pagination-button pagination-prev"
            aria-label="Trang trước"
            title="Trang trước"
          >
            ‹
          </button>
        </li>

        {/* Start ellipsis */}
        {showStartEllipsis && (
          <li>
            <span className="pagination-ellipsis" aria-hidden="true">
              …
            </span>
          </li>
        )}

        {/* Page numbers */}
        {visiblePages.map(page => (
          <li key={page}>
            <button
              onClick={() => handlePageChange(page)}
              className={`pagination-button pagination-page ${
                page === currentPage ? 'active' : ''
              }`}
              aria-label={`Trang ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          </li>
        ))}

        {/* End ellipsis */}
        {showEndEllipsis && (
          <li>
            <span className="pagination-ellipsis" aria-hidden="true">
              …
            </span>
          </li>
        )}

        {/* Next page */}
        <li>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="pagination-button pagination-next"
            aria-label="Trang tiếp theo"
            title="Trang tiếp theo"
          >
            ›
          </button>
        </li>

        {/* Last page */}
        {showFirstLast && currentPage < totalPages && (
          <li>
            <button
              onClick={() => handlePageChange(totalPages)}
              className="pagination-button pagination-last"
              aria-label="Trang cuối"
              title="Trang cuối"
            >
              ››
            </button>
          </li>
        )}
      </ul>

      {/* Page info */}
      <div className="pagination-info" aria-live="polite">
        Trang {currentPage} của {totalPages}
      </div>
    </nav>
  )
}
