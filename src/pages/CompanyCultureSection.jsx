import React, { useState } from 'react'

export default function CompanyCultureSection({ culture }) {
  const [expanded, setExpanded] = useState(false)
  if (!culture) {
    return (
      <section className="cd-card culture-card">
        <div className="section-head">
          <h3>Văn hóa</h3>
        </div>
        <p className="muted">Chưa cập nhật thông tin văn hóa.</p>
      </section>
    )
  }

  const shouldClamp = culture.length > 220
  const displayText = !shouldClamp || expanded ? culture : `${culture.slice(0, 220)}...`

  return (
    <section className="cd-card culture-card">
      <div className="section-head">
        <h3>Văn hóa</h3>
      </div>
      <p className="description-text">{displayText}</p>
      {shouldClamp && (
        <button className="link-btn small" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Thu gọn' : 'Xem thêm'}
        </button>
      )}
    </section>
  )
}
