import React from 'react'
import CompanyCard from './CompanyCard.jsx'
import CompanySkeleton from './CompanySkeleton.jsx'

const range = (n) => Array.from({ length: n }, (_, i) => i)

export default function CompanyList({
  items,
  loading,
  error,
  onRetry,
  total,
  page,
  limit,
  onPageChange,
  sort,
  onSortChange,
  clearFilters,
  sortOptions
}) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / (limit || 1)))

  const renderPagination = () => {
    if (!total || totalPages <= 1) return null
    const pages = range(totalPages).map((i) => i + 1)
    return (
      <div className="pagination">
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="btn ghost">
          Trước
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`btn ghost page-btn ${p === page ? 'active' : ''}`}
          >
            {p}
          </button>
        ))}
        <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="btn ghost">
          Sau
        </button>
      </div>
    )
  }

  if (error && (!items || !items.length)) {
    return (
      <div className="list-card">
        <div className="state-card error">
          <p>{error}</p>
          <button className="btn primary" onClick={onRetry}>
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="list-card">
      <div className="list-head">
        <div>
          <h2>{total || 0} công ty phù hợp</h2>
          <p className="muted">Lọc và sắp xếp để tìm nhà tuyển dụng phù hợp</p>
        </div>
        <div className="list-actions">
          <select value={sort} onChange={(e) => onSortChange(e.target.value)}>
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && items?.length ? (
        <div className="state-card error" style={{ marginBottom: 12 }}>
          <p>{error}</p>
        </div>
      ) : null}

      {loading ? (
        <div className="company-grid">
          {range(6).map((i) => (
            <CompanySkeleton key={`skeleton-${i}`} />
          ))}
        </div>
      ) : items && items.length ? (
        <>
          <div className="company-grid">
            {items.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
          {renderPagination()}
        </>
      ) : (
        <div className="empty-state">
          <p>Không có công ty nào khớp bộ lọc.</p>
          <button className="btn ghost" onClick={clearFilters}>
            Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  )
}
