import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useJobManage } from '../../hooks/useJobs'
import { Button, Card, Badge } from '../../components/shared'
import '../../styles/shared.css'
import './JobView.css'

const JOB_TYPE_LABELS = {
  full_time: 'Toàn thời gian',
  part_time: 'Bán thời gian',
  contract: 'Hợp đồng'
}

const STATUS_LABELS = {
  draft: 'Nháp',
  approved: 'Đã duyệt',
  closed: 'Đã đóng'
}

function formatDate(dateString) {
  if (!dateString) return '--'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return '--'
  }
}

function formatDisplayDate(dateString) {
  if (!dateString) return '--'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '--'
  }
}

export default function JobView() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Use the job management hook to fetch job and stats
  const { job, stats, loading, error } = useJobManage(id)

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
          <button
            className="btn"
            onClick={() => navigate('/recruiter/jobs')}
            style={{ marginTop: '12px' }}
          >
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
          <button
            className="btn"
            onClick={() => navigate('/recruiter/jobs')}
            style={{ marginTop: '12px' }}
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    )
  }

  const status = job.status || 'draft'
  const statusLabel = STATUS_LABELS[status] || status

  return (
    <div className="section job-view-page">
      <div className="job-view-header">
        <div className="job-view-header-left">
          <Button
            variant="ghost"
            onClick={() => navigate('/recruiter/jobs')}
            size="small"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            }
          >
            Quay lại
          </Button>
          <h1 className="job-view-title">{job.title || 'Chưa có tiêu đề'}</h1>
          <div className="job-view-meta">
            <Badge
              variant={status === 'approved' ? 'success' : status === 'closed' ? 'danger' : 'default'}
              icon={
                status === 'approved' ? '✓' : status === 'closed' ? '✕' : '○'
              }
            >
              {statusLabel}
            </Badge>
            <span className="job-view-date">
              Đăng: {formatDisplayDate(job.posted_at)}
            </span>
          </div>
        </div>
        <div className="job-view-actions">
          <Button
            variant="default"
            onClick={() => navigate(`/recruiter/jobs/${id}/manage`)}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            }
          >
            Chỉnh sửa
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/recruiter/jobs/${id}/applications`)}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            }
          >
            Xem ứng tuyển
          </Button>
        </div>
      </div>

      <div className="job-view-content">
        {/* Job Information */}
        <Card padding="large" className="job-info-card">
          <h3 className="card-title">Thông tin công việc</h3>
          <div className="job-info-grid">
            <div className="info-item">
              <span className="info-label">Tiêu đề</span>
              <p className="info-value">{job.title}</p>
            </div>
            <div className="info-item">
              <span className="info-label">Công ty</span>
              <p className="info-value">{job.companies?.name || job.company?.name || '--'}</p>
            </div>
            <div className="info-item">
              <span className="info-label">Loại việc</span>
              <p className="info-value">{JOB_TYPE_LABELS[job.job_type] || job.job_type || '--'}</p>
            </div>
            <div className="info-item">
              <span className="info-label">Địa điểm</span>
              <p className="info-value">{job.locations?.name || job.location?.name || job.location_text || '--'}</p>
            </div>
            <div className="info-item">
              <span className="info-label">Kinh nghiệm</span>
              <p className="info-value">{job.experience_level ? `${job.experience_level} năm` : '--'}</p>
            </div>
            <div className="info-item">
              <span className="info-label">Mức lương</span>
              <p className="info-value">
                {job.salary_range?.min && job.salary_range?.max
                  ? `${job.salary_range.min.toLocaleString()} - ${job.salary_range.max.toLocaleString()} ${job.salary_range.currency || 'VND'}`
                  : 'Thỏa thuận'}
              </p>
            </div>
            <div className="info-item">
              <span className="info-label">Ngày đăng</span>
              <p className="info-value">{formatDate(job.posted_at)}</p>
            </div>
            <div className="info-item">
              <span className="info-label">Hết hạn</span>
              <p className="info-value">{formatDate(job.expires_at)}</p>
            </div>
          </div>

          {job.description && (
            <div className="job-description">
              <span className="info-label">Mô tả công việc</span>
              <div className="description-content">
                {job.description.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          )}

          {job.skills && job.skills.length > 0 && (
            <div className="job-skills">
              <span className="info-label">Kỹ năng yêu cầu</span>
              <div className="skills-list">
                {job.skills.map((skill) => (
                  <Badge key={skill.id} variant="outline" size="small">
                    {skill.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Job Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="job-requirements">
              <span className="info-label">Yêu cầu công việc</span>
              <div className="requirements-list">
                {job.requirements.map((req, index) => (
                  <div key={req.id || index} className="requirement-item">
                    <div className="requirement-header">
                      <Badge
                        variant={req.is_required ? "danger" : "default"}
                        size="small"
                        icon={req.is_required ? "⚠️" : "ℹ️"}
                      >
                        {req.requirement_type === 'education' ? 'Học vấn' :
                         req.requirement_type === 'experience' ? 'Kinh nghiệm' :
                         req.requirement_type === 'skill' ? 'Kỹ năng' :
                         req.requirement_type === 'certification' ? 'Chứng chỉ' :
                         req.requirement_type === 'language' ? 'Ngoại ngữ' :
                         req.requirement_type}
                      </Badge>
                      <strong>{req.title}</strong>
                      {req.level && <span className="requirement-level">({req.level})</span>}
                      {req.years_experience && <span className="requirement-exp">{req.years_experience} năm</span>}
                    </div>
                    {req.description && (
                      <p className="requirement-description">{req.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Job Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <div className="job-benefits">
              <span className="info-label">Phúc lợi & Đãi ngộ</span>
              <div className="benefits-list">
                {job.benefits.map((benefit, index) => (
                  <div key={benefit.id || index} className="benefit-item">
                    <div className="benefit-header">
                      <Badge
                        variant="success"
                        size="small"
                        icon="🎁"
                      >
                        {benefit.benefit_type === 'salary' ? 'Lương thưởng' :
                         benefit.benefit_type === 'insurance' ? 'Bảo hiểm' :
                         benefit.benefit_type === 'bonus' ? 'Thưởng' :
                         benefit.benefit_type === 'training' ? 'Đào tạo' :
                         benefit.benefit_type === 'vacation' ? 'Nghỉ phép' :
                         benefit.benefit_type === 'equipment' ? 'Trang thiết bị' :
                         benefit.benefit_type}
                      </Badge>
                      <strong>{benefit.title}</strong>
                      {benefit.value_amount && (
                        <span className="benefit-value">
                          {benefit.value_amount.toLocaleString()} {benefit.value_currency || 'VND'}
                        </span>
                      )}
                    </div>
                    {benefit.description && (
                      <p className="benefit-description">{benefit.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Work Arrangements */}
          {job.work_arrangements && (
            <div className="work-arrangements">
              <span className="info-label">Điều kiện làm việc</span>
              <div className="arrangements-grid">
                {job.work_arrangements.is_remote_allowed && (
                  <div className="arrangement-item">
                    <Badge variant="primary" size="small" icon="🏠">
                      Làm việc từ xa
                    </Badge>
                    {job.work_arrangements.remote_percentage > 0 && (
                      <span className="arrangement-detail">
                        {job.work_arrangements.remote_percentage}% thời gian
                      </span>
                    )}
                  </div>
                )}

                {job.work_arrangements.flexible_hours && (
                  <div className="arrangement-item">
                    <Badge variant="primary" size="small" icon="⏰">
                      Giờ làm linh hoạt
                    </Badge>
                  </div>
                )}

                {job.work_arrangements.shift_type && (
                  <div className="arrangement-item">
                    <Badge variant="outline" size="small" icon="📅">
                      {job.work_arrangements.shift_type === 'morning' ? 'Ca sáng' :
                       job.work_arrangements.shift_type === 'afternoon' ? 'Ca chiều' :
                       job.work_arrangements.shift_type === 'night' ? 'Ca đêm' :
                       job.work_arrangements.shift_type === 'flexible' ? 'Linh hoạt' :
                       job.work_arrangements.shift_type}
                    </Badge>
                  </div>
                )}

                {job.work_arrangements.travel_requirement && (
                  <div className="arrangement-item">
                    <Badge variant="outline" size="small" icon="✈️">
                      Công tác: {job.work_arrangements.travel_requirement}
                    </Badge>
                  </div>
                )}

                {job.work_arrangements.overtime_expected && (
                  <div className="arrangement-item">
                    <Badge variant="warning" size="small" icon="⏱️">
                      Có thể làm thêm giờ
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Statistics */}
        {stats && (
          <Card padding="large" className="job-stats-card">
            <h3 className="card-title">Thống kê</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-icon">👁️</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.total_views || stats.views_count || 0}</div>
                  <div className="stat-label">Tổng lượt xem</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">📝</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.total_applications || stats.applications_count || 0}</div>
                  <div className="stat-label">Tổng ứng tuyển</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <div className="stat-value">
                    {stats.total_views > 0
                      ? `${((stats.total_applications || 0) / stats.total_views * 100).toFixed(1)}%`
                      : '0%'}
                  </div>
                  <div className="stat-label">Tỷ lệ chuyển đổi</div>
                </div>
              </div>
            </div>

            {stats.applications_by_status && Object.keys(stats.applications_by_status).length > 0 && (
              <div className="applications-breakdown">
                <h4>Ứng tuyển theo trạng thái</h4>
                <div className="status-breakdown">
                  {Object.entries(stats.applications_by_status).map(([status, count]) => (
                    <div key={status} className="status-item">
                      <span className="status-label">{status}</span>
                      <Badge variant="primary" size="small">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
