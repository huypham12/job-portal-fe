import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { JobService, SavedJobsService } from '../lib/api.js'
import { getRole, getAuthToken } from '../auth/auth.js'
import ApplyDrawer from '../components/jobs/ApplyDrawer.jsx'
import './JobDetailsPage.css'

const EXPERIENCE_LABELS = {
  any: 'Bất kỳ',
  0: 'Bất kỳ',
  1: '1 năm',
  2: '2 năm',
  3: '3 năm',
  4: '4 năm',
  5: '5+ năm',
  junior: '1 năm',
  mid: '2 năm',
  senior: '3+ năm'
}

const JOB_TYPE_LABELS = {
  full_time: 'Toàn thời gian',
  part_time: 'Bán thời gian',
  intern: 'Thực tập',
  freelance: 'Freelance'
}

const SAMPLE_JOB_DETAILS = {
  'frontend-engineer': {
    id: 'frontend-engineer',
    title: 'Frontend Engineer',
    company: {
      id: 'lumatech',
      name: 'Luma Tech',
      logoUrl: '',
      size: '100-200',
      description: 'Xây dựng ứng dụng web nhanh, hiện đại cho nền tảng SaaS.',
      contactEmail: 'hr@lumatech.io',
      contactPhone: '+84 24 0000 000',
      contactAddress: 'Hà Nội, Việt Nam'
    },
    location: { name: 'Hà Nội, Việt Nam' },
    salaryRange: { min: 1800, max: 2500, currency: 'USD', period: 'month' },
    jobType: 'full_time',
    experienceLevel: 'mid',
    description:
      'Thiết kế và triển khai giao diện với React/TypeScript. Phối hợp thiết kế và backend để tối ưu hiệu năng.',
    requirements: [
      { title: '3+ năm với React', isRequired: true, yearsExperience: 3, description: 'Thành thạo hooks và tối ưu hiệu năng.' },
      { title: 'TypeScript', isRequired: true, description: 'Hiểu typing nâng cao và linting.' },
      { title: 'Design system', isRequired: false, description: 'Biết dùng token và component tái sử dụng.' }
    ],
    skills: ['React', 'TypeScript', 'CSS'],
    tags: ['Frontend', 'SaaS', 'Remote'],
    benefits: [
      { title: 'Remote linh hoạt', description: 'Hỗ trợ thiết bị làm việc tại nhà.' },
      { title: 'Ngân sách học tập', description: '$1,000/năm cho khoá học và hội thảo.' }
    ],
    workArrangement: {
      isRemoteAllowed: true,
      remotePercentage: 60,
      flexibleHours: true,
      overtimeExpected: false,
      travelRequirement: 'Thỉnh thoảng on-site',
      shiftType: 'Giờ hành chính'
    },
    postedAt: '2025-01-05T08:00:00Z',
    expiresAt: '2025-03-01T08:00:00Z',
    stats: { views: 1200, applicants: 32 },
    status: 'open'
  },
  'backend-developer': {
    id: 'backend-developer',
    title: 'Backend Developer',
    company: {
      id: 'oceansoft',
      name: 'OceanSoft',
      logoUrl: '',
      size: '80-150',
      description: 'Phát triển API cho sản phẩm logistics và thương mại.',
      contactEmail: 'jobs@oceansoft.vn',
      contactPhone: '+84 23 1234 567',
      contactAddress: 'Đà Nẵng, Việt Nam'
    },
    location: { name: 'Đà Nẵng, Việt Nam' },
    salaryRange: { min: 1700, max: 2600, currency: 'USD', period: 'month' },
    jobType: 'full_time',
    experienceLevel: 'mid',
    description: 'Xây dựng và mở rộng API với Node.js/Postgres. Chịu trách nhiệm end-to-end.',
    requirements: [
      { title: 'Node.js/TypeScript', isRequired: true, yearsExperience: 3 },
      { title: 'SQL & Postgres', isRequired: true, description: 'Tối ưu truy vấn và thiết kế schema.' },
      { title: 'Docker cơ bản', isRequired: false }
    ],
    skills: ['Node.js', 'Postgres', 'Docker'],
    tags: ['API', 'Backend', 'Cloud'],
    benefits: [
      { title: 'Bảo hiểm sức khỏe', description: 'Cho bản thân và gia đình.' },
      { title: 'Thưởng quý', description: 'Dựa trên hiệu suất.' }
    ],
    workArrangement: {
      isRemoteAllowed: true,
      remotePercentage: 40,
      flexibleHours: true,
      overtimeExpected: false,
      travelRequirement: 'Hiếm khi',
      shiftType: 'Giờ hành chính'
    },
    postedAt: '2025-01-20T08:00:00Z',
    expiresAt: '2025-03-20T08:00:00Z',
    stats: { views: 980, applicants: 21 },
    status: 'open'
  },
  'product-designer': {
    id: 'product-designer',
    title: 'Product Designer',
    company: {
      id: 'novalabs',
      name: 'Nova Labs',
      logoUrl: '',
      size: '50-100',
      description: 'Thiết kế trải nghiệm chuẩn B2C cho khách hàng B2B.',
      contactEmail: 'hello@novalabs.vn',
      contactAddress: 'TP. Hồ Chí Minh, Việt Nam'
    },
    location: { name: 'TP. Hồ Chí Minh, Việt Nam' },
    salaryRange: { min: 1500, max: 2200, currency: 'USD', period: 'month' },
    jobType: 'part_time',
    experienceLevel: 'senior',
    description: 'Dẫn dắt discovery, tạo luồng sản phẩm trực quan và triển khai UI sắc nét.',
    requirements: [
      { title: 'Portfolio sản phẩm', isRequired: true },
      { title: 'Thành thạo Figma', isRequired: true },
      { title: 'Research & testing', isRequired: false }
    ],
    skills: ['Figma', 'UX', 'Research'],
    tags: ['Design', 'UX', 'UI'],
    benefits: [
      { title: 'Giờ giấc linh hoạt', description: 'Chủ động sắp xếp lịch.' },
      { title: 'Hỗ trợ thiết bị', description: 'Cung cấp laptop và phụ kiện.' }
    ],
    workArrangement: {
      isRemoteAllowed: true,
      remotePercentage: 80,
      flexibleHours: true,
      overtimeExpected: false,
      travelRequirement: 'Tuỳ chọn',
      shiftType: 'Giờ hành chính'
    },
    postedAt: '2025-01-12T08:00:00Z',
    expiresAt: '2025-03-10T08:00:00Z',
    stats: { views: 540, applicants: 18 },
    status: 'open'
  }
}

