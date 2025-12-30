import { Link } from 'react-router-dom'
import './JobCard.css'

const JOB_TYPE_LABELS = {
  full_time: 'Toàn thời gian',
  part_time: 'Bán thời gian',
  intern: 'Thực tập',
  freelance: 'Freelance'
}

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

const formatSalary = (job) => {
  const range = job.salary_range || {}
  const min = job.salaryMin ?? range.min
  const max = job.salaryMax ?? range.max
  const currency = (job.currency || range.currency || 'USD').toUpperCase()

  if (job.salary) return job.salary
  if (min == null && max == null) return 'Thỏa thuận'

  const formatter = new Intl.NumberFormat('en-US')
  if (min != null && max != null) return `${formatter.format(min)} - ${formatter.format(max)} ${currency}`
  if (min != null) return `${formatter.format(min)} ${currency}`
  return `${formatter.format(max)} ${currency}`
}

const formatCreatedAt = (createdAt) => {
  if (!createdAt) return ''
  const now = Date.now()
  const created = new Date(createdAt).getTime()
  const diffMs = now - created
  const dayMs = 24 * 60 * 60 * 1000
  if (diffMs < dayMs) return 'Hôm nay'
  const days = Math.floor(diffMs / dayMs)
  return `${days} ngày trước`
}

const renderHighlightedText = (text, highlights = {}) => {
  if (!text || !highlights) return text

  // Simple highlight rendering - in a real app you'd use a proper highlighting library
  let highlightedText = text

  // Apply title highlights if available
  if (highlights.title && highlights.title.length > 0) {
    highlights.title.forEach(highlight => {
      const cleanHighlight = highlight.replace(/<\/?em>/g, '')
      highlightedText = highlightedText.replace(
        new RegExp(cleanHighlight, 'gi'),
        `<mark>${cleanHighlight}</mark>`
      )
    })
  }

  // Apply description highlights if available
  if (highlights.description && highlights.description.length > 0) {
    highlights.description.forEach(highlight => {
      const cleanHighlight = highlight.replace(/<\/?em>/g, '')
      highlightedText = highlightedText.replace(
        new RegExp(cleanHighlight, 'gi'),
        `<mark>${cleanHighlight}</mark>`
      )
    })
  }

  return highlightedText
}

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/)
  if (!parts.length) return '?'
  const [a, b] = parts
  return (a?.[0] || '') + (b?.[0] || '')
}

export default function JobCard({ job, highlight }) {
  const companyName = job.companyName || job.company || 'Chưa có tên công ty'
  const title = job.title || 'Chưa đặt tiêu đề'
  const location = job.location || job.city || job.country || 'Bất kỳ'
  const jobTypeRaw = job.jobType || job.job_type || job.type
  const jobTypeLabel = JOB_TYPE_LABELS[jobTypeRaw] || jobTypeRaw || 'Khác'
  const experienceRaw = job.experienceLevel ?? job.experience ?? job.experience_level ?? 'any'
  const experienceLabel = EXPERIENCE_LABELS[experienceRaw] || 'Bất kỳ'
  const salary = formatSalary(job)
  const created = formatCreatedAt(job.createdAt || job.posted_at)
  const skills = job.skills || job.tags || job.metadata?.skills || []

  const logoUrl = job.companyLogoUrl || job.logoUrl
  const logoFallback = job.logo || getInitials(companyName)

  return (
    <article className="job-card">
      <div className="job-card__head">
        {logoUrl ? (
          <img className="job-logo" src={logoUrl} alt={companyName} />
        ) : (
          <div className="job-logo placeholder" aria-hidden="true">
            {logoFallback}
          </div>
        )}
        <div>
          <h3>{title}</h3>
          <p className="company">{companyName}</p>
          <p className="location">{location}</p>
        </div>
      </div>

      <div className="job-meta">
        <span className="badge">{jobTypeLabel}</span>
        <span className="badge secondary">{experienceLabel}</span>
        {(job.is_remote_allowed || job.flexible_hours) && (
          <span className="badge remote">
            {job.is_remote_allowed ? 'Remote' : ''}
            {job.is_remote_allowed && job.flexible_hours ? ' + ' : ''}
            {job.flexible_hours ? 'Linh hoạt' : ''}
          </span>
        )}
        <span className="salary">{salary}</span>
        {created && <span className="created">{created}</span>}
      </div>

      {job.descriptionShort || job.description ? (
        <p
          className="description"
          dangerouslySetInnerHTML={{
            __html: renderHighlightedText(job.descriptionShort || job.description, highlight)
          }}
        />
      ) : null}

      {!!skills.length && (
        <div className="skills-row">
          {skills.map((skill) => (
            <span key={skill} className="chip small">
              {skill}
            </span>
          ))}
        </div>
      )}

      {job.id && (
        <div className="job-card__footer">
          <Link to={`/jobs/${job.id}`} className="btn-inline">
            Xem chi tiết →
          </Link>
        </div>
      )}
    </article>
  )
}
