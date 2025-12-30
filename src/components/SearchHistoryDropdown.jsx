import React from 'react'
import { searchHistoryUtils } from '../utils/searchHistory.js'
import './SearchHistoryDropdown.css'

export default function SearchHistoryDropdown({
  onSelect,
  onClose,
  query = ''
}) {
  const history = searchHistoryUtils.getHistory()
  const recentSearches = searchHistoryUtils.getRecentSearches()

  const handleSelect = (term) => {
    onSelect(term)
    searchHistoryUtils.addToHistory(term)
  }

  const handleRemove = (e, term) => {
    e.stopPropagation()
    searchHistoryUtils.removeFromHistory(term)
    // Force re-render by triggering state update in parent
    window.dispatchEvent(new CustomEvent('search-history-changed'))
  }

  const handleClearAll = () => {
    searchHistoryUtils.clearHistory()
    window.dispatchEvent(new CustomEvent('search-history-changed'))
  }

  // Filter history based on current query
  const filteredHistory = history.filter(item =>
    !query || item.term.toLowerCase().includes(query.toLowerCase())
  )

  if (filteredHistory.length === 0 && recentSearches.length === 0) {
    return null
  }

  return (
    <div className="search-history-dropdown">
      {recentSearches.length > 0 && (
        <div className="search-history-section">
          <div className="search-history-header">
            <h4>Tìm kiếm gần đây</h4>
          </div>
          <div className="search-history-list">
            {recentSearches.slice(0, 3).map((item, index) => (
              <div
                key={`recent-${index}`}
                className="search-history-item"
                onClick={() => handleSelect(item.term)}
              >
                <div className="search-history-content">
                  <span className="search-history-term">{item.term}</span>
                  <span className="search-history-time">
                    {new Date(item.timestamp).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <button
                  className="search-history-remove"
                  onClick={(e) => handleRemove(e, item.term)}
                  aria-label={`Xóa "${item.term}" khỏi lịch sử`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredHistory.length > 0 && (
        <div className="search-history-section">
          <div className="search-history-header">
            <h4>Lịch sử tìm kiếm</h4>
            {history.length > 0 && (
              <button
                className="search-history-clear-all"
                onClick={handleClearAll}
              >
                Xóa tất cả
              </button>
            )}
          </div>
          <div className="search-history-list">
            {filteredHistory.slice(0, 5).map((item, index) => (
              <div
                key={`history-${index}`}
                className="search-history-item"
                onClick={() => handleSelect(item.term)}
              >
                <div className="search-history-content">
                  <span className="search-history-term">{item.term}</span>
                  <span className="search-history-date">
                    {new Date(item.timestamp).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <button
                  className="search-history-remove"
                  onClick={(e) => handleRemove(e, item.term)}
                  aria-label={`Xóa "${item.term}" khỏi lịch sử`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
