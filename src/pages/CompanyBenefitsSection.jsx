import React from 'react'

export default function CompanyBenefitsSection({ benefits = [] }) {
  if (!benefits || !benefits.length) {
    return (
      <section className="cd-card">
        <div className="section-head">
          <h3>Quyền lợi</h3>
        </div>
        <p className="muted">Chưa có quyền lợi nào được cập nhật.</p>
      </section>
    )
  }

  return (
    <section className="cd-card">
      <div className="section-head">
        <h3>Quyền lợi</h3>
      </div>
      <div className="benefits-list">
        {benefits.map((item) => (
          <div key={item.id || item.title} className={`benefit-item ${item.is_featured ? 'featured' : ''}`}>
            <div>
              <div className="benefit-title">{item.title}</div>
              {item.description && <p className="muted">{item.description}</p>}
            </div>
            <div className="benefit-meta">
              <span className="pill">{item.benefit_type}</span>
              {item.is_featured && <span className="pill success">Nổi bật</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
