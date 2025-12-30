import React, { useState, useEffect } from 'react'

const CURRENCY_OPTIONS = [
  { value: 'VND', label: 'VNĐ' },
  { value: 'USD', label: 'USD' },
]

const SALARY_PRESETS = {
  VND: [
    { label: '5-10 triệu', min: 5000000, max: 10000000 },
    { label: '10-20 triệu', min: 10000000, max: 20000000 },
    { label: '20-30 triệu', min: 20000000, max: 30000000 },
    { label: '30-50 triệu', min: 30000000, max: 50000000 },
    { label: '50-100 triệu', min: 50000000, max: 100000000 },
    { label: '100 triệu+', min: 100000000, max: null },
  ],
  USD: [
    { label: '$500-1000', min: 500, max: 1000 },
    { label: '$1000-2000', min: 1000, max: 2000 },
    { label: '$2000-3000', min: 2000, max: 3000 },
    { label: '$3000-5000', min: 3000, max: 5000 },
    { label: '$5000-10000', min: 5000, max: 10000 },
    { label: '$10000+', min: 10000, max: null },
  ]
}

export const SalaryRangeInput = ({
  value = { min: '', max: '', currency: 'VND' },
  onChange,
  className = "",
  disabled = false,
  showPresets = true
}) => {
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleInputChange = (field, inputValue) => {
    const numValue = inputValue === '' ? '' : parseInt(inputValue.replace(/[^\d]/g, ''), 10)

    const newValue = {
      ...localValue,
      [field]: numValue
    }

    // Validate min <= max
    if (field === 'min' && newValue.max !== '' && numValue > newValue.max) {
      newValue.max = numValue
    } else if (field === 'max' && newValue.min !== '' && numValue < newValue.min) {
      newValue.min = numValue
    }

    setLocalValue(newValue)
    onChange(newValue)
  }

  const handleCurrencyChange = (currency) => {
    const newValue = { ...localValue, currency }
    setLocalValue(newValue)
    onChange(newValue)
  }

  const handlePresetSelect = (preset) => {
    const newValue = {
      ...localValue,
      min: preset.min,
      max: preset.max
    }
    setLocalValue(newValue)
    onChange(newValue)
  }

  const formatNumber = (num) => {
    if (num === '' || num === null || num === undefined) return ''
    return new Intl.NumberFormat('vi-VN').format(num)
  }

  const parseFormattedNumber = (str) => {
    return str.replace(/[^\d]/g, '')
  }

  const presets = SALARY_PRESETS[localValue.currency] || SALARY_PRESETS.VND

  return (
    <div className={`salary-range-input ${className}`}>
      {/* Currency selector */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Đơn vị tiền tệ
        </label>
        <select
          value={localValue.currency}
          onChange={(e) => handleCurrencyChange(e.target.value)}
          disabled={disabled}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        >
          {CURRENCY_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Salary range inputs */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mức lương tối thiểu
          </label>
          <input
            type="text"
            value={formatNumber(localValue.min)}
            onChange={(e) => handleInputChange('min', parseFormattedNumber(e.target.value))}
            placeholder={`VD: ${localValue.currency === 'VND' ? '10,000,000' : '1000'}`}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mức lương tối đa
          </label>
          <input
            type="text"
            value={formatNumber(localValue.max)}
            onChange={(e) => handleInputChange('max', parseFormattedNumber(e.target.value))}
            placeholder={`VD: ${localValue.currency === 'VND' ? '20,000,000' : '2000'}`}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>
      </div>

      {/* Quick presets */}
      {showPresets && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chọn nhanh
          </label>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                disabled={disabled}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-full border border-gray-300 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Display formatted range */}
      {(localValue.min || localValue.max) && (
        <div className="mt-3 p-3 bg-gray-50 rounded-md">
          <div className="text-sm text-gray-600">
            <strong>Khoảng lương:</strong>{' '}
            {localValue.min && localValue.max
              ? `${formatNumber(localValue.min)} - ${formatNumber(localValue.max)} ${localValue.currency}`
              : localValue.min
              ? `Từ ${formatNumber(localValue.min)} ${localValue.currency}`
              : `Đến ${formatNumber(localValue.max)} ${localValue.currency}`
            }
          </div>
        </div>
      )}
    </div>
  )
}

export default SalaryRangeInput
