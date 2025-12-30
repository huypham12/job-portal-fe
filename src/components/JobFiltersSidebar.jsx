import React, { useState, useEffect } from 'react'
import { SkillAutocomplete } from './jobs/SkillAutocomplete.jsx'
import LocationSelector from './LocationSelector.jsx'
import './JobFiltersSidebar.css'

const JOB_TYPES = [
  { value: 'full_time', label: 'Toàn thời gian' },
  { value: 'part_time', label: 'Bán thời gian' },
  { value: 'contract', label: 'Hợp đồng' }
]

const EXPERIENCE_LEVELS = [
  { value: null, label: 'Tất cả' },
  { value: 0, label: 'Không yêu cầu kinh nghiệm' },
  { value: 1, label: '1 năm' },
  { value: 2, label: '2 năm' },
  { value: 3, label: '3 năm' },
  { value: 4, label: '4 năm' },
  { value: 5, label: '5+ năm' }
]

const JOB_CATEGORIES = [
  { value: 'technology', label: 'Công nghệ' },
  { value: 'business', label: 'Kinh doanh' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'design', label: 'Thiết kế' },
  { value: 'finance', label: 'Tài chính' },
  { value: 'education', label: 'Giáo dục' },
  { value: 'healthcare', label: 'Y tế' },
  { value: 'engineering', label: 'Kỹ thuật' }
]

const JOB_BENEFITS = [
  { value: 'health_insurance', label: 'Bảo hiểm sức khỏe' },
  { value: 'dental_care', label: 'Chăm sóc răng miệng' },
  { value: 'paid_time_off', label: 'Nghỉ phép có lương' },
  { value: 'remote_work', label: 'Làm việc từ xa' },
  { value: 'flexible_hours', label: 'Giờ làm linh hoạt' },
  { value: 'professional_development', label: 'Đào tạo chuyên môn' },
  { value: 'gym_membership', label: 'Phí gym' },
  { value: 'meal_allowance', label: 'Phụ cấp ăn uống' }
]

