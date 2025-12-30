import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const formatSize = (company) => {
  const details = company?.company_details || {}
  if (details.employee_count_min && details.employee_count_max) {
    return `${details.employee_count_min}-${details.employee_count_max}`
  }
  if (company.size) return `${company.size}`
  return 'N/A'
}

const truncateText = (text, expanded) => {
  if (expanded || !text) return text
  if (text.length <= 160) return text
  return `${text.slice(0, 160)}...`
}

export default function CompanyCard({ company }) {
  const [expanded, setExpanded] = useState(false)
  const logoFallback = (company?.name || 'C').slice(0, 1).toUpperCase()
  const openJobs = company?.stats?.open_jobs_count || 0
  const desc = company?.description_short || company?.description || ''

  return (
    <article className="company-card">
      <div className="company-card__head">
        <div className="logo-circle">
          {company?.logo_url ? <img src={company.logo_url} alt={company.name} /> : <span>{logoFallback}</span>}
        </div>
        <div className="company-meta">
          <div className="name-row">
            <Link className="link-btn" to={`/companies/${company.id}`}>
              {company.name}
            </Link>
            {company.is_verified && <span className="verified">Đã xác minh</span>}
          </div>
          <div className="meta-row company-line">
            {company?.company_details?.industry && <span>{company.company_details.industry}</span>}
            {company?.location?.name && <span> | {company.location.name}</span>}
          </div>
          <div className="meta-row company-line">
            {company?.company_details?.company_type && <span>{company.company_details.company_type}</span>}
            <span> | {formatSize(company)} nhân sự</span>
            <span> | {openJobs} tin đang mở</span>
          </div>
        </div>
      </div>

      {desc && (
        <p className="company-desc">
          {truncateText(desc, expanded)}{' '}
          {desc.length > 160 && (
            <button className="link-btn small" onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'Thu gọn' : 'Xem thêm'}
            </button>
          )}
        </p>
      )}

      <div className="company-links">
        <Link className="btn ghost" to={`/companies/${company.id}`} aria-label={`Xem chi tiet ${company.name || ''}`}>
          Xem chi tiet
        </Link>
        <div className="social-links tiny">
          {company?.linkedin_url && (
            <a href={company.linkedin_url} target="_blank" rel="noreferrer" aria-label="LinkedIn">
              in
            </a>
          )}
          {company?.facebook_url && (
            <a href={company.facebook_url} target="_blank" rel="noreferrer" aria-label="Facebook">
              f
            </a>
          )}
          {company?.twitter_url && (
            <a href={company.twitter_url} target="_blank" rel="noreferrer" aria-label="Twitter">
              x
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
