import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminApi } from '../../services/adminApi'
import './styles/admin-jobs.css'

function formatDate(dateString) {
  if (!dateString) return '--'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '--'
  }
}

export default function AdminJobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [labels, setLabels] = useState({ hot: false, urgent: false, featured: false })

  useEffect(() => {
    loadJob()
  }, [id])

  const loadJob = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('[AdminJobDetail] Loading job with id:', id)
      const response = await adminApi.getJobDetails(id)
      console.log('[AdminJobDetail] Raw API response:', response)
      console.log('[AdminJobDetail] Response type:', typeof response)
      console.log('[AdminJobDetail] Response keys:', Object.keys(response || {}))
      
      const jobData = response?.data || response
      console.log('[AdminJobDetail] Job data received:', jobData)
      console.log('[AdminJobDetail] Job data type:', typeof jobData)
      console.log('[AdminJobDetail] Job data keys:', Object.keys(jobData || {}))
      
      // Check _count in multiple possible locations
      const countData = jobData?._count || jobData?.count || jobData?.stats
      console.log('[AdminJobDetail] Count data found:', {
        _count: jobData?._count,
        count: jobData?.count,
        stats: jobData?.stats,
        countData: countData
      })
      
      // If _count doesn't exist, try to create it from other sources
      if (!jobData._count && countData) {
        console.log('[AdminJobDetail] Using count/countData as _count')
        jobData._count = countData
      }
      
      // Final check
      console.log('[AdminJobDetail] Final jobData._count:', jobData?._count)
      console.log('[AdminJobDetail] Job _count details:', {
        applications: jobData?._count?.applications,
        saved_jobs: jobData?._count?.saved_jobs,
        job_views: jobData?._count?.job_views,
        full_count: jobData?._count
      })
      
      // Check if _count exists and log warning if missing
      if (!jobData?._count) {
        console.warn('[AdminJobDetail] WARNING: _count is missing from job data!')
        console.warn('[AdminJobDetail] Available keys:', Object.keys(jobData || {}))
        // Set default _count
        jobData._count = {
          applications: 0,
          saved_jobs: 0,
          job_views: 0
        }
      }
      
      setJob(jobData)
      
      // Load labels from metadata
      if (jobData.metadata?.labels) {
        setLabels({
          hot: jobData.metadata.labels.hot || false,
          urgent: jobData.metadata.labels.urgent || false,
          featured: jobData.metadata.labels.featured || false,
        })
      }
    } catch (err) {
      console.error('[AdminJobDetail] Failed to load job:', err)
      console.error('[AdminJobDetail] Error details:', {
        message: err?.message,
        status: err?.status,
        data: err?.data,
        stack: err?.stack
      })
      setError(err?.message || 'Không thể tải thông tin công việc.')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!confirm('Bạn có chắc chắn muốn duyệt công việc này?')) return
    
    setProcessing(true)
    try {
      await adminApi.approveJob(id)
      alert('Duyệt công việc thành công!')
      loadJob()
    } catch (err) {
      console.error('Failed to approve job:', err)
      alert(err?.message || 'Không thể duyệt công việc.')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim() || rejectReason.trim().length < 10) {
      alert('Vui lòng nhập lý do từ chối (ít nhất 10 ký tự)')
      return
    }

    setProcessing(true)
    try {
      await adminApi.rejectJob(id, rejectReason)
      alert('Từ chối công việc thành công!')
      setShowRejectModal(false)
      setRejectReason('')
      loadJob()
    } catch (err) {
      console.error('Failed to reject job:', err)
      alert(err?.message || 'Không thể từ chối công việc.')
    } finally {
      setProcessing(false)
    }
  }

  const handleUpdateLabels = async () => {
    setProcessing(true)
    try {
      await adminApi.updateJobLabels(id, labels)
      alert('Cập nhật nhãn thành công!')
      loadJob()
    } catch (err) {
      console.error('Failed to update labels:', err)
      alert(err?.message || 'Không thể cập nhật nhãn.')
    } finally {
      setProcessing(false)
    }
  }

  const handleDelete = async () => {
    setProcessing(true)
    try {
      await adminApi.deleteJobForViolation(id)
      alert('Xóa công việc thành công!')
      navigate('/admin/jobs')
    } catch (err) {
      console.error('Failed to delete job:', err)
      alert(err?.message || 'Không thể xóa công việc.')
    } finally {
      setProcessing(false)
      setShowDeleteModal(false)
    }
  }

  const handleRestore = async () => {
    if (!confirm('Bạn có chắc chắn muốn khôi phục công việc này?')) return
    
    setProcessing(true)
    try {
      await adminApi.restoreJob(id)
      alert('Khôi phục công việc thành công!')
      loadJob()
    } catch (err) {
      console.error('Failed to restore job:', err)
      alert(err?.message || 'Không thể khôi phục công việc.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-job-detail">
        <div className="admin-card admin-loading-state">
          <p>Đang tải...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="admin-job-detail">
        <div className="admin-card admin-error-state">
          <p>{error || 'Không tìm thấy công việc'}</p>
          <button className="admin-btn admin-btn-secondary" onClick={() => navigate('/admin/jobs')}>
            Quay lại
          </button>
        </div>
      </div>
    )
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

  return (
    <div className="admin-job-detail">
      <div className="admin-page-header">
        <button className="admin-btn admin-btn-link" onClick={() => navigate('/admin/jobs')}>
          ← Quay lại danh sách
        </button>
        <h1>{job.title || 'Chưa có tiêu đề'}</h1>
        <p className="admin-muted">Quản lý và duyệt công việc</p>
      </div>

      <div className="admin-job-detail-grid">
        <div className="admin-job-detail-main">
          <div className="admin-card">
            <h2>Thông tin cơ bản</h2>
            <div className="admin-info-grid">
              <div className="admin-info-item">
                <label>Tiêu đề</label>
                <div>{job.title || '--'}</div>
              </div>
              <div className="admin-info-item">
                <label>Công ty</label>
                <div>{job.companies?.name || '--'}</div>
              </div>
              <div className="admin-info-item">
                <label>Địa điểm</label>
                <div>{job.locations?.name || '--'}</div>
              </div>
              <div className="admin-info-item">
                <label>Loại hình</label>
                <div>
                  {job.job_type === 'full_time' ? 'Toàn thời gian' :
                   job.job_type === 'part_time' ? 'Bán thời gian' :
                   job.job_type === 'contract' ? 'Hợp đồng' : '--'}
                </div>
              </div>
              <div className="admin-info-item">
                <label>Trạng thái</label>
                <div>
                  <span className={`admin-badge admin-badge-${getStatusColor(job.status)}`}>
                    {getStatusLabel(job.status)}
                  </span>
                  {job.deleted && (
                    <span className="admin-badge admin-badge-danger" style={{ marginLeft: '8px' }}>
                      Đã xóa
                    </span>
                  )}
                </div>
              </div>
              <div className="admin-info-item">
                <label>Ngày đăng</label>
                <div>{formatDate(job.posted_at)}</div>
              </div>
              <div className="admin-info-item">
                <label>Ngày hết hạn</label>
                <div>{formatDate(job.expires_at)}</div>
              </div>
            </div>
          </div>

          {job.description && (
            <div className="admin-card">
              <h2>Mô tả công việc</h2>
              <div className="admin-job-description-content">
                {job.description}
              </div>
            </div>
          )}

          {job.metadata?.rejection_reason && (
            <div className="admin-card admin-card-warning">
              <h2>Lý do từ chối</h2>
              <p>{job.metadata.rejection_reason}</p>
              {job.metadata.rejected_at && (
                <p className="admin-muted">Từ chối vào: {formatDate(job.metadata.rejected_at)}</p>
              )}
            </div>
          )}

        </div>

        <div className="admin-job-detail-sidebar">
          <div className="admin-card">
            <h2>Hành động</h2>
            <div className="admin-actions-list">
              {job.status === 'draft' && !job.deleted && (
                <>
                  <button
                    className="admin-btn admin-btn-success admin-btn-block"
                    onClick={handleApprove}
                    disabled={processing}
                  >
                    {processing ? 'Đang xử lý...' : 'Duyệt công việc'}
                  </button>
                  <button
                    className="admin-btn admin-btn-danger admin-btn-block"
                    onClick={() => setShowRejectModal(true)}
                    disabled={processing}
                  >
                    Từ chối
                  </button>
                </>
              )}

              {job.deleted && (
                <button
                  className="admin-btn admin-btn-success admin-btn-block"
                  onClick={handleRestore}
                  disabled={processing}
                >
                  {processing ? 'Đang xử lý...' : 'Khôi phục công việc'}
                </button>
              )}

              {!job.deleted && (
                <button
                  className="admin-btn admin-btn-danger admin-btn-block"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={processing}
                >
                  Xóa vi phạm
                </button>
              )}
            </div>
          </div>

          <div className="admin-card">
            <h2>Nhãn</h2>
            <div className="admin-labels-form">
              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={labels.hot}
                  onChange={(e) => setLabels({ ...labels, hot: e.target.checked })}
                />
                <span>Hot</span>
              </label>
              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={labels.urgent}
                  onChange={(e) => setLabels({ ...labels, urgent: e.target.checked })}
                />
                <span>Urgent</span>
              </label>
              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={labels.featured}
                  onChange={(e) => setLabels({ ...labels, featured: e.target.checked })}
                />
                <span>Featured</span>
              </label>
              <button
                className="admin-btn admin-btn-primary admin-btn-block"
                onClick={handleUpdateLabels}
                disabled={processing}
                style={{ marginTop: '16px' }}
              >
                {processing ? 'Đang lưu...' : 'Cập nhật nhãn'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showRejectModal && (
        <div className="admin-modal-overlay" onClick={() => {
          setShowRejectModal(false)
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
                  setShowRejectModal(false)
                  setRejectReason('')
                }}
              >
                Hủy
              </button>
              <button
                className="admin-btn admin-btn-danger"
                onClick={handleReject}
                disabled={processing || !rejectReason.trim() || rejectReason.trim().length < 10}
              >
                {processing ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="admin-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Xác nhận xóa</h3>
            <p>Bạn có chắc chắn muốn xóa công việc này vì vi phạm?</p>
            <p className="admin-muted">Công việc sẽ bị xóa khỏi hệ thống (soft delete).</p>
            <div className="admin-modal-actions">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Hủy
              </button>
              <button
                className="admin-btn admin-btn-danger"
                onClick={handleDelete}
                disabled={processing}
              >
                {processing ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
