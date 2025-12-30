import React from 'react'

export default function CompanyContactSection({ company }) {
  const details = company?.company_details || {}
  const website = details.website_url

  const socials = [
    { label: 'LinkedIn', url: company?.linkedin_url },
    { label: 'Facebook', url: company?.facebook_url },
    { label: 'Twitter', url: company?.twitter_url },
  ].filter((s) => s.url)

  const hasContact =
    company?.contact_email || company?.contact_phone || company?.contact_address || website || socials.length

  if (!hasContact) return null

  return (
    <section className="cd-card">
      <div className="section-head">
        <h3>Liên hệ</h3>
      </div>
      <div className="contact-list">
        {company?.contact_email && (
          <div className="contact-row">
            <span className="info-label">Email</span>
            <a href={`mailto:${company.contact_email}`} className="link">
              {company.contact_email}
            </a>
          </div>
        )}
        {company?.contact_phone && (
          <div className="contact-row">
            <span className="info-label">Điện thoại</span>
            <a href={`tel:${company.contact_phone}`} className="link">
              {company.contact_phone}
            </a>
          </div>
        )}
        {company?.contact_address && (
          <div className="contact-row">
            <span className="info-label">Địa chỉ</span>
            <span className="info-value">{company.contact_address}</span>
          </div>
        )}
        {website && (
          <div className="contact-row">
            <span className="info-label">Website</span>
            <a href={website} target="_blank" rel="noreferrer" className="link">
              {website}
            </a>
          </div>
        )}
        {socials.length ? (
          <div className="contact-row">
            <span className="info-label">Mạng xã hội</span>
            <div className="social-inline">
              {socials.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noreferrer" className="chip-link">
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
