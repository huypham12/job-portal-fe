import React from 'react'

const Item = ({ label, value }) => {
  if (!value) return null
  return (
    <div className="info-item">
      <span className="info-label">{label}</span>
      <strong className="info-value">{value}</strong>
    </div>
  )
}

const formatEmployeeRange = (company) => {
  const details = company?.company_details || {}
  if (details.employee_count_min && details.employee_count_max) {
    return `${details.employee_count_min}-${details.employee_count_max} nhân sự`
  }
  if (company?.size) return `${company.size} nhân sự`
  return 'Chưa rõ'
}

export default function CompanyInfoSection({ company }) {
  const details = company?.company_details || {}

  return (
    <section className="cd-card">
      <div className="section-head">
        <h3>Thông tin chung</h3>
      </div>
      <div className="info-grid">
        <Item label="Ngành nghề" value={details.industry} />
        <Item label="Loại hình công ty" value={details.company_type} />
        <Item label="Năm thành lập" value={details.founded_year} />
        <Item label="Quy mô" value={formatEmployeeRange(company)} />
        <Item label="Doanh thu" value={details.revenue_range} />
        <Item label="Mã cổ phiếu" value={details.stock_symbol} />
        <Item label="Mã số thuế" value={company?.tax_code} />
        <Item label="Trạng thái" value={company?.status} />
      </div>
    </section>
  )
}