const formatSalary = (range) => {
  if (!range) return 'Thỏa thuận'
  const { min, max, currency = 'USD', period = 'month' } = range
  const formatter = new Intl.NumberFormat('en-US')
  const suffix = period ? ` / ${period === 'month' ? 'tháng' : period}` : ''
  if (min != null && max != null) return `${formatter.format(min)} - ${formatter.format(max)} ${currency}${suffix}`
  if (min != null) return `${formatter.format(min)} ${currency}${suffix}`
  if (max != null) return `${formatter.format(max)} ${currency}${suffix}`
  return 'Thỏa thuận'
}

const formatDate = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const statusLabel = (status) => {
  const map = { open: 'Đang tuyển', approved: 'Đang tuyển', active: 'Đang tuyển', closed: 'Đã đóng', draft: 'Nháp', paused: 'Tạm dừng' }
  return map[status?.toLowerCase()] || (status ? status : 'Đang tuyển')
}

const statusClass = (status) => {
  const normalized = status?.toLowerCase()
  if (normalized === 'open' || normalized === 'approved' || normalized === 'active') return 'status-open'
  if (normalized === 'closed') return 'status-closed'
  if (normalized === 'paused') return 'status-paused'
  return 'status-default'
}

const normalizeJob = (payload) => {
  const raw = payload?.data ?? payload
  if (!raw) return null

  const salaryRange =
    raw.salaryRange ||
    (raw.salary_range
      ? {
          min: raw.salary_range.min,
          max: raw.salary_range.max,
          currency: raw.salary_range.currency || raw.currency || 'USD',
          period: raw.salary_range.period || raw.period || 'month'
        }
      : raw.salaryMin != null || raw.salaryMax != null || raw.salary_min != null || raw.salary_max != null
      ? {
          min: raw.salaryMin ?? raw.salary_min ?? null,
          max: raw.salaryMax ?? raw.salary_max ?? null,
          currency: raw.currency || raw.salaryCurrency || 'USD',
          period: raw.salaryPeriod || 'month'
        }
      : null)

  // Handle company - backend returns 'companies' (plural) object
  // Get company_id from multiple possible sources
  const companyId = raw.company_id || raw.companyId || raw.companies?.id || raw.company?.id
  
  const company =
    raw.companies && typeof raw.companies === 'object'
      ? {
          ...raw.companies,
          // Ensure id is always set, prioritize from companies object itself
          id: raw.companies.id || companyId,
          name: raw.companies.name,
          logoUrl: raw.companies.logo_url || raw.companies.logoUrl,
          description: raw.companies.description
        }
      : raw.company && typeof raw.company === 'object'
      ? { 
          ...raw.company,
          // Ensure id is always set
          id: raw.company.id || companyId,
          logoUrl: raw.company.logo_url || raw.company.logoUrl
        }
      : raw.companyName
      ? { id: companyId, name: raw.companyName, logoUrl: raw.companyLogoUrl }
      : raw.company
      ? { id: companyId, name: raw.company }
      : null

  // Handle location - backend returns 'locations' (plural) object
  const location =
    raw.locations && typeof raw.locations === 'object'
      ? {
          id: raw.locations.id,
          name: raw.locations.name,
          type: raw.locations.type,
          ...raw.locations
        }
      : typeof raw.location === 'string'
      ? { name: raw.location }
      : raw.location && typeof raw.location === 'object'
      ? raw.location
      : raw.locationName
      ? { name: raw.locationName }
      : null

  // Handle work arrangements - backend returns 'job_work_arrangements' object
  const workArrangement =
    raw.job_work_arrangements && typeof raw.job_work_arrangements === 'object'
      ? {
          isRemoteAllowed: raw.job_work_arrangements.is_remote_allowed,
          remotePercentage: raw.job_work_arrangements.remote_percentage,
          flexibleHours: raw.job_work_arrangements.flexible_hours,
          travelRequirement: raw.job_work_arrangements.travel_requirement,
          overtimeExpected: raw.job_work_arrangements.overtime_expected,
          shiftType: raw.job_work_arrangements.shift_type
        }
      : raw.workArrangement || raw.work_arrangement || raw.workSetting

  // Handle requirements - backend returns 'job_requirements' array
  const requirements =
    Array.isArray(raw.job_requirements)
      ? raw.job_requirements.map((req) => ({
          title: req.title,
          description: req.description,
          isRequired: req.is_required,
          requirementType: req.requirement_type,
          level: req.level,
          yearsExperience: req.years_experience
        }))
      : raw.requirements || []

  // Handle benefits - backend returns 'job_benefits' array
  const benefits =
    Array.isArray(raw.job_benefits)
      ? raw.job_benefits.map((ben) => ({
          title: ben.title,
          description: ben.description,
          benefitType: ben.benefit_type,
          valueAmount: ben.value_amount,
          valueCurrency: ben.value_currency
        }))
      : raw.benefits || []

  // Handle skills - backend returns 'job_skills' array with nested 'skills'
  const skills =
    Array.isArray(raw.job_skills)
      ? raw.job_skills.map((js) => js.skills?.name).filter(Boolean)
      : raw.skills || []

  // Handle tags - backend returns 'job_tags' array with nested 'tags'
  const tags =
    Array.isArray(raw.job_tags)
      ? raw.job_tags.map((jt) => jt.tags?.name).filter(Boolean)
      : raw.tags || []

  // Handle stats from _count
  const stats = raw._count
    ? {
        views: raw._count.job_views || 0,
        applicants: raw._count.applications || 0,
        saved: raw._count.saved_jobs || 0
      }
    : raw.stats || { views: 0, applicants: 0, saved: 0 }

  // Map all job fields
  return {
    // Core job fields
    id: raw.id,
    title: raw.title,
    description: raw.description,
    jobType: raw.job_type || raw.jobType,
    experienceLevel: raw.experience_level !== undefined ? raw.experience_level : raw.experienceLevel,
    status: raw.status,
    metadata: raw.metadata,
    version: raw.version,
    
    // Dates - backend uses snake_case
    postedAt: raw.posted_at || raw.postedAt,
    expiresAt: raw.expires_at || raw.expiresAt,
    createdAt: raw.created_at || raw.createdAt,
    updatedAt: raw.updated_at || raw.updatedAt,
    
    // Salary
    salaryRange,
    
    // Relations
    company,
    location,
    workArrangement,
    requirements,
    benefits,
    skills,
    tags,
    
    // Stats
    stats,
    
    // IDs
    companyId: companyId || raw.companyId || raw.company_id,
    locationId: raw.location_id || raw.locationId,
    
    // Keep all other fields from raw
    ...raw
  }
}

