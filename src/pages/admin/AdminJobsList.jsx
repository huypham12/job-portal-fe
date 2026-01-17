import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../../services/adminApi'

const PAGE_SIZE = 20
const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending_approval', label: 'Chờ duyệt' },
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
  const [processing, setProcessing] = useState({})

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
        ...(filters.deleted !== '' && { deleted: filters.deleted === 'true' }),
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

  const handleDeleteJob = async (jobId, jobTitle) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa công việc "${jobTitle}" vì vi phạm?`)) return

    setProcessing({ ...processing, [jobId]: 'deleting' })
    try {
      await adminApi.deleteJobForViolation(jobId)
      alert('Xóa công việc thành công!')
      fetchJobs()
    } catch (err) {
      console.error('Failed to delete job:', err)
      alert(err?.message || 'Không thể xóa công việc.')
    } finally {
      setProcessing({ ...processing, [jobId]: null })
    }
  }

  const handleRestoreJob = async (jobId, jobTitle) => {
    if (!confirm(`Bạn có chắc chắn muốn khôi phục công việc "${jobTitle}"?`)) return

    setProcessing({ ...processing, [jobId]: 'restoring' })
    try {
      await adminApi.restoreJob(jobId)
      alert('Khôi phục công việc thành công!')
      fetchJobs()
    } catch (err) {
      console.error('Failed to restore job:', err)
      alert(err?.message || 'Không thể khôi phục công việc.')
    } finally {
      setProcessing({ ...processing, [jobId]: null })
    }
  }

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Nháp',
      pending_approval: 'Chờ duyệt',
      approved: 'Đã duyệt',
      closed: 'Đã đóng',
    }
    return labels[status] || status
  }

  const getStatusColor = (status) => {
    const colors = {
      draft: 'warning',
      pending_approval: 'info',
      approved: 'success',
      closed: 'danger',
    }
    return colors[status] || ''
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

        {/* Hiển thị thông tin về jobs đã xóa hoặc nút quay lại */}
        {filters.deleted === '' && jobs.some(j => j.deleted) && (
          <div className="admin-deleted-info">
            <span className="admin-deleted-text">
              Có công việc đã xóa vi phạm trong danh sách này
            </span>
            <button
              className="admin-btn admin-btn-link admin-btn-small"
              onClick={() => handleFilterChange('deleted', 'true')}
            >
              Xem jobs đã xóa →
            </button>
          </div>
        )}

        {filters.deleted === 'true' && (
          <div className="admin-deleted-info" style={{ background: '#dbeafe', borderColor: '#bfdbfe' }}>
            <span className="admin-deleted-text" style={{ color: '#1e40af' }}>
              Đang xem danh sách công việc đã xóa vi phạm
            </span>
            <button
              className="admin-btn admin-btn-link admin-btn-small"
              onClick={() => handleFilterChange('deleted', '')}
              style={{ color: '#1e40af' }}
            >
              ← Quay lại
            </button>
          </div>
        )}
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
                    <th>Ngày đăng</th>
                    <th>Ngày hết hạn</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="admin-empty-state">
                        Không tìm thấy công việc nào
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr key={job.id}>
                        <td>
                          <div className="admin-job-title">{job.title || '--'}</div>
                          {job.status === 'closed' && job.admin_approved === false && job.metadata?.rejection_reason && (
                            <div style={{ marginTop: 6, color: '#b91c1c', fontSize: 12 }}>
                              Lý do từ chối: {job.metadata.rejection_reason}
                            </div>
                          )}
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
                        <td>{formatDate(job.posted_at)}</td>
                        <td>{formatDate(job.expires_at)}</td>
                        <td>
                          <div className="admin-actions-group">
                            <button
                              className="admin-btn admin-btn-link admin-btn-small"
                              onClick={() => handleViewDetail(job.id)}
                            >
                              Chi tiết
                            </button>
                            {job.deleted ? (
                              <button
                                className="admin-btn admin-btn-success admin-btn-small"
                                onClick={() => handleRestoreJob(job.id, job.title)}
                                disabled={processing[job.id]}
                              >
                                {processing[job.id] === 'restoring' ? 'Đang khôi phục...' : 'Khôi phục'}
                              </button>
                            ) : (
                              <button
                                className="admin-btn admin-btn-danger admin-btn-small"
                                onClick={() => handleDeleteJob(job.id, job.title)}
                                disabled={processing[job.id]}
                              >
                                {processing[job.id] === 'deleting' ? 'Đang xóa...' : 'Xóa'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
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
