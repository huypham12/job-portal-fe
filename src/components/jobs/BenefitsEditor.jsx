import React, { useState } from 'react'
import { Button } from '../shared'

const BENEFIT_TYPES = [
  { value: 'salary', label: 'Lương thưởng' },
  { value: 'insurance', label: 'Bảo hiểm' },
  { value: 'bonus', label: 'Thưởng' },
  { value: 'training', label: 'Đào tạo' },
  { value: 'vacation', label: 'Nghỉ phép' },
  { value: 'equipment', label: 'Trang thiết bị' },
  { value: 'other', label: 'Khác' }
]

const CURRENCY_OPTIONS = [
  { value: 'VND', label: 'VNĐ' },
  { value: 'USD', label: 'USD' },
]

export const BenefitsEditor = ({
  benefits = [],
  onChange,
  maxBenefits = 10,
  className = "",
  disabled = false
}) => {
  const [newBenefit, setNewBenefit] = useState({
    benefit_type: 'salary',
    title: '',
    description: '',
    value_amount: '',
    value_currency: 'VND'
  })

  const handleAddBenefit = () => {
    if (benefits.length >= maxBenefits) return

    if (!newBenefit.title.trim()) {
      alert('Vui lòng nhập tiêu đề phúc lợi')
      return
    }

    const benefitToAdd = {
      ...newBenefit,
      value_amount: newBenefit.value_amount ? parseFloat(newBenefit.value_amount) : undefined,
      description: newBenefit.description.trim() || undefined
    }

    onChange([...benefits, benefitToAdd])

    // Reset form
    setNewBenefit({
      benefit_type: 'salary',
      title: '',
      description: '',
      value_amount: '',
      value_currency: 'VND'
    })
  }

  const handleRemoveBenefit = (index) => {
    const newBenefits = benefits.filter((_, i) => i !== index)
    onChange(newBenefits)
  }

  const handleUpdateBenefit = (index, field, value) => {
    const newBenefits = [...benefits]
    if (field === 'value_amount' && value !== '') {
      newBenefits[index][field] = parseFloat(value)
    } else {
      newBenefits[index][field] = value
    }
    onChange(newBenefits)
  }

  const formatCurrency = (amount, currency) => {
    if (!amount) return ''
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency === 'VND' ? 'VND' : 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const canAddMore = benefits.length < maxBenefits && !disabled

  return (
    <div className={`benefits-editor ${className}`}>
      {/* Existing benefits */}
      {benefits.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Phúc lợi hiện tại</h4>
          <div className="space-y-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Loại phúc lợi
                      </label>
                      <select
                        value={benefit.benefit_type}
                        onChange={(e) => handleUpdateBenefit(index, 'benefit_type', e.target.value)}
                        disabled={disabled}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      >
                        {BENEFIT_TYPES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giá trị (tùy chọn)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={benefit.value_amount || ''}
                          onChange={(e) => handleUpdateBenefit(index, 'value_amount', e.target.value)}
                          disabled={disabled}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          placeholder="Ví dụ: 1000000"
                        />
                        <select
                          value={benefit.value_currency || 'VND'}
                          onChange={(e) => handleUpdateBenefit(index, 'value_currency', e.target.value)}
                          disabled={disabled}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        >
                          {CURRENCY_OPTIONS.map(curr => (
                            <option key={curr.value} value={curr.value}>
                              {curr.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {benefit.value_amount && (
                        <div className="text-xs text-gray-500 mt-1">
                          {formatCurrency(benefit.value_amount, benefit.value_currency || 'VND')}
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tiêu đề *
                      </label>
                      <input
                        type="text"
                        value={benefit.title}
                        onChange={(e) => handleUpdateBenefit(index, 'title', e.target.value)}
                        disabled={disabled}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        placeholder="Ví dụ: Bảo hiểm sức khỏe toàn diện"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mô tả chi tiết
                      </label>
                      <textarea
                        value={benefit.description || ''}
                        onChange={(e) => handleUpdateBenefit(index, 'description', e.target.value)}
                        disabled={disabled}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        placeholder="Mô tả chi tiết về phúc lợi này..."
                      />
                    </div>
                  </div>

                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBenefit(index)}
                      className="ml-3 text-red-500 hover:text-red-700 p-1"
                      aria-label="Remove benefit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add new benefit form */}
      {canAddMore && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 mb-3">Thêm phúc lợi mới</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại phúc lợi *
              </label>
              <select
                value={newBenefit.benefit_type}
                onChange={(e) => setNewBenefit(prev => ({ ...prev, benefit_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {BENEFIT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá trị (tùy chọn)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newBenefit.value_amount}
                  onChange={(e) => setNewBenefit(prev => ({ ...prev, value_amount: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ví dụ: 1000000"
                />
                <select
                  value={newBenefit.value_currency}
                  onChange={(e) => setNewBenefit(prev => ({ ...prev, value_currency: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CURRENCY_OPTIONS.map(curr => (
                    <option key={curr.value} value={curr.value}>
                      {curr.label}
                    </option>
                  ))}
                </select>
              </div>
              {newBenefit.value_amount && (
                <div className="text-xs text-gray-500 mt-1">
                  {formatCurrency(parseFloat(newBenefit.value_amount), newBenefit.value_currency)}
                </div>
              )}
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề *
            </label>
            <input
              type="text"
              value={newBenefit.title}
              onChange={(e) => setNewBenefit(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ví dụ: Bảo hiểm sức khỏe toàn diện"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả chi tiết
            </label>
            <textarea
              value={newBenefit.description}
              onChange={(e) => setNewBenefit(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Mô tả chi tiết về phúc lợi này..."
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleAddBenefit}
              variant="outline"
              size="small"
            >
              Thêm phúc lợi
            </Button>
          </div>
        </div>
      )}

      {!canAddMore && (
        <div className="text-sm text-gray-500 text-center py-4">
          Đã đạt giới hạn tối đa {maxBenefits} phúc lợi
        </div>
      )}
    </div>
  )
}

export default BenefitsEditor
