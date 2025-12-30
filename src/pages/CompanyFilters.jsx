import React, { useState } from 'react'
import './CompanyFilters.css'

export default function CompanyFilters({
  filters,
  onChange,
  onApply,
  onClear,
  sizeOptions,
  industryOptions,
  locationOptions,
  companyTypeOptions
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleInput = (key, value) => {
    onChange({ [key]: value })
  }

  const content = (
    <div className="filters-card">
      <div className="filters-header">
        <h3>Tìm công ty</h3>
        <p className="filters-sub">Lọc nhanh danh sách nhà tuyển dụng</p>
      </div>

      <div className="filters-group">
        <label className="filters-label">Từ khóa</label>
        <input
          className="filters-input"
          type="text"
          placeholder="Nhập tên, mô tả công ty"
          value={filters.search}
          onChange={(e) => handleInput('search', e.target.value)}
        />
      </div>

      <div className="filters-group">
        <label className="filters-label">Ngành</label>
        <select
          className="filters-select"
          value={filters.industry}
          onChange={(e) => handleInput('industry', e.target.value)}
        >
          {industryOptions.map((opt) => (
            <option key={opt.value || opt.label} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filters-group">
        <label className="filters-label">Địa điểm</label>
        <select
          className="filters-select"
          value={filters.location_id}
          onChange={(e) => handleInput('location_id', e.target.value)}
        >
          {locationOptions.map((opt) => (
            <option key={opt.value || opt.label} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filters-group">
        <label className="filters-label">Loại hình công ty</label>
        <select
          className="filters-select"
          value={filters.company_type}
          onChange={(e) => handleInput('company_type', e.target.value)}
        >
          {companyTypeOptions.map((opt) => (
            <option key={opt.value || opt.label} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filters-group">
        <label className="filters-label">Quy mô</label>
        <select
          className="filters-select"
          value={filters.size_range}
          onChange={(e) => handleInput('size_range', e.target.value)}
        >
          {sizeOptions.map((opt) => (
            <option key={opt.value || opt.label} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filters-group filters-checkbox">
        <label>
          <input
            type="checkbox"
            checked={filters.has_open_jobs}
            onChange={(e) => handleInput('has_open_jobs', e.target.checked)}
          />
          <span>Chỉ hiện công ty đang tuyển</span>
        </label>
      </div>

      <button className="filters-reset" onClick={onClear} type="button">
        Xóa bộ lọc
      </button>
      <button className="filters-apply" onClick={onApply} type="button">
        Áp dụng
      </button>
    </div>
  )

  return (
    <div className="filters-sidebar">
      <button className="filters-toggle" onClick={() => setMobileOpen((v) => !v)}>
        {mobileOpen ? 'Ẩn bộ lọc' : 'Hiển thị bộ lọc'}
      </button>
      <div className={`filters-desktop ${mobileOpen ? 'open' : ''}`}>{content}</div>
    </div>
  )
}