export default function JobDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [checkingSaved, setCheckingSaved] = useState(false)
  const [highlightCompany, setHighlightCompany] = useState(false)
  const [showApply, setShowApply] = useState(false)
  const companySectionRef = useRef(null)
  const highlightTimer = useRef(null)
  const viewTrackedRef = useRef(false)
  const role = getRole()
  const isSeeker = role === 'seeker'

  const fetchJob = useCallback(async () => {
    setLoading(true)
    setError('')
    viewTrackedRef.current = false // Reset tracking when fetching new job
    try {
      const data = await JobService.detail(id)
      const normalized = normalizeJob(data)
      if (!normalized) throw new Error('Không tìm thấy tin tuyển dụng')
      setJob(normalized)
      
      // Track view after successful load (fire and forget)
      if (!viewTrackedRef.current && id) {
        viewTrackedRef.current = true
        JobService.trackView(id).catch((err) => {
          // Silently fail - tracking is not critical
          console.warn('Failed to track job view:', err)
        })
      }
    } catch (err) {
      const fallback = normalizeJob(SAMPLE_JOB_DETAILS[id])
      if (fallback) {
        setJob(fallback)
        setError('')
      } else {
        setError(err?.message || 'Không tải được tin tuyển dụng')
        setJob(null)
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchJob()
  }, [fetchJob])

  // Check if job is saved when component mounts and user is seeker with valid token
  useEffect(() => {
    // Only check if user is seeker, has auth token, job is loaded, and we have job id
    const hasToken = !!getAuthToken()
    if (!isSeeker || !hasToken || !id || loading) {
      setSaved(false)
      setCheckingSaved(false)
      return
    }

    const checkSavedStatus = async () => {
      setCheckingSaved(true)
      try {
        const response = await SavedJobsService.check(id)
        const isSaved = response?.data?.saved ?? response?.saved ?? false
        setSaved(isSaved)
      } catch (err) {
        // If 401, user not authenticated or token expired - silently fail
        if (err?.status === 401) {
          // Token might be expired, don't show error
          setSaved(false)
        } else {
          console.warn('Failed to check saved status:', err)
          setSaved(false)
        }
      } finally {
        setCheckingSaved(false)
      }
    }

    checkSavedStatus()
  }, [id, isSeeker, loading])

  useEffect(() => {
    return () => {
      if (highlightTimer.current) clearTimeout(highlightTimer.current)
    }
  }, [])

  const statusNormalized = (job?.status || '').toLowerCase()
  const isOpen = statusNormalized === 'open' || statusNormalized === 'approved' || statusNormalized === 'active'
  const mustHave = useMemo(() => (job?.requirements || []).filter((req) => req?.isRequired), [job])
  const niceToHave = useMemo(() => (job?.requirements || []).filter((req) => !req?.isRequired), [job])
  const salaryText = formatSalary(job?.salaryRange)
  const skills = job?.skills || []
  const tags = job?.tags || []

  const experienceLabel = EXPERIENCE_LABELS[job?.experienceLevel] || job?.experienceLevel || 'Bất kỳ'
  const jobTypeLabel = JOB_TYPE_LABELS[job?.jobType] || job?.jobType || 'Công việc'

  const handleShare = async () => {
    const shareData = {
      title: job?.title || 'Tin tuyển dụng',
      text: job?.company?.name ? `${job.title} - ${job.company.name}` : job?.title,
      url: window.location.href
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url)
        alert('Đã sao chép liên kết')
      }
    } catch (_) {
      /* ignore */
    }
  }

  const handleSave = async () => {
    if (!isSeeker) {
      navigate('/login?role=seeker&redirect=' + encodeURIComponent(window.location.pathname))
      return
    }

    if (!id) return

    setSaving(true)
    try {
      await SavedJobsService.save(id)
      setSaved(true)
    } catch (err) {
      if (err?.status === 401) {
        navigate('/login?role=seeker&redirect=' + encodeURIComponent(window.location.pathname))
      } else {
        alert(err?.message || 'Không thể lưu tin tuyển dụng. Vui lòng thử lại.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleUnsave = async () => {
    if (!isSeeker || !id) return

    setSaving(true)
    try {
      await SavedJobsService.unsave(id)
      setSaved(false)
    } catch (err) {
      if (err?.status === 401) {
        navigate('/login?role=seeker&redirect=' + encodeURIComponent(window.location.pathname))
      } else {
        alert(err?.message || 'Không thể bỏ lưu tin tuyển dụng. Vui lòng thử lại.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSaveToggle = () => {
    if (saved) {
      handleUnsave()
    } else {
      handleSave()
    }
  }

  const handleApply = () => {
    if (!isOpen) {
      alert('Tin tuyển dụng đã đóng.')
      return
    }
    if (!isSeeker) {
      navigate('/login?role=seeker&redirect=' + encodeURIComponent(window.location.pathname))
      return
    }
    setShowApply(true)
  }

  const handleViewCompany = () => {
    if (!companySectionRef.current) return
    companySectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setHighlightCompany(true)
    if (highlightTimer.current) clearTimeout(highlightTimer.current)
    highlightTimer.current = setTimeout(() => setHighlightCompany(false), 1200)
  }

  const handleOpenCompany = () => {
    // Try multiple sources to get company ID
    const companyId = 
      job?.company?.id || 
      job?.companies?.id ||
      job?.companyId || 
      job?.company_id ||
      job?.company?.companies?.id
    
    if (!companyId) {
      console.warn('Company ID not found in job data:', job)
      alert('Chưa có thông tin công ty.')
      return
    }
    navigate(`/companies/${companyId}`)
  }

  if (loading) {
    return (
      <div className="job-details-page">
        <div className="container">
          <div className="state-card">Đang tải chi tiết công việc...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="job-details-page">
        <div className="container">
          <div className="state-card error">
            <p>{error}</p>
            <button className="btn primary" onClick={fetchJob}>
              Thử lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!job) return null

  return (
    <div className="job-details-page">
      <div className="container">
        <header className="job-header section-card">
          <div className="job-header__left">
            <div className="job-logo">
              {job?.company?.logoUrl ? (
                <img src={job.company.logoUrl} alt={job.company.name || 'Company logo'} />
              ) : (
                <span>{(job?.company?.name || 'C')?.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h1>{job.title}</h1>
              <p className="muted">
                {job?.company?.name || 'Chưa cập nhật'} | {job?.location?.name || 'Làm việc từ xa'}
              </p>
              <div className="meta-row">
                <span className="badge">{jobTypeLabel}</span>
                <span className="badge secondary">{experienceLabel}</span>
                <span className="badge ghost">{salaryText}</span>
                {job.postedAt && <span className="muted">Đăng {formatDate(job.postedAt)}</span>}
              </div>
            </div>
          </div>
          <div className={`status-badge ${statusClass(job.status)}`}>{statusLabel(job.status)}</div>
        </header>

        <div className="action-bar section-card balanced">
          <div className="action-buttons">
            <button className="btn primary" onClick={handleApply} disabled={!isOpen}>
              Ứng tuyển ngay
            </button>
            {isSeeker && (
              <button 
                className="btn ghost" 
                onClick={handleSaveToggle}
                disabled={saving || checkingSaved}
              >
                {saving ? 'Đang xử lý...' : checkingSaved ? 'Đang kiểm tra...' : saved ? 'Đã lưu' : 'Lưu tin'}
              </button>
            )}
            <button className="btn ghost" onClick={handleShare}>
              Chia sẻ
            </button>
            <button className="btn ghost" onClick={handleViewCompany}>
              Xem nhanh công ty
            </button>
            <button className="btn ghost" onClick={handleOpenCompany}>
              Đến trang công ty
            </button>
          </div>
          <div className="muted stats-text">
            {(job?.stats?.views ?? 0).toLocaleString()} lượt xem | {(job?.stats?.applicants ?? 0).toLocaleString()} ứng viên
          </div>
        </div>

        <div className="details-grid wide">
          <main className="details-main">
            <section className="section-card">
              <div className="section-head">
                <h3>Mô tả công việc</h3>
              </div>
              <p className="description-text">{job.description || 'Chưa có mô tả.'}</p>
            </section>

            <section className="section-card">
              <div className="section-head">
                <h3>Yêu cầu</h3>
              </div>
              <div className="requirements-grid">
                <div>
                  <h4>Bắt buộc</h4>
                  {mustHave.length ? (
                    <ul className="bullet-list">
                      {mustHave.map((item, idx) => (
                        <li key={`must-${idx}`}>
                          <div className="req-title">{item.title}</div>
                          {item.description && <p className="muted">{item.description}</p>}
                          {item.yearsExperience ? <span className="pill-chip">{item.yearsExperience}+ năm</span> : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">Chưa có yêu cầu bắt buộc.</p>
                  )}
                </div>
                <div>
                  <h4>Ưu tiên</h4>
                  {niceToHave.length ? (
                    <ul className="bullet-list">
                      {niceToHave.map((item, idx) => (
                        <li key={`nice-${idx}`}>
                          <div className="req-title">{item.title}</div>
                          {item.description && <p className="muted">{item.description}</p>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">Chưa có yêu cầu bổ sung.</p>
                  )}
                </div>
              </div>
            </section>

            <section className="section-card">
              <div className="section-head">
                <h3>Kỹ năng & thẻ</h3>
              </div>
              <div className="chips-row">
                {[...skills, ...tags].map((item) => (
                  <span key={item} className="chip">
                    {item}
                  </span>
                ))}
                {!skills.length && !tags.length && <p className="muted">Chưa có kỹ năng.</p>}
              </div>
            </section>

            <section className="section-card">
              <div className="section-head">
                <h3>Quyền lợi</h3>
              </div>
              {job?.benefits?.length ? (
                <ul className="benefits-list">
                  {job.benefits.map((benefit, idx) => (
                    <li key={`benefit-${idx}`}>
                      <div>
                        <div className="benefit-title">{benefit.title}</div>
                        {benefit.description && <p className="muted">{benefit.description}</p>}
                      </div>
                      {benefit.valueAmount != null && (
                        <span className="pill-chip">
                          {benefit.valueAmount} {benefit.valueCurrency || ''}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Chưa có quyền lợi.</p>
              )}
            </section>

            <section className="section-card">
              <div className="section-head">
                <h3>Hình thức làm việc</h3>
              </div>
              <div className="work-grid">
                <div className="work-item">
                  <span className="work-label">Làm từ xa</span>
                  <span className="work-value">
                    <strong>{job?.workArrangement?.isRemoteAllowed ? 'Có' : 'Tại văn phòng'}</strong>
                    {job?.workArrangement?.remotePercentage != null && (
                      <>
                        <span className="work-divider">|</span>
                        <strong>{job.workArrangement.remotePercentage}%</strong>
                      </>
                    )}
                  </span>
                </div>
                <div className="work-item">
                  <span className="work-label">Giờ giấc linh hoạt</span>
                  <span className="work-value">
                    <strong>{job?.workArrangement?.flexibleHours ? 'Có' : 'Không'}</strong>
                  </span>
                </div>
                <div className="work-item">
                  <span className="work-label">Làm thêm</span>
                  <span className="work-value">
                    <strong>{job?.workArrangement?.overtimeExpected ? 'Có' : 'Không'}</strong>
                  </span>
                </div>
                <div className="work-item">
                  <span className="work-label">Công tác</span>
                  <span className="work-value">
                    <strong>{job?.workArrangement?.travelRequirement || 'Chưa rõ'}</strong>
                  </span>
                </div>
                <div className="work-item">
                  <span className="work-label">Ca làm</span>
                  <span className="work-value">
                    <strong>{job?.workArrangement?.shiftType || 'Chưa rõ'}</strong>
                  </span>
                </div>
              </div>
            </section>
          </main>

          <aside className="details-sidebar sticky">
            <section className="section-card">
              <div className="section-head">
                <h3>Thông tin nhanh</h3>
              </div>
              <div className="quick-info">
                <div>
                  <span className="muted">Mức lương</span>
                  <strong>{salaryText}</strong>
                </div>
                <div>
                  <span className="muted">Hình thức</span>
                  <strong>{jobTypeLabel}</strong>
                </div>
                <div>
                  <span className="muted">Kinh nghiệm</span>
                  <strong>{experienceLabel}</strong>
                </div>
                <div>
                  <span className="muted">Địa điểm</span>
                  <strong>{job?.location?.name || 'Làm việc từ xa'}</strong>
                </div>
                <div>
                  <span className="muted">Ngày đăng</span>
                  <strong>{formatDate(job?.postedAt) || 'N/A'}</strong>
                </div>
                <div>
                  <span className="muted">Hạn ứng tuyển</span>
                  <strong>{formatDate(job?.expiresAt) || 'N/A'}</strong>
                </div>
              </div>
              <div className="sidebar-actions">
                <button className="btn primary" disabled={!isOpen} onClick={handleApply}>
                  Ứng tuyển ngay
                </button>
                <button className="btn ghost" onClick={handleShare}>
                  Chia sẻ
                </button>
              </div>
            </section>

            <section
              ref={companySectionRef}
              className={`section-card company-card ${highlightCompany ? 'is-highlighted' : ''}`}
            >
              <div className="section-head">
                <h3>Công ty</h3>
                <button className="btn ghost small" onClick={handleOpenCompany}>
                  Xem chi tiết
                </button>
              </div>
              <div className="company-header">
                <div className="company-logo">
                  {job?.company?.logoUrl ? (
                    <img src={job.company.logoUrl} alt={job.company.name || 'Company logo'} />
                  ) : (
                    <span>{(job?.company?.name || 'C')?.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <strong>{job?.company?.name || 'Chưa cập nhật'}</strong>
                  {job?.company?.size && <p className="muted">Quy mô: {job.company.size}</p>}
                </div>
              </div>
              {job?.company?.description && <p className="muted">{job.company.description}</p>}

              <div className="company-info">
                {job?.company?.contactEmail && (
                  <div>
                    <span className="muted">Email</span>
                    <strong>{job.company.contactEmail}</strong>
                  </div>
                )}
                {job?.company?.contactPhone && (
                  <div>
                    <span className="muted">Điện thoại</span>
                    <strong>{job.company.contactPhone}</strong>
                  </div>
                )}
                {job?.company?.contactAddress && (
                  <div>
                    <span className="muted">Địa chỉ</span>
                    <strong>{job.company.contactAddress}</strong>
                  </div>
                )}
              </div>

              {(job?.company?.linkedinUrl || job?.company?.facebookUrl || job?.company?.twitterUrl) && (
                <div className="social-links">
                  {job.company.linkedinUrl && (
                    <a href={job.company.linkedinUrl} target="_blank" rel="noreferrer">
                      LinkedIn
                    </a>
                  )}
                  {job.company.facebookUrl && (
                    <a href={job.company.facebookUrl} target="_blank" rel="noreferrer">
                      Facebook
                    </a>
                  )}
                  {job.company.twitterUrl && (
                    <a href={job.company.twitterUrl} target="_blank" rel="noreferrer">
                      Twitter
                    </a>
                  )}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>

      <ApplyDrawer
        open={showApply}
        onClose={() => setShowApply(false)}
        jobId={job?.id}
        jobTitle={job?.title}
        onSubmitted={() => {
          setShowApply(false)
          navigate('/applications')
        }}
      />
    </div>
  )
}
