import React from 'react'
import './NoResults.css'

export default function NoResults({
  message = 'Không tìm thấy kết quả nào.',
  suggestion = 'Hãy thử điều chỉnh tiêu chí tìm kiếm hoặc từ khóa.',
  showSuggestions = true,
  className = ''
}) {
  const suggestions = [
    'Kiểm tra chính tả từ khóa',
    'Sử dụng từ khóa chung hơn',
    'Bỏ một số bộ lọc để mở rộng kết quả',
    'Thử tìm kiếm bằng tiếng Anh'
  ]

  return (
    <div className={`no-results ${className}`}>
      <div className="no-results-content">
        <div className="no-results-icon" aria-hidden="true">
          🔍
        </div>

        <h3 className="no-results-title">Không tìm thấy kết quả</h3>

        <p className="no-results-message">{message}</p>

        {showSuggestions && (
          <div className="no-results-suggestions">
            <h4>Gợi ý để tìm kiếm tốt hơn:</h4>
            <ul>
              {suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="no-results-actions">
          <button
            onClick={() => window.location.reload()}
            className="refresh-button"
          >
            Làm mới trang
          </button>
        </div>
      </div>
    </div>
  )
}
