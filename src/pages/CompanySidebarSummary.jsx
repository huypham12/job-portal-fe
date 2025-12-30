import React from 'react'

export default function CompanySidebarSummary({ company, formatEmployeeRange, onQuickApply }) {
  const openJobs = company?.stats?.open_jobs_count || (company.open_jobs || []).length || 0
  const details = company?.company_details || {}
  const location = details.headquarters_location?.name || company?.contact_address || 'Chưa rõ'

  return (
    <div className="cd-card sidebar-card">
      <div className="section-head">
        <h3>Tổng quan</h3>
      </div>
      <div className="summary-list">
        <div className="summary-item">
          <span className="info-label">Đang tuyển</span>
          <strong className="info-value">{openJobs} vị trí</strong>
        </div>
        <div className="summary-item">
          <span className="info-label">Năm thành lập</span>
          <strong className="info-value">{details.founded_year || 'Chưa rõ'}</strong>
        </div>
        <div className="summary-item">
          <span className="info-label">Quy mô</span>
          <strong className="info-value">{formatEmployeeRange(company)}</strong>
        </div>
        <div className="summary-item">
          <span className="info-label">Ngành</span>
          <strong className="info-value">{details.industry || 'Chưa rõ'}</strong>
        </div>
        <div className="summary-item">
          <span className="info-label">Trụ sở</span>
          <strong className="info-value">{location}</strong>
        </div>
      </div>
      <div className="sidebar-actions">
        <button className="btn primary" onClick={onQuickApply}>
          Ứng tuyển nhanh
        </button>
      </div>
    </div>
  )
}
