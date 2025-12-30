import React from 'react'
import './SortSelect.css'

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Liên quan nhất' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'salary_high', label: 'Lương cao nhất' },
  { value: 'salary_low', label: 'Lương thấp nhất' },
  { value: 'experience_high', label: 'Kinh nghiệm nhiều nhất' },
  { value: 'experience_low', label: 'Kinh nghiệm ít nhất' }
]

export default function SortSelect({ value = 'relevance', onChange, className = '', disabled = false }) {
  const handleChange = (e) => {
    onChange(e.target.value)
  }

  return (
    <div className={`sort-select ${className}`}>
      <label htmlFor="sort-select" className="sort-label">
        Sắp xếp theo:
      </label>
      <select
        id="sort-select"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="sort-dropdown"
        aria-label="Chọn cách sắp xếp kết quả"
      >
        {SORT_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
