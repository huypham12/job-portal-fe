import React, { useState, useEffect, useRef, useCallback } from 'react'
import { searchService } from '../services/searchService.js'
import { debounce } from '../services/apiClient.js'
import SuggestionDropdown from './SuggestionDropdown.jsx'
import SearchHistoryDropdown from './SearchHistoryDropdown.jsx'
import { searchHistoryUtils } from '../utils/searchHistory.js'
import './SearchBar.css'

export default function SearchBar({
  value = '',
  onChange,
  placeholder = 'Tìm kiếm...',
  loading = false,
  showSuggestions = true,
  className = ''
}) {
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [rateLimited, setRateLimited] = useState(false)
  const [rateLimitMessage, setRateLimitMessage] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [historyChanged, setHistoryChanged] = useState(0)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)
  const historyRef = useRef(null)

  // Sync internal state with external value
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Debounced suggestion fetcher
  const fetchSuggestions = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 2) {
        setSuggestions([])
        setSuggestionLoading(false)
        return
      }

      // Don't fetch if rate limited
      if (rateLimited) {
        setSuggestionLoading(false)
        return
      }

      setSuggestionLoading(true)
      try {
        const response = await searchService.getSuggestions({
          q: query,
          size: 8
        })
        setSuggestions(response.suggestions || [])
        setRateLimited(false) // Clear rate limit on successful request
        setRateLimitMessage('')
      } catch (error) {
        console.warn('Failed to fetch suggestions:', error)
        setSuggestions([])

        // Handle rate limiting
        if (error.status === 429) {
          setRateLimited(true)
          const retryAfter = error.retryAfter || 60
          setRateLimitMessage(`Bạn đang tìm kiếm quá nhanh. Vui lòng chờ ${retryAfter} giây.`)

          // Auto-clear rate limit after the specified time
          setTimeout(() => {
            setRateLimited(false)
            setRateLimitMessage('')
          }, retryAfter * 1000)
        }
      } finally {
        setSuggestionLoading(false)
      }
    }, 200),
    [rateLimited]
  )

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setSelectedIndex(-1)

    if (newValue.trim()) {
      setShowDropdown(true)
      setShowHistory(false)
      fetchSuggestions(newValue.trim())
    } else {
      setShowDropdown(false)
      setShowHistory(true)
      setSuggestions([])
    }
  }, [fetchSuggestions])

  // Handle form submission
  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    const finalValue = inputValue.trim()

    if (finalValue && !rateLimited) {
      searchHistoryUtils.addToHistory(finalValue)
      onChange(finalValue)
      setShowDropdown(false)
      setShowHistory(false)
      inputRef.current?.blur()
    }
  }, [inputValue, onChange, rateLimited])

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion) => {
    const selectedText = suggestion.text || suggestion
    setInputValue(selectedText)
    searchHistoryUtils.addToHistory(selectedText)
    onChange(selectedText)
    setShowDropdown(false)
    setShowHistory(false)
    setSelectedIndex(-1)
    inputRef.current?.blur()
  }, [onChange])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!showDropdown || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionSelect(suggestions[selectedIndex])
        } else {
          handleSubmit(e)
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }, [showDropdown, suggestions, selectedIndex, handleSuggestionSelect, handleSubmit])

  // Handle input focus
  const handleFocus = useCallback(() => {
    if (inputValue.trim() && suggestions.length > 0) {
      setShowDropdown(true)
      setShowHistory(false)
    } else if (!inputValue.trim()) {
      setShowDropdown(false)
      setShowHistory(true)
    }
  }, [inputValue, suggestions.length])

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        historyRef.current &&
        !historyRef.current.contains(event.target)
      ) {
        setShowDropdown(false)
        setShowHistory(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Listen for history changes
  useEffect(() => {
    const handleHistoryChange = () => {
      setHistoryChanged(prev => prev + 1)
    }

    window.addEventListener('search-history-changed', handleHistoryChange)
    return () => window.removeEventListener('search-history-changed', handleHistoryChange)
  }, [])

  return (
    <div className={`search-bar ${className}`}>
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-container">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder={rateLimited ? rateLimitMessage : placeholder}
            className={`search-input ${rateLimited ? 'rate-limited' : ''}`}
            autoComplete="off"
            role="combobox"
            aria-expanded={showDropdown}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            disabled={rateLimited}
          />

          <button
            type="submit"
            className="search-button"
            disabled={loading || !inputValue.trim()}
            aria-label="Tìm kiếm"
          >
            {loading ? (
              <span className="spinner" aria-hidden="true"></span>
            ) : (
              <svg
                className="search-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            )}
          </button>
        </div>
      </form>

      {showSuggestions && showDropdown && (
        <SuggestionDropdown
          ref={dropdownRef}
          suggestions={suggestions}
          loading={suggestionLoading}
          selectedIndex={selectedIndex}
          onSelect={handleSuggestionSelect}
          query={inputValue}
        />
      )}
    </div>
  )
}
