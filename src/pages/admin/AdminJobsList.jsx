import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../../services/adminApi'
import './styles/admin-jobs.css'

const PAGE_SIZE = 20
const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'draft', label: 'Nháp' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'closed', label: 'Đã đóng' },
]

const DELETED_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'false', label: 'Hoạt động' },
  { value: 'true', label: 'Đã xóa' },
]

function formatDate(dateString) {
  if (!dateString) return '--'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return '--'
  }
}

export default function AdminJobsList() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 })

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    deleted: '',
  })

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        page: currentPage,
        limit: PAGE_SIZE,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.deleted && { deleted: filters.deleted === 'true' }),
      }

      const response = await adminApi.getAllJobs(params)
      const data = response?.data || {}

      setJobs(data.jobs || [])
      setPagination({
        page: data.pagination?.page || currentPage,
        limit: data.pagination?.limit || PAGE_SIZE,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 1,
      })
    } catch (err) {
      console.error('Failed to fetch jobs:', err)
      setError(err?.message || 'Không thể tải danh sách công việc. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [currentPage, filters])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchJobs()
  }

  const handleViewDetail = (jobId) => {
    navigate(`/admin/jobs/${jobId}`)
  }

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Nháp',
      approved: 'Đã duyệt',
      closed: 'Đã đóng',
    }
    return labels[status] || status
  }

  const getStatusColor = (status) => {
    const colors = {
      draft: 'warning',
      approved: 'success',
      closed: 'danger',
    }
    return colors[status] || ''
  }

  const getLabels = (metadata) => {
    if (!metadata || !metadata.labels) return []
    const labels = []
    if (metadata.labels.hot) labels.push({ text: 'Hot', color: '#ef4444' })
    if (metadata.labels.urgent) labels.push({ text: 'Urgent', color: '#f59e0b' })
    if (metadata.labels.featured) labels.push({ text: 'Featured', color: '#8b5cf6' })
    return labels
  }

  return (
    <div className="admin-jobs-list">
      <div className="admin-page-header">
        <h1>Quản lý công việc</h1>
        <p className="admin-muted">Quản lý tất cả công việc trong hệ thống</p>
      </div>

      <div className="admin-card">
        <div className="admin-filters">
          <form onSubmit={handleSearch} className="admin-search-form">
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề hoặc mô tả..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="admin-search-input"
            />
            <button type="submit" className="admin-search-btn">Tìm kiếm</button>
          </form>

          <div className="admin-filter-row">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="admin-filter-select"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              value={filters.deleted}
              onChange={(e) => handleFilterChange('deleted', e.target.value)}
              className="admin-filter-select"
            >
              {DELETED_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="admin-card admin-loading-state">
          <p>Đang tải...</p>
        </div>
      )}

      {error && (
        <div className="admin-card admin-error-state">
          <p>{error}</p>
          <button className="admin-btn admin-btn-secondary" onClick={fetchJobs}>
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="admin-card">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Tiêu đề</th>
                    <th>Công ty</th>
                    <th>Trạng thái</th>
                    <th>Nhãn</th>
                    <th>Ngày đăng</th>
                    <th>Ngày hết hạn</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="admin-empty-state">
                        Không tìm thấy công việc nào
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job) => {
                      const labels = getLabels(job.metadata)
                      return (
                        <tr key={job.id}>
                          <td>
                            <div className="admin-job-title">{job.title || '--'}</div>
                            {job.deleted && (
                              <span className="admin-badge admin-badge-danger" style={{ fontSize: '10px', marginTop: '4px' }}>
                                Đã xóa
                              </span>
                            )}
                          </td>
                          <td>{job.companies?.name || '--'}</td>
                          <td>
                            <span className={`admin-badge admin-badge-${getStatusColor(job.status)}`}>
                              {getStatusLabel(job.status)}
                            </span>
                          </td>
                          <td>
                            <div className="admin-labels">
                              {labels.length > 0 ? (
                                labels.map((label, idx) => (
                                  <span
                                    key={idx}
                                    className="admin-label-badge"
                                    style={{ backgroundColor: `${label.color}15`, color: label.color }}
                                  >
                                    {label.text}
                                  </span>
                                ))
                              ) : (
                                <span className="admin-muted">--</span>
                              )}
                            </div>
                          </td>
                          <td>{formatDate(job.posted_at)}</td>
                          <td>{formatDate(job.expires_at)}</td>
                          <td>
                            <button
                              className="admin-btn admin-btn-link"
                              onClick={() => handleViewDetail(job.id)}
                            >
                              Xem chi tiết
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {pagination.totalPages > 1 && (
            <div className="admin-pagination">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Trước
              </button>
              <span className="admin-pagination-info">
                Trang {currentPage} / {pagination.totalPages} ({pagination.total} công việc)
              </span>
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
