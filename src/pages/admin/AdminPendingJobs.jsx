import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../../services/adminApi'
import './styles/admin-jobs.css'

const PAGE_SIZE = 20

function formatDate(dateString) {
  if (!dateString) return '--'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return '--'
  }
}

export default function AdminPendingJobs() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 })
  const [processing, setProcessing] = useState({})
  const [showRejectModal, setShowRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        page: currentPage,
        limit: PAGE_SIZE,
      }

      const response = await adminApi.getPendingJobs(params)
      const data = response?.data || {}

      setJobs(data.jobs || [])
      setPagination({
        page: data.pagination?.page || currentPage,
        limit: data.pagination?.limit || PAGE_SIZE,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 1,
      })
    } catch (err) {
      console.error('Failed to fetch pending jobs:', err)
      setError(err?.message || 'Không thể tải danh sách công việc chờ duyệt. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [currentPage])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const handleApprove = async (jobId) => {
    setProcessing({ ...processing, [jobId]: 'approving' })
    try {
      await adminApi.approveJob(jobId)
      alert('Duyệt công việc thành công!')
      fetchJobs()
    } catch (err) {
      console.error('Failed to approve job:', err)
      alert(err?.message || 'Không thể duyệt công việc.')
    } finally {
      setProcessing({ ...processing, [jobId]: null })
    }
  }

  const handleReject = async (jobId) => {
    if (!rejectReason.trim() || rejectReason.trim().length < 10) {
      alert('Vui lòng nhập lý do từ chối (ít nhất 10 ký tự)')
      return
    }

    setProcessing({ ...processing, [jobId]: 'rejecting' })
    try {
      await adminApi.rejectJob(jobId, rejectReason)
      alert('Từ chối công việc thành công!')
      setShowRejectModal(null)
      setRejectReason('')
      fetchJobs()
    } catch (err) {
      console.error('Failed to reject job:', err)
      alert(err?.message || 'Không thể từ chối công việc.')
    } finally {
      setProcessing({ ...processing, [jobId]: null })
    }
  }

  const handleViewDetail = (jobId) => {
    navigate(`/admin/jobs/${jobId}`)
  }

  return (
    <div className="admin-pending-jobs">
      <div className="admin-page-header">
        <h1>Duyệt công việc</h1>
        <p className="admin-muted">Xem xét và duyệt các công việc đang chờ phê duyệt</p>
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
          {jobs.length === 0 ? (
            <div className="admin-card">
              <div className="admin-empty-state">
                <p>Không có công việc nào chờ duyệt</p>
              </div>
            </div>
          ) : (
            <div className="admin-jobs-grid">
              {jobs.map((job) => (
                <div key={job.id} className="admin-job-card">
                  <div className="admin-job-card-header">
                    <h3>{job.title || 'Chưa có tiêu đề'}</h3>
                    <span className="admin-badge admin-badge-warning">Chờ duyệt</span>
                  </div>

                  <div className="admin-job-card-body">
                    <div className="admin-job-info">
                      <div className="admin-job-info-item">
                        <label>Công ty:</label>
                        <span>{job.companies?.name || '--'}</span>
                      </div>
                      <div className="admin-job-info-item">
                        <label>Địa điểm:</label>
                        <span>{job.locations?.name || '--'}</span>
                      </div>
                      <div className="admin-job-info-item">
                        <label>Loại hình:</label>
                        <span>
                          {job.job_type === 'full_time' ? 'Toàn thời gian' :
                           job.job_type === 'part_time' ? 'Bán thời gian' :
                           job.job_type === 'contract' ? 'Hợp đồng' : '--'}
                        </span>
                      </div>
                      <div className="admin-job-info-item">
                        <label>Ngày đăng:</label>
                        <span>{formatDate(job.posted_at)}</span>
                      </div>
                    </div>

                    {job.description && (
                      <div className="admin-job-description">
                        <label>Mô tả:</label>
                        <p>{job.description.substring(0, 200)}{job.description.length > 200 ? '...' : ''}</p>
                      </div>
                    )}
                  </div>

                  <div className="admin-job-card-actions">
                    <button
                      className="admin-btn admin-btn-link"
                      onClick={() => handleViewDetail(job.id)}
                    >
                      Xem chi tiết
                    </button>
                    <button
                      className="admin-btn admin-btn-success"
                      onClick={() => handleApprove(job.id)}
                      disabled={processing[job.id]}
                    >
                      {processing[job.id] === 'approving' ? 'Đang duyệt...' : 'Duyệt'}
                    </button>
                    <button
                      className="admin-btn admin-btn-danger"
                      onClick={() => setShowRejectModal(job.id)}
                      disabled={processing[job.id]}
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

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

      {showRejectModal && (
        <div className="admin-modal-overlay" onClick={() => {
          setShowRejectModal(null)
          setRejectReason('')
        }}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Từ chối công việc</h3>
            <p>Vui lòng nhập lý do từ chối (ít nhất 10 ký tự):</p>
            <textarea
              className="admin-form-input"
              rows="4"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối..."
              style={{ width: '100%', marginTop: '12px' }}
            />
            <div className="admin-modal-actions">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => {
                  setShowRejectModal(null)
                  setRejectReason('')
                }}
              >
                Hủy
              </button>
              <button
                className="admin-btn admin-btn-danger"
                onClick={() => handleReject(showRejectModal)}
                disabled={processing[showRejectModal] || !rejectReason.trim() || rejectReason.trim().length < 10}
              >
                {processing[showRejectModal] === 'rejecting' ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
