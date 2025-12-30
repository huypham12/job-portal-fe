import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { JobService } from '../lib/api.js'
import { companyApi } from '../services/companyApi'
import { useJobManage } from '../hooks/useJobs'
import { Button, Card, CardHeader, CardBody, Badge } from '../components/shared'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import '../styles/shared.css'
import './JobManage.css'

const JOB_TYPE_OPTIONS = [
  { value: 'full_time', label: 'Toàn thời gian' },
  { value: 'part_time', label: 'Bán thời gian' },
  { value: 'contract', label: 'Hợp đồng' }
]

const STATUS_LABELS = {
  draft: 'Nháp',
  approved: 'Đã duyệt',
  closed: 'Đã đóng'
}

const STATUS_COLORS = {
  draft: 'gray',
  approved: 'green',
  closed: 'red'
}

function formatDate(dateString) {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toISOString().slice(0, 16) // Format for datetime-local input
  } catch {
    return ''
  }
}

function formatDisplayDate(dateString) {
  if (!dateString) return '--'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return '--'
  }
}

export default function JobManage() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Use the job management hook
  const { job, stats, loading, error, updateStatus, deleteJob, fetchJob } = useJobManage(id)

  // Local UI state
  const [company, setCompany] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('info')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showStatusConfirm, setShowStatusConfirm] = useState(false)
  const [pendingStatus, setPendingStatus] = useState(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    company_id: '',
    location_id: '',
    salary_min: '',
    salary_max: '',
    currency: 'VND',
    job_type: 'full_time',
    experience_level: '',
    expires_at: ''
  })

  // Load company data (job and stats are handled by the hook)
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const companyData = await companyApi.getMyCompany()
        setCompany(companyData)
      } catch (err) {
        console.error('Failed to fetch company:', err)
      }
    }

    if (id) {
      fetchCompany()
    }
  }, [id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!form.title || form.title.length < 10) {
      alert('Tiêu đề phải có ít nhất 10 ký tự.')
      return
    }
    if (!form.description || form.description.length < 50) {
      alert('Mô tả phải có ít nhất 50 ký tự.')
      return
    }
    if (!form.company_id) {
      alert('Vui lòng chọn công ty.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        company_id: form.company_id,
        location_id: form.location_id || null,
        salary_range: {
          min: form.salary_min ? parseInt(form.salary_min, 10) : undefined,
          max: form.salary_max ? parseInt(form.salary_max, 10) : undefined,
          currency: form.currency || 'VND'
        },
        job_type: form.job_type,
        experience_level: form.experience_level ? parseInt(form.experience_level, 10) : null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : undefined
      }

      await JobService.update(id, payload)
      alert('Đã cập nhật tin tuyển dụng thành công.')
      setEditing(false)
      // Reload data
      // reload job data from hook
      if (typeof fetchJob === 'function') {
        await fetchJob()
      }
    } catch (err) {
      alert(err?.message || 'Không thể cập nhật tin tuyển dụng. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteJob()
      navigate('/recruiter/jobs')
    } catch (err) {
      alert(err?.message || 'Không thể xóa tin tuyển dụng. Vui lòng thử lại.')
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      await updateStatus({ status: newStatus })
      setShowStatusConfirm(false)
      setPendingStatus(null)
    } catch (err) {
      alert(err?.message || 'Không thể thay đổi trạng thái. Vui lòng thử lại.')
      setShowStatusConfirm(false)
      setPendingStatus(null)
    }
  }

  const confirmStatusChange = (newStatus) => {
    setPendingStatus(newStatus)
    setShowStatusConfirm(true)
  }

  const executeStatusChange = () => {
    if (pendingStatus) {
      handleStatusChange(pendingStatus)
    }
  }

  if (loading) {
    return (
      <div className="section">
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <p>Đang tải...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="section">
        <div className="card" style={{ padding: '20px', background: '#fee', border: '1px solid #fcc' }}>
          <p style={{ color: '#c00', margin: 0 }}>{error}</p>
          <button className="btn" onClick={() => navigate('/recruiter/jobs')} style={{ marginTop: '12px' }}>
            Quay lại danh sách
          </button>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="section">
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <p>Không tìm thấy việc làm này.</p>
          <button className="btn" onClick={() => navigate('/recruiter/jobs')} style={{ marginTop: '12px' }}>
            Quay lại danh sách
          </button>
        </div>
      </div>
    )
  }

  const status = job.status || 'draft'
  const statusLabel = STATUS_LABELS[status] || status
  const statusColor = STATUS_COLORS[status] || 'gray'

  return (
    <div className="section job-manage-page">
      <div className="job-manage-header">
        <div className="job-manage-header-left">
          <Button variant="ghost" onClick={() => navigate('/recruiter/jobs')} size="small" icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          }>
            Quay lại
          </Button>
          <h1 className="job-manage-title">{job.title || 'Chưa có tiêu đề'}</h1>
          <div className="job-manage-meta">
            <Badge 
              variant={status === 'approved' ? 'success' : status === 'closed' ? 'danger' : 'default'}
              icon={
                status === 'approved' ? '✓' : status === 'closed' ? '✕' : '○'
              }
            >
              {statusLabel}
            </Badge>
            <span className="job-manage-date">
              Tạo: {formatDisplayDate(job.created_at)}
            </span>
          </div>
        </div>
        <div className="job-manage-actions">
          {!editing && (
            <>
              <Button variant="default" onClick={() => setEditing(true)} icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              }>
                Chỉnh sửa
              </Button>
              {status === 'draft' && (
                <Button variant="primary" onClick={() => confirmStatusChange('approved')} icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                }>
                  Duyệt tin
                </Button>
              )}
              {status === 'approved' && (
                <Button variant="outline" onClick={() => confirmStatusChange('closed')} icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                }>
                  Đóng tin
                </Button>
              )}
              {status === 'closed' && (
                <Button variant="outline" onClick={() => confirmStatusChange('approved')} icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                }>
                  Mở lại tin
                </Button>
              )}
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(true)} icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              }>
                Xóa
              </Button>
            </>
          )}
          {editing && (
            <>
              <Button variant="ghost" onClick={() => { setEditing(false); setForm({ ...form }) }}>
                Hủy
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={saving} loading={saving}>
                Lưu thay đổi
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="job-manage-tabs">
        <button 
          className={activeTab === 'info' ? 'tab active' : 'tab'} 
          onClick={() => setActiveTab('info')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
          Thông tin cơ bản
        </button>
        <button 
          className={activeTab === 'stats' ? 'tab active' : 'tab'} 
          onClick={() => setActiveTab('stats')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="20" x2="12" y2="10"></line>
            <line x1="18" y1="20" x2="18" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="16"></line>
          </svg>
          Thống kê
        </button>
      </div>

      {activeTab === 'info' && (
        <Card padding="large">
          {editing ? (
            <form style={{ display: 'grid', gap: '16px' }}>
              <label className="field">
                <span>Tiêu đề *</span>
                <input 
                  type="text" 
                  name="title" 
                  value={form.title} 
                  onChange={handleChange}
                  placeholder="VD: Frontend Engineer"
                  required
                  minLength={10}
                  maxLength={255}
                />
                <small className="muted">Tối thiểu 10 ký tự, tối đa 255 ký tự</small>
              </label>

              <label className="field">
                <span>Mô tả *</span>
                <textarea 
                  name="description" 
                  value={form.description} 
                  onChange={handleChange}
                  placeholder="Mô tả chi tiết về vị trí công việc..."
                  rows={8}
                  required
                  minLength={50}
                />
                <small className="muted">Tối thiểu 50 ký tự</small>
              </label>

              <label className="field">
                <span>Công ty *</span>
                <input 
                  type="text" 
                  value={company?.name || 'Chưa có công ty'} 
                  disabled
                />
                <small className="muted">Công ty của bạn</small>
              </label>

              <label className="field">
                <span>Loại việc *</span>
                <select name="job_type" value={form.job_type} onChange={handleChange} required>
                  {JOB_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <label className="field">
                  <span>Lương tối thiểu</span>
                  <input 
                    type="number" 
                    name="salary_min" 
                    value={form.salary_min} 
                    onChange={handleChange}
                    min="0"
                  />
                </label>
                <label className="field">
                  <span>Lương tối đa</span>
                  <input 
                    type="number" 
                    name="salary_max" 
                    value={form.salary_max} 
                    onChange={handleChange}
                    min="0"
                  />
                </label>
                <label className="field">
                  <span>Tiền tệ</span>
                  <select name="currency" value={form.currency} onChange={handleChange}>
                    <option value="VND">VND</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </label>
              </div>

              <label className="field">
                <span>Kinh nghiệm (năm)</span>
                <input 
                  type="number" 
                  name="experience_level" 
                  value={form.experience_level} 
                  onChange={handleChange}
                  min="0"
                  max="30"
                />
              </label>

              <label className="field">
                <span>Hết hạn</span>
                <input 
                  type="datetime-local" 
                  name="expires_at" 
                  value={form.expires_at} 
                  onChange={handleChange}
                />
              </label>
            </form>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <span className="muted">Tiêu đề</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: '600' }}>{job.title}</p>
              </div>
              <div>
                <span className="muted">Mô tả</span>
                <p style={{ margin: '4px 0 0 0', whiteSpace: 'pre-wrap' }}>{job.description}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <span className="muted">Công ty</span>
                  <p style={{ margin: '4px 0 0 0' }}>{job.companies?.name || company?.name || '--'}</p>
                </div>
                <div>
                  <span className="muted">Loại việc</span>
                  <p style={{ margin: '4px 0 0 0' }}>
                    {JOB_TYPE_OPTIONS.find(opt => opt.value === job.job_type)?.label || job.job_type}
                  </p>
                </div>
                <div>
                  <span className="muted">Địa điểm</span>
                  <p style={{ margin: '4px 0 0 0' }}>
                    {job.locations?.name || job.location?.name || '--'}
                  </p>
                </div>
                <div>
                  <span className="muted">Kinh nghiệm</span>
                  <p style={{ margin: '4px 0 0 0' }}>
                    {job.experience_level ? `${job.experience_level} năm` : '--'}
                  </p>
                </div>
                <div>
                  <span className="muted">Mức lương</span>
                  <p style={{ margin: '4px 0 0 0' }}>
                    {job.salary_range?.min && job.salary_range?.max
                      ? `${job.salary_range.min.toLocaleString()} - ${job.salary_range.max.toLocaleString()} ${job.salary_range.currency || 'VND'}`
                      : 'Thỏa thuận'}
                  </p>
                </div>
                <div>
                  <span className="muted">Hết hạn</span>
                  <p style={{ margin: '4px 0 0 0' }}>{formatDisplayDate(job.expires_at)}</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'stats' && (
        <Card padding="large">
          {stats ? (
            <div className="job-stats-container">
              <div className="job-stats-grid">
                <Card variant="elevated" padding="medium" className="stat-card-enhanced">
                  <div className="stat-icon">👁️</div>
                  <div className="stat-value">{stats.total_views || stats.views_count || 0}</div>
                  <div className="stat-label">Tổng lượt xem</div>
                </Card>
                <Card variant="elevated" padding="medium" className="stat-card-enhanced">
                  <div className="stat-icon">📝</div>
                  <div className="stat-value">{stats.total_applications || stats.applications_count || 0}</div>
                  <div className="stat-label">Tổng ứng tuyển</div>
                </Card>
                <Card variant="elevated" padding="medium" className="stat-card-enhanced">
                  <div className="stat-icon">📊</div>
                  <div className="stat-value">
                    {stats.total_views > 0 
                      ? `${((stats.total_applications || 0) / stats.total_views * 100).toFixed(1)}%`
                      : '0%'}
                  </div>
                  <div className="stat-label">Tỷ lệ chuyển đổi</div>
                </Card>
              </div>
              {stats.applications_by_status && (
                <div className="job-stats-breakdown">
                  <h3 className="stats-breakdown-title">Ứng tuyển theo trạng thái</h3>
                  <div className="stats-breakdown-list">
                    {Object.entries(stats.applications_by_status).map(([status, count]) => (
                      <div key={status} className="stats-breakdown-item">
                        <span className="stats-breakdown-status">{status}</span>
                        <Badge variant="primary" size="small">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-stats">
              <p>Chưa có thống kê.</p>
            </div>
          )}
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa tin tuyển dụng này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        dangerous={true}
      />

      {/* Status Change Confirmation Modal */}
      <ConfirmDialog
        isOpen={showStatusConfirm}
        onClose={() => {
          setShowStatusConfirm(false)
          setPendingStatus(null)
        }}
        onConfirm={executeStatusChange}
        title="Xác nhận thay đổi trạng thái"
        message={pendingStatus === 'approved' && job?.status === 'draft'
          ? "Bạn có chắc chắn muốn duyệt tin tuyển dụng này? Tin sẽ được xuất bản và hiển thị cho ứng viên."
          : pendingStatus === 'closed'
          ? "Bạn có chắc chắn muốn đóng tin tuyển dụng này? Tin sẽ không còn hiển thị cho ứng viên."
          : "Bạn có chắc chắn muốn mở lại tin tuyển dụng này?"}
        confirmText={pendingStatus === 'approved' && job?.status === 'draft' ? 'Duyệt tin' : pendingStatus === 'closed' ? 'Đóng tin' : 'Mở lại tin'}
        cancelText="Hủy"
      />
    </div>
  )
}

