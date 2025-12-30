import React, { useState, useRef, useCallback } from 'react'
import { useCategories } from '../../hooks/useJobs'

export const CategoryMultiSelect = ({
  selectedCategories = [],
  onChange,
  type = null, // 'industry', 'technical', 'work_type', or null for all
  placeholder = "Chọn danh mục...",
  maxSelections = 5,
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const { categories: availableCategories, loading } = useCategories(type)
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  // Filter categories based on search and selection status
  const filteredCategories = availableCategories.filter(category => {
    const matchesSearch = !searchTerm.trim() ||
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    const notSelected = !selectedCategories.some(selected => selected.id === category.id)
    return matchesSearch && notSelected
  })

  const handleToggleDropdown = useCallback(() => {
    if (!disabled) {
      setIsOpen(prev => !prev)
      setHighlightedIndex(-1)
      if (!isOpen) {
        setTimeout(() => inputRef.current?.focus(), 0)
      }
    }
  }, [disabled, isOpen])

  const handleSelectCategory = useCallback((category) => {
    if (selectedCategories.length >= maxSelections) {
      return // Don't allow more selections
    }

    const newSelected = [...selectedCategories, category]
    onChange(newSelected)
    setSearchTerm('')
    setHighlightedIndex(-1)
  }, [selectedCategories, maxSelections, onChange])

  const handleRemoveCategory = useCallback((categoryId) => {
    const newSelected = selectedCategories.filter(cat => cat.id !== categoryId)
    onChange(newSelected)
  }, [selectedCategories, onChange])

  const handleKeyDown = useCallback((e) => {
    if (!isOpen || filteredCategories.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < filteredCategories.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : filteredCategories.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filteredCategories.length) {
          handleSelectCategory(filteredCategories[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }, [isOpen, filteredCategories, highlightedIndex, handleSelectCategory])

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value)
    setHighlightedIndex(-1)
    setIsOpen(true)
  }, [])

  const handleBlur = useCallback((e) => {
    // Delay closing to allow for clicks on options
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }, 150)
  }, [])

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`category-multiselect ${className}`} ref={dropdownRef}>
      {/* Selected categories display */}
      {selectedCategories.length > 0 && (
        <div className="selected-categories mb-2">
          {selectedCategories.map(category => (
            <span
              key={category.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full mr-1 mb-1"
            >
              {category.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(category.id)}
                  className="ml-1 text-green-600 hover:text-green-800"
                  aria-label={`Remove ${category.name}`}
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Dropdown trigger */}
      <div className="relative">
        <div
          onClick={handleToggleDropdown}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md bg-white cursor-pointer flex items-center justify-between ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'
          } ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
        >
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={
              selectedCategories.length >= maxSelections
                ? `Đã chọn tối đa ${maxSelections} danh mục`
                : placeholder
            }
            disabled={disabled || selectedCategories.length >= maxSelections}
            className="flex-1 outline-none bg-transparent"
            aria-label="Search and select categories"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          />
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {loading ? (
              <div className="px-3 py-2 text-gray-500 text-sm">
                Đang tải danh mục...
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 text-sm">
                {searchTerm.trim() ? 'Không tìm thấy danh mục' : 'Không có danh mục nào'}
              </div>
            ) : (
              filteredCategories.map((category, index) => (
                <div
                  key={category.id}
                  onClick={() => handleSelectCategory(category)}
                  className={`px-3 py-2 cursor-pointer hover:bg-green-50 ${
                    index === highlightedIndex ? 'bg-green-100' : ''
                  }`}
                  role="option"
                  aria-selected={index === highlightedIndex}
                >
                  <div className="font-medium">{category.name}</div>
                  <div className="text-xs text-gray-500 capitalize">
                    {category.type.replace('_', ' ')}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Helper text */}
      <div className="text-xs text-gray-500 mt-1">
        Đã chọn {selectedCategories.length}/{maxSelections} danh mục
      </div>
    </div>
  )
}

export default CategoryMultiSelect
