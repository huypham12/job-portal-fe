import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { recommendationsService } from '../services/recommendationsService.js'
import { searchService } from '../services/searchService.js'
import JobCard from './JobCard.jsx'
import LoadingSkeleton from './LoadingSkeleton.jsx'
import './RecommendationsPanel.css'

export default function RecommendationsPanel({
  title = 'Đề xuất cho bạn',
  limit = 6,
  showFeedback = true,
  className = '',
  onJobClick
}) {
  const navigate = useNavigate()
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load recommendations on mount
  useEffect(() => {
    loadRecommendations()
  }, [])

  const loadRecommendations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await recommendationsService.getCandidateRecommendations({
        limit
      })

      setRecommendations(response || [])
    } catch (err) {
      console.error('Failed to load recommendations:', err)
      setError(err.message || 'Không thể tải đề xuất')
    } finally {
      setLoading(false)
    }
  }, [limit])

  const handleJobClick = useCallback(async (job) => {
    try {
      // Log impression event
      await searchService.logEvent({
        event_type: 'impression',
        job_id: job.id,
        query: 'panel_recommendations',
        position: recommendations.findIndex(j => j.id === job.id) + 1,
        filters: { source: 'panel' },
        result_count: recommendations.length,
        timestamp_ms: Date.now()
      })
    } catch (err) {
      console.warn('Failed to log impression:', err)
    }

    // Call custom onClick handler or default navigation
    if (onJobClick) {
      onJobClick(job)
    } else {
      navigate(`/jobs/${job.id}`)
    }
  }, [recommendations, navigate, onJobClick])

  const handleFeedback = useCallback(async (jobId, feedback) => {
    try {
      // Log feedback event
      await searchService.logEvent({
        event_type: feedback === 'positive' ? 'click' : 'dismiss',
        job_id: jobId,
        query: 'panel_recommendations',
        filters: { source: 'panel', feedback },
        result_count: recommendations.length,
        timestamp_ms: Date.now()
      })

      // Remove from recommendations if negative feedback
      if (feedback === 'negative') {
        setRecommendations(prev => prev.filter(job => job.id !== jobId))
      }
    } catch (err) {
      console.warn('Failed to log feedback:', err)
    }
  }, [recommendations.length])

  if (error) {
    return (
      <div className={`recommendations-panel error ${className}`}>
        <div className="panel-header">
          <h3>{title}</h3>
        </div>
        <div className="panel-error">
          <p>{error}</p>
          <button onClick={loadRecommendations}>Thử lại</button>
        </div>
      </div>
    )
  }

  return (
    <div className={`recommendations-panel ${className}`}>
      <div className="panel-header">
        <h3>{title}</h3>
        {recommendations.length > 0 && (
          <span className="panel-count">
            {recommendations.length} công việc
          </span>
        )}
      </div>

      <div className="panel-content">
        {loading ? (
          <div className="recommendations-grid">
            {Array.from({ length: Math.min(limit, 3) }, (_, index) => (
              <LoadingSkeleton key={index} type="job-card" />
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <div className="recommendations-grid">
            {recommendations.slice(0, limit).map((job, index) => (
              <div key={job.id || `job-${index}`} className="recommendation-item">
                <JobCard
                  job={job._source || job}
                  onClick={() => handleJobClick(job)}
                  compact={true}
                />

                {showFeedback && (
                  <div className="recommendation-actions">
                    <span className="match-score">
                      {Math.round((job.score_percent || job.score || 0) * 100)}% phù hợp
                    </span>

                    <div className="feedback-buttons">
                      <button
                        onClick={() => handleFeedback(job.id, 'positive')}
                        className="feedback-btn positive"
                        aria-label="Thích"
                        title="Thích đề xuất này"
                      >
                        👍
                      </button>
                      <button
                        onClick={() => handleFeedback(job.id, 'negative')}
                        className="feedback-btn negative"
                        aria-label="Không thích"
                        title="Không thích đề xuất này"
                      >
                        👎
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="panel-empty">
            <p>Chưa có đề xuất nào. Hãy cập nhật hồ sơ để nhận đề xuất tốt hơn!</p>
          </div>
        )}
      </div>

      {recommendations.length > limit && (
        <div className="panel-footer">
          <button
            onClick={() => navigate('/recommendations/for-you')}
            className="view-all-btn"
          >
            Xem tất cả đề xuất →
          </button>
        </div>
      )}
    </div>
  )
}