export default function JobFiltersSidebar({ filters, onFilterChange, showAdvancedFilters = true }) {
  const [salaryMinInput, setSalaryMinInput] = useState(filters.salaryMin || '')
  const [salaryMaxInput, setSalaryMaxInput] = useState(filters.salaryMax || '')
  const [remotePercentage, setRemotePercentage] = useState(filters.remotePercentageMin || 0)

  // Location state - parse current location filter
  const [selectedProvince, setSelectedProvince] = useState(null)
  const [selectedDistrict, setSelectedDistrict] = useState(null)

  // Parse location string on filter change
  React.useEffect(() => {
    // This is a simplified parsing - in reality you'd need to match against actual location data
    // For now, we'll keep it simple and use the location string as is
    setSelectedProvince(null)
    setSelectedDistrict(null)
  }, [filters.location])

  const handleSkillsChange = (selectedSkills) => {
    onFilterChange('skills', selectedSkills.map(skill => typeof skill === 'string' ? skill : skill.name))
  }

  const handleSalaryMinChange = (e) => {
    const value = e.target.value
    setSalaryMinInput(value)
    const numValue = value === '' ? null : parseInt(value, 10)
    if (!isNaN(numValue) || numValue === null) {
      onFilterChange('salaryMin', numValue)
    }
  }

  const handleSalaryMaxChange = (e) => {
    const value = e.target.value
    setSalaryMaxInput(value)
    const numValue = value === '' ? null : parseInt(value, 10)
    if (!isNaN(numValue) || numValue === null) {
      onFilterChange('salaryMax', numValue)
    }
  }

  const handleJobCategoriesChange = (category) => {
    const currentCategories = filters.jobCategories || []
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category]
    onFilterChange('jobCategories', newCategories)
  }

  const handleJobBenefitsChange = (benefit) => {
    const currentBenefits = filters.jobBenefits || []
    const newBenefits = currentBenefits.includes(benefit)
      ? currentBenefits.filter(b => b !== benefit)
      : [...currentBenefits, benefit]
    onFilterChange('jobBenefits', newBenefits)
  }

  const handleRemotePercentageChange = (e) => {
    const value = parseInt(e.target.value, 10)
    setRemotePercentage(value)
    onFilterChange('remotePercentageMin', value > 0 ? value : null)
  }

  return (
    <aside className="job-filters-sidebar" aria-label="Job filters">
      <div className="sidebar-header">
        <h3>Lọc công việc</h3>
        <p>Tìm công việc phù hợp nhất với bạn.</p>
      </div>

      {/* Location */}
      <div className="filter-section">
        <div className="section-label">Địa điểm</div>
        <LocationSelector
          selectedProvince={selectedProvince}
          selectedDistrict={selectedDistrict}
          onProvinceChange={(province) => {
            setSelectedProvince(province)
            // Update location filter with province name or ID
            onFilterChange('location', province ? province.name : '')
            // Also update locationId if you want to use ID-based filtering
            onFilterChange('locationId', province ? province.id : null)
          }}
          onDistrictChange={(district) => {
            setSelectedDistrict(district)
            // Update location filter with district name for text search
            // Backend can handle both province and district in location_name filter
            const locationText = district
              ? `${selectedProvince?.name || ''}, ${district.name}`.trim()
              : selectedProvince?.name || ''
            onFilterChange('location', locationText)
          }}
        />
      </div>

      {/* Job Type */}
      <div className="filter-section">
        <div className="section-label">Loại công việc</div>
        <div className="pill-grid" role="group" aria-label="Loại công việc">
          {JOB_TYPES.map((type) => {
            const active = filters.jobType === type.value
            return (
              <button
                key={type.value}
                type="button"
                className={`pill${active ? ' pill--active' : ''}`}
                onClick={() => onFilterChange('jobType', active ? '' : type.value)}
                aria-pressed={active}
              >
                {type.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Experience Level */}
      <div className="filter-section">
        <div className="section-label">Kinh nghiệm</div>
        <select
          value={filters.experienceLevel || ''}
          onChange={(e) => onFilterChange('experienceLevel', e.target.value === '' ? null : parseInt(e.target.value, 10))}
          className="filter-select"
          aria-label="Mức kinh nghiệm"
        >
          {EXPERIENCE_LEVELS.map((level) => (
            <option key={level.value} value={level.value || ''}>
              {level.label}
            </option>
          ))}
        </select>
      </div>

      {/* Skills */}
      <div className="filter-section">
        <div className="section-label">Kỹ năng</div>
        <SkillAutocomplete
          selectedSkills={filters.skills || []}
          onChange={handleSkillsChange}
          placeholder="Nhập kỹ năng cần thiết..."
          maxSelections={10}
        />
      </div>

      {/* Salary Range */}
      <div className="filter-section">
        <div className="section-label">Mức lương (VND/tháng)</div>
        <div className="range-inputs">
          <label className="range-field">
            <span>Tối thiểu</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="1000000"
              value={salaryMinInput}
              onChange={handleSalaryMinChange}
              placeholder="0"
              aria-label="Mức lương tối thiểu"
            />
          </label>
          <label className="range-field">
            <span>Tối đa</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="1000000"
              value={salaryMaxInput}
              onChange={handleSalaryMaxChange}
              placeholder="Không giới hạn"
              aria-label="Mức lương tối đa"
            />
          </label>
        </div>
      </div>

      {/* Job Categories */}
      <div className="filter-section">
        <div className="section-label">Lĩnh vực</div>
        <div className="checkbox-grid">
          {JOB_CATEGORIES.map((category) => {
            const checked = (filters.jobCategories || []).includes(category.value)
            return (
              <label key={category.value} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleJobCategoriesChange(category.value)}
                  aria-label={`Lĩnh vực ${category.label}`}
                />
                <span className="checkbox-label">{category.label}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Job Benefits */}
      <div className="filter-section">
        <div className="section-label">Phúc lợi</div>
        <div className="checkbox-grid">
          {JOB_BENEFITS.map((benefit) => {
            const checked = (filters.jobBenefits || []).includes(benefit.value)
            return (
              <label key={benefit.value} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleJobBenefitsChange(benefit.value)}
                  aria-label={`Phúc lợi ${benefit.label}`}
                />
                <span className="checkbox-label">{benefit.label}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Remote Work */}
      <div className="filter-section">
        <div className="section-label">Làm việc từ xa</div>
        <div className="remote-controls">
          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={filters.flexibleHours || false}
              onChange={(e) => onFilterChange('flexibleHours', e.target.checked)}
              aria-label="Giờ làm linh hoạt"
            />
            <span className="checkbox-label">Giờ làm linh hoạt</span>
          </label>

          <div className="remote-percentage">
            <label htmlFor="remote-percentage">Mức độ remote tối thiểu: {remotePercentage}%</label>
            <input
              id="remote-percentage"
              type="range"
              min="0"
              max="100"
              step="10"
              value={remotePercentage}
              onChange={handleRemotePercentageChange}
              className="remote-slider"
              aria-label="Mức độ làm việc từ xa tối thiểu"
            />
          </div>
        </div>
      </div>
    </aside>
  )
}
