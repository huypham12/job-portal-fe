import React from 'react'
import { Link } from 'react-router-dom'
import './CandidateCard.css'

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/)
  if (!parts.length) return '?'
  const [first, last] = parts
  return (first?.[0] || '') + (last?.[0] || '')
}

const formatExperience = (years) => {
  if (!years || years === 0) return 'Chưa có kinh nghiệm'
  if (years < 1) return 'Dưới 1 năm'
  if (years === 1) return '1 năm'
  return `${years} năm`
}

const formatLocation = (location) => {
  if (!location) return 'Không xác định'
  return location
}

const formatSalary = (min, max, currency = 'VND') => {
  if (!min && !max) return 'Thỏa thuận'

  const formatter = new Intl.NumberFormat('vi-VN')

  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)} ${currency}`
  }
  if (min) return `Từ ${formatter.format(min)} ${currency}`
  if (max) return `Đến ${formatter.format(max)} ${currency}`

  return 'Thỏa thuận'
}

export default function CandidateCard({
  candidate,
  onClick,
  showActions = true,
  compact = false,
  score = null,
  experimentVariant = null,
  className = ''
}) {
  const profile = candidate._source || candidate
  const {
    id,
    user_id,
    full_name,
    display_name,
    headline,
    bio,
    avatar_url,
    location_text,
    years_of_experience,
    desired_salary_min,
    desired_salary_max,
    desired_salary_currency,
    skills_flat,
    skills,
    is_looking_for_job,
    updated_at
  } = profile

  const displayName = display_name || full_name || 'Ứng viên'
  const jobTitle = headline || 'Chưa cập nhật'
  const location = formatLocation(location_text)
  const experience = formatExperience(years_of_experience)
  const salary = formatSalary(desired_salary_min, desired_salary_max, desired_salary_currency)

  // Extract skills from various formats
  const candidateSkills = skills_flat || (skills && skills.map(s => typeof s === 'string' ? s : s.name)) || []
  const topSkills = candidateSkills.slice(0, 4)

  const handleClick = () => {
    if (onClick) onClick(candidate)
  }

  return (
    <article
      className={`candidate-card ${compact ? 'compact' : ''} ${className}`}
      onClick={handleClick}
    >
      <div className="candidate-header">
        {avatar_url ? (
          <img
            src={avatar_url}
            alt={displayName}
            className="candidate-avatar"
          />
        ) : (
          <div className="candidate-avatar placeholder">
            {getInitials(displayName)}
          </div>
        )}

        <div className="candidate-info">
          <h3 className="candidate-name">{displayName}</h3>
          <p className="candidate-title">{jobTitle}</p>
          <p className="candidate-location">{location}</p>
        </div>

        {score && (
          <div className="candidate-score">
            <div className="score-badge">
              {Math.round(score * 100)}%
            </div>
            <span className="score-label">Phù hợp</span>
          </div>
        )}
      </div>

      <div className="candidate-details">
        <div className="candidate-meta">
          <span className="meta-item">
            <span className="meta-icon">💼</span>
            {experience}
          </span>
          <span className="meta-item">
            <span className="meta-icon">💰</span>
            {salary}
          </span>
          {is_looking_for_job && (
            <span className="meta-item active">
              <span className="meta-icon">🔥</span>
              Đang tìm việc
            </span>
          )}
        </div>

        {bio && (
          <p className="candidate-bio">
            {bio.length > 120 ? `${bio.substring(0, 120)}...` : bio}
          </p>
        )}

        {topSkills.length > 0 && (
          <div className="candidate-skills">
            {topSkills.map((skill, index) => (
              <span key={index} className="skill-tag">
                {skill}
              </span>
            ))}
            {candidateSkills.length > 4 && (
              <span className="skill-more">
                +{candidateSkills.length - 4} kỹ năng
              </span>
            )}
          </div>
        )}
      </div>

      {experimentVariant && (
        <div className="experiment-badge">
          <span className="variant-label">{experimentVariant}</span>
        </div>
      )}

      {showActions && (
        <div className="candidate-actions">
          <Link
            to={`/candidates/${id || user_id}`}
            className="action-btn view-profile"
            onClick={(e) => e.stopPropagation()}
          >
            Xem hồ sơ
          </Link>
          <button
            className="action-btn contact"
            onClick={(e) => {
              e.stopPropagation()
              // TODO: Implement contact functionality
              console.log('Contact candidate:', id)
            }}
          >
            Liên hệ
          </button>
        </div>
      )}
    </article>
  )
}
