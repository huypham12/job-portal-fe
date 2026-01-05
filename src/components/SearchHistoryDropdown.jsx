import React from "react";
import { searchHistoryUtils } from "../utils/searchHistory.js";
import "./SearchHistoryDropdown.css";

export default function SearchHistoryDropdown({
  onSelect,
  onClose,
  query = "",
  // New props for backend integration
  backendHistory = null, // { history: [], pagination: {} }
  onRemoveHistoryEntry = null, // callback for removing backend history
  onClearAllHistory = null, // callback for clearing all backend history
  isLoading = false,
}) {
  // Use backend data if available, otherwise fallback to localStorage
  const history = backendHistory?.history || searchHistoryUtils.getHistory();
  const recentSearches =
    backendHistory?.history?.slice(0, 3) ||
    searchHistoryUtils.getRecentSearches();

  const handleSelect = (term) => {
    onSelect(term);
    searchHistoryUtils.addToHistory(term);
  };

  const handleRemove = (e, item) => {
    e.stopPropagation();

    if (backendHistory && onRemoveHistoryEntry) {
      // Handle backend history removal
      onRemoveHistoryEntry(item.id);
    } else {
      // Handle localStorage removal
      searchHistoryUtils.removeFromHistory(item.term || item.query);
      // Force re-render by triggering state update in parent
      window.dispatchEvent(new CustomEvent("search-history-changed"));
    }
  };

  const handleClearAll = () => {
    if (backendHistory && onClearAllHistory) {
      // Handle backend history clearing
      onClearAllHistory();
    } else {
      // Handle localStorage clearing
      searchHistoryUtils.clearHistory();
      window.dispatchEvent(new CustomEvent("search-history-changed"));
    }
  };

  // Normalize data structure for consistent handling
  const normalizeItem = (item) => {
    if (backendHistory) {
      // Backend data structure
      return {
        id: item.id,
        term: item.query,
        timestamp: new Date(item.searched_at),
        isRecent: false,
        resultCount: item.result_count,
        filters: item.filters,
      };
    } else {
      // localStorage data structure
      return {
        id: item.term,
        term: item.term,
        timestamp: item.timestamp,
        isRecent: false,
        count: item.count,
      };
    }
  };

  // Filter history based on current query
  const filteredHistory = history
    .map(normalizeItem)
    .filter(
      (item) => !query || item.term.toLowerCase().includes(query.toLowerCase())
    );

  // Separate recent searches (last 24 hours)
  const recentSearchesNormalized = backendHistory
    ? history
        .slice(0, 3)
        .map(normalizeItem)
        .map((item) => ({ ...item, isRecent: true }))
    : searchHistoryUtils
        .getRecentSearches()
        .map(normalizeItem)
        .map((item) => ({ ...item, isRecent: true }));

  if (isLoading) {
    return (
      <div className="search-history-dropdown">
        <div className="search-history-section">
          <div className="search-history-loading">Đang tải...</div>
        </div>
      </div>
    );
  }

  if (filteredHistory.length === 0 && recentSearchesNormalized.length === 0) {
    return null;
  }

  return (
    <div className="search-history-dropdown">
      {recentSearchesNormalized.length > 0 && (
        <div className="search-history-section">
          <div className="search-history-header">
            <h4>Tìm kiếm gần đây</h4>
          </div>
          <div className="search-history-list">
            {recentSearchesNormalized.map((item, index) => (
              <div
                key={`recent-${backendHistory ? item.id : index}`}
                className="search-history-item"
                onClick={() => handleSelect(item.term)}
              >
                <div className="search-history-content">
                  <span className="search-history-term">{item.term}</span>
                  <span className="search-history-time">
                    {backendHistory
                      ? item.timestamp.toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : new Date(item.timestamp).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                  </span>
                  {backendHistory && item.resultCount && (
                    <span className="search-history-results">
                      {item.resultCount} kết quả
                    </span>
                  )}
                </div>
                <button
                  className="search-history-remove"
                  onClick={(e) => handleRemove(e, item)}
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
                Xóa lịch sử
              </button>
            )}
          </div>
          <div className="search-history-list">
            {filteredHistory.slice(0, 5).map((item, index) => (
              <div
                key={`history-${backendHistory ? item.id : index}`}
                className="search-history-item"
                onClick={() => handleSelect(item.term)}
              >
                <div className="search-history-content">
                  <span className="search-history-term">{item.term}</span>
                  <span className="search-history-date">
                    {backendHistory
                      ? item.timestamp.toLocaleDateString("vi-VN")
                      : new Date(item.timestamp).toLocaleDateString("vi-VN")}
                  </span>
                  {backendHistory && item.resultCount && (
                    <span className="search-history-results">
                      {item.resultCount} kết quả
                    </span>
                  )}
                </div>
                <button
                  className="search-history-remove"
                  onClick={(e) => handleRemove(e, item)}
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
  );
}
