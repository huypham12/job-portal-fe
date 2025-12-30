import React, { useState } from 'react'
import { Button } from '../shared'

const REQUIREMENT_TYPES = [
  { value: 'education', label: 'Học vấn' },
  { value: 'experience', label: 'Kinh nghiệm' },
  { value: 'skill', label: 'Kỹ năng' },
  { value: 'certification', label: 'Chứng chỉ' },
  { value: 'language', label: 'Ngoại ngữ' },
  { value: 'other', label: 'Khác' }
]

const LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Sơ cấp' },
  { value: 'intermediate', label: 'Trung cấp' },
  { value: 'advanced', label: 'Cao cấp' },
  { value: 'expert', label: 'Chuyên gia' }
]

export const RequirementsEditor = ({
  requirements = [],
  onChange,
  maxRequirements = 10,
  className = "",
  disabled = false
}) => {
  const [newRequirement, setNewRequirement] = useState({
    requirement_type: 'experience',
    title: '',
    description: '',
    is_required: true,
    level: '',
    years_experience: ''
  })

  const handleAddRequirement = () => {
    if (requirements.length >= maxRequirements) return

    if (!newRequirement.title.trim()) {
      alert('Vui lòng nhập tiêu đề yêu cầu')
      return
    }

    const requirementToAdd = {
      ...newRequirement,
      years_experience: newRequirement.years_experience ? parseInt(newRequirement.years_experience, 10) : undefined,
      level: newRequirement.level || undefined,
      description: newRequirement.description.trim() || undefined
    }

    onChange([...requirements, requirementToAdd])

    // Reset form
    setNewRequirement({
      requirement_type: 'experience',
      title: '',
      description: '',
      is_required: true,
      level: '',
      years_experience: ''
    })
  }

  const handleRemoveRequirement = (index) => {
    const newRequirements = requirements.filter((_, i) => i !== index)
    onChange(newRequirements)
  }

  const handleUpdateRequirement = (index, field, value) => {
    const newRequirements = [...requirements]
    if (field === 'years_experience' && value !== '') {
      newRequirements[index][field] = parseInt(value, 10)
    } else if (field === 'is_required') {
      newRequirements[index][field] = value
    } else {
      newRequirements[index][field] = value
    }
    onChange(newRequirements)
  }

  const canAddMore = requirements.length < maxRequirements && !disabled

  return (
    <div className={`requirements-editor ${className}`}>
      {/* Existing requirements */}
      {requirements.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Yêu cầu hiện tại</h4>
          <div className="space-y-3">
            {requirements.map((req, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Loại yêu cầu
                      </label>
                      <select
                        value={req.requirement_type}
                        onChange={(e) => handleUpdateRequirement(index, 'requirement_type', e.target.value)}
                        disabled={disabled}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      >
                        {REQUIREMENT_TYPES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Trình độ
                      </label>
                      <select
                        value={req.level || ''}
                        onChange={(e) => handleUpdateRequirement(index, 'level', e.target.value)}
                        disabled={disabled}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      >
                        <option value="">Không chỉ định</option>
                        {LEVEL_OPTIONS.map(level => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tiêu đề *
                      </label>
                      <input
                        type="text"
                        value={req.title}
                        onChange={(e) => handleUpdateRequirement(index, 'title', e.target.value)}
                        disabled={disabled}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        placeholder="Ví dụ: Tốt nghiệp Đại học ngành Công nghệ thông tin"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mô tả chi tiết
                      </label>
                      <textarea
                        value={req.description || ''}
                        onChange={(e) => handleUpdateRequirement(index, 'description', e.target.value)}
                        disabled={disabled}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        placeholder="Mô tả chi tiết về yêu cầu này..."
                      />
                    </div>

                    {req.requirement_type === 'experience' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Số năm kinh nghiệm
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={req.years_experience || ''}
                          onChange={(e) => handleUpdateRequirement(index, 'years_experience', e.target.value)}
                          disabled={disabled}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          placeholder="Ví dụ: 2"
                        />
                      </div>
                    )}

                    <div className="flex items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={req.is_required}
                          onChange={(e) => handleUpdateRequirement(index, 'is_required', e.target.checked)}
                          disabled={disabled}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Bắt buộc</span>
                      </label>
                    </div>
                  </div>

                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRequirement(index)}
                      className="ml-3 text-red-500 hover:text-red-700 p-1"
                      aria-label="Remove requirement"
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

      {/* Add new requirement form */}
      {canAddMore && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 mb-3">Thêm yêu cầu mới</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại yêu cầu *
              </label>
              <select
                value={newRequirement.requirement_type}
                onChange={(e) => setNewRequirement(prev => ({ ...prev, requirement_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {REQUIREMENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trình độ
              </label>
              <select
                value={newRequirement.level}
                onChange={(e) => setNewRequirement(prev => ({ ...prev, level: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Không chỉ định</option>
                {LEVEL_OPTIONS.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề *
            </label>
            <input
              type="text"
              value={newRequirement.title}
              onChange={(e) => setNewRequirement(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ví dụ: Tốt nghiệp Đại học ngành Công nghệ thông tin"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả chi tiết
            </label>
            <textarea
              value={newRequirement.description}
              onChange={(e) => setNewRequirement(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Mô tả chi tiết về yêu cầu này..."
            />
          </div>

          {newRequirement.requirement_type === 'experience' && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số năm kinh nghiệm
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={newRequirement.years_experience}
                onChange={(e) => setNewRequirement(prev => ({ ...prev, years_experience: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ví dụ: 2"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newRequirement.is_required}
                onChange={(e) => setNewRequirement(prev => ({ ...prev, is_required: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Bắt buộc</span>
            </label>

            <Button
              type="button"
              onClick={handleAddRequirement}
              variant="outline"
              size="small"
            >
              Thêm yêu cầu
            </Button>
          </div>
        </div>
      )}

      {!canAddMore && (
        <div className="text-sm text-gray-500 text-center py-4">
          Đã đạt giới hạn tối đa {maxRequirements} yêu cầu
        </div>
      )}
    </div>
  )
}

export default RequirementsEditor
