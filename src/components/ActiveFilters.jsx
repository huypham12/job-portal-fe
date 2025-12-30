import React from 'react'
import './ActiveFilters.css'

const JOB_TYPES = {
  full_time: 'Toàn thời gian',
  part_time: 'Bán thời gian',
  contract: 'Hợp đồng'
}

const EXPERIENCE_LEVELS = {
  0: 'Không yêu cầu kinh nghiệm',
  1: '1 năm',
  2: '2 năm',
  3: '3 năm',
  4: '4 năm',
  5: '5+ năm'
}

const SORT_LABELS = {
  relevance: 'Liên quan nhất',
  newest: 'Mới nhất',
  oldest: 'Cũ nhất',
  salary_high: 'Lương cao nhất',
  salary_low: 'Lương thấp nhất',
  experience_high: 'Kinh nghiệm nhiều nhất',
  experience_low: 'Kinh nghiệm ít nhất'
}

export default function ActiveFilters({ filters, onRemoveFilter, className = '' }) {
  const activeFilters = []

  // Location
  if (filters.location) {
    activeFilters.push({
      key: 'location',
      label: `Địa điểm: ${filters.location}`,
      value: 'location'
    })
  }

  // Job type
  if (filters.jobType) {
    activeFilters.push({
      key: 'jobType',
      label: `Loại công việc: ${JOB_TYPES[filters.jobType] || filters.jobType}`,
      value: 'jobType'
    })
  }

  // Experience level
  if (filters.experienceLevel !== null && filters.experienceLevel !== undefined) {
    activeFilters.push({
      key: 'experienceLevel',
      label: `Kinh nghiệm: ${EXPERIENCE_LEVELS[filters.experienceLevel] || `${filters.experienceLevel} năm`}`,
      value: 'experienceLevel'
    })
  }

  // Skills
  if (filters.skills && filters.skills.length > 0) {
    filters.skills.forEach((skill, index) => {
      activeFilters.push({
        key: `skill-${index}`,
        label: `Kỹ năng: ${skill}`,
        value: 'skills',
        skillValue: skill
      })
    })
  }

  // Salary range
  if (filters.salaryMin || filters.salaryMax) {
    const min = filters.salaryMin ? `${filters.salaryMin.toLocaleString()} VND` : '0 VND'
    const max = filters.salaryMax ? `${filters.salaryMax.toLocaleString()} VND` : '∞'
    activeFilters.push({
      key: 'salary',
      label: `Lương: ${min} - ${max}`,
      value: 'salary'
    })
  }

  // Job categories
  if (filters.jobCategories && filters.jobCategories.length > 0) {
    filters.jobCategories.forEach((category, index) => {
      activeFilters.push({
        key: `category-${index}`,
        label: `Danh mục: ${category}`,
        value: 'jobCategories',
        categoryValue: category
      })
    })
  }

  // Job benefits
  if (filters.jobBenefits && filters.jobBenefits.length > 0) {
    filters.jobBenefits.forEach((benefit, index) => {
      activeFilters.push({
        key: `benefit-${index}`,
        label: `Phúc lợi: ${benefit}`,
        value: 'jobBenefits',
        benefitValue: benefit
      })
    })
  }

  // Remote percentage
  if (filters.remotePercentageMin !== null && filters.remotePercentageMin !== undefined) {
    activeFilters.push({
      key: 'remotePercentage',
      label: `Remote: ≥${filters.remotePercentageMin}%`,
      value: 'remotePercentageMin'
    })
  }

  // Flexible hours
  if (filters.flexibleHours !== null && filters.flexibleHours !== undefined) {
    activeFilters.push({
      key: 'flexibleHours',
      label: `Giờ làm: ${filters.flexibleHours ? 'Linh hoạt' : 'Cố định'}`,
      value: 'flexibleHours'
    })
  }

  // Sort (only show if not default)
  if (filters.sort && filters.sort !== 'relevance') {
    activeFilters.push({
      key: 'sort',
      label: `Sắp xếp: ${SORT_LABELS[filters.sort] || filters.sort}`,
      value: 'sort'
    })
  }

  if (activeFilters.length === 0) {
    return null
  }

  const handleRemove = (filter) => {
    if (filter.value === 'skills') {
      // Remove specific skill from array
      const newSkills = filters.skills.filter(skill => skill !== filter.skillValue)
      onRemoveFilter('skills', newSkills)
    } else if (filter.value === 'jobCategories') {
      // Remove specific category from array
      const newCategories = filters.jobCategories.filter(cat => cat !== filter.categoryValue)
      onRemoveFilter('jobCategories', newCategories)
    } else if (filter.value === 'jobBenefits') {
      // Remove specific benefit from array
      const newBenefits = filters.jobBenefits.filter(benefit => benefit !== filter.benefitValue)
      onRemoveFilter('jobBenefits', newBenefits)
    } else if (filter.value === 'salary') {
      // Clear both salary min and max
      onRemoveFilter('salaryMin', null)
      onRemoveFilter('salaryMax', null)
    } else {
      // Clear single filter
      onRemoveFilter(filter.value, null)
    }
  }

  return (
    <div className={`active-filters ${className}`}>
      <div className="filters-header">
        <span className="filters-count">
          Bộ lọc đang áp dụng ({activeFilters.length})
        </span>
      </div>
      <div className="filters-chips">
        {activeFilters.map(filter => (
          <span key={filter.key} className="filter-chip">
            <span className="chip-text">{filter.label}</span>
            <button
              type="button"
              className="chip-remove"
              onClick={() => handleRemove(filter)}
              aria-label={`Xóa bộ lọc ${filter.label}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}
