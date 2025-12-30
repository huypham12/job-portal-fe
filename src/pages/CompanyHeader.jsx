import React from 'react'

export default function CompanyHeader({ company }) {
  const logo = company?.logo_url
  const name = company?.name || 'Công ty'
  const initials = name.slice(0, 1).toUpperCase()
  const industry = company?.company_details?.industry
  const location = company?.company_details?.headquarters_location?.name || company?.contact_address || 'Chưa cập nhật'

  return (
    <section className="cd-card header-card">
      <div className="header-left">
        <div className="header-logo">
          {logo ? <img src={logo} alt={name} /> : <span>{initials}</span>}
        </div>
        <div>
          <div className="header-title-row">
            <h1>{name}</h1>
            {company?.is_verified && <span className="verified-badge">Đã xác minh</span>}
          </div>
          <div className="header-meta">
            {industry && <span>{industry}</span>}
            <span> • {location}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
