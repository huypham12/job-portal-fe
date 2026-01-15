import React, { forwardRef, useEffect, useRef } from "react";
import "./SuggestionDropdown.css";

const SuggestionDropdown = forwardRef(function SuggestionDropdown(
  {
    suggestions = [],
    loading = false,
    selectedIndex = -1,
    onSelect,
    query = "",
    className = "",
  },
  ref
) {
  const listRef = useRef(null);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [selectedIndex]);

  // Highlight matching text in suggestions
  const highlightMatch = (text, query) => {
    if (!query || !text) return text;

    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <mark key={index} className="highlight">
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  if (!loading && suggestions.length === 0) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={`suggestion-dropdown ${className}`}
      role="listbox"
      aria-label="Tìm kiếm gợi ý"
    >
      {loading ? (
        <div className="suggestion-loading">
          <div className="spinner" aria-hidden="true"></div>
          <span>Đang tìm kiếm...</span>
        </div>
      ) : (
        <ul ref={listRef} className="suggestion-list">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              className={`suggestion-item ${
                index === selectedIndex ? "selected" : ""
              }`}
              onClick={() => onSelect(suggestion)}
              role="option"
              aria-selected={index === selectedIndex}
              tabIndex={-1}
            >
              <div className="suggestion-content">
                <svg
                  className="suggestion-icon"
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
                <span className="suggestion-text">
                  {highlightMatch(suggestion.text, query)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {suggestions.length > 0 && (
        <div className="suggestion-footer">
          <span className="suggestion-hint">
            Nhấn <kbd>↑</kbd>
            <kbd>↓</kbd> để điều hướng, <kbd>Enter</kbd> để chọn
          </span>
        </div>
      )}
    </div>
  );
});

SuggestionDropdown.displayName = "SuggestionDropdown";

export default SuggestionDropdown;
