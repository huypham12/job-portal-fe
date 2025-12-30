import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSkills } from '../../hooks/useJobs'

export const SkillAutocomplete = ({
  selectedSkills = [],
  onChange,
  placeholder = "Tìm kiếm kỹ năng...",
  maxSelections = 10,
  className = "",
  disabled = false,
  categoryId = null
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  // If caller provided a categoryId prop, use it; otherwise fetch without category filter.
  const { skills: availableSkills, loading } = useSkills(searchTerm, categoryId || '', 50)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // Filter out already selected skills
  const filteredSkills = availableSkills.filter(
    skill => !selectedSkills.some(selected => selected.id === skill.id)
  )

  const handleInputChange = useCallback((e) => {
    const value = e.target.value
    setSearchTerm(value)
    setIsOpen(true)
    setHighlightedIndex(-1)
  }, [])

  const handleSelectSkill = useCallback((skill) => {
    if (selectedSkills.length >= maxSelections) {
      return // Don't allow more selections
    }

    const newSelected = [...selectedSkills, skill]
    onChange(newSelected)
    setSearchTerm('')
    setIsOpen(false)
    setHighlightedIndex(-1)
  }, [selectedSkills, maxSelections, onChange])

  const handleRemoveSkill = useCallback((skillId) => {
    const newSelected = selectedSkills.filter(skill => skill.id !== skillId)
    onChange(newSelected)
  }, [selectedSkills, onChange])

  const handleKeyDown = useCallback((e) => {
    if (!isOpen || filteredSkills.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < filteredSkills.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : filteredSkills.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filteredSkills.length) {
          handleSelectSkill(filteredSkills[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
    }
  }, [isOpen, filteredSkills, highlightedIndex, handleSelectSkill])

  const handleFocus = useCallback(() => {
    setIsOpen(true)
  }, [])

  const handleBlur = useCallback((e) => {
    // Delay closing to allow for clicks on options
    setTimeout(() => {
      if (!listRef.current?.contains(document.activeElement)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }, 150)
  }, [])

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex]
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        })
      }
    }
  }, [highlightedIndex])

  return (
    <div className={`skill-autocomplete ${className}`}>
      {/* Selected skills display */}
      {selectedSkills.length > 0 && (
        <div className="selected-skills mb-2">
          {selectedSkills.map(skill => (
            <span
              key={skill.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full mr-1 mb-1"
            >
              {skill.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill.id)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                  aria-label={`Remove ${skill.name}`}
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Input field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={
            selectedSkills.length >= maxSelections
              ? `Đã chọn tối đa ${maxSelections} kỹ năng`
              : placeholder
          }
          disabled={disabled || selectedSkills.length >= maxSelections || (categoryId === null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          aria-label="Search and select skills"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        />

        {/* Dropdown */}
        {isOpen && (
          <div
            ref={listRef}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
            role="listbox"
          >
            {loading ? (
              <div className="px-3 py-2 text-gray-500 text-sm">
                Đang tìm kiếm...
              </div>
            ) : filteredSkills.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 text-sm">
                {searchTerm.trim() ? 'Không tìm thấy kỹ năng' : 'Nhập để tìm kiếm kỹ năng'}
              </div>
            ) : (
              filteredSkills.map((skill, index) => (
                <div
                  key={skill.id}
                  onClick={() => handleSelectSkill(skill)}
                  className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                    index === highlightedIndex ? 'bg-blue-100' : ''
                  }`}
                  role="option"
                  aria-selected={index === highlightedIndex}
                >
                  <div className="font-medium">{skill.name}</div>
                  {skill.category && (
                    <div className="text-xs text-gray-500 capitalize">
                      {typeof skill.category === 'string'
                        ? skill.category.replace('_', ' ')
                        : (skill.category?.name || '')}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Helper text */}
      <div className="text-xs text-gray-500 mt-1">
        Đã chọn {selectedSkills.length}/{maxSelections} kỹ năng
      </div>
    </div>
  )
}

export default SkillAutocomplete
