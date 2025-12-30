import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { recommendationsService } from '../../services/recommendationsService.js'
import { searchService } from '../../services/searchService.js'
import JobCard from '../../components/JobCard.jsx'
import LoadingSkeleton from '../../components/LoadingSkeleton.jsx'
import NoResults from '../../components/NoResults.jsx'
import './ForYou.css'

export default function ForYou() {
  const navigate = useNavigate()
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // Load recommendations on mount
  useEffect(() => {
    loadRecommendations()
  }, [])

  const loadRecommendations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await recommendationsService.getCandidateRecommendations({
        limit: 20
      })

      setRecommendations(response || [])
    } catch (err) {
      console.error('Failed to load recommendations:', err)
      setError(err.message || 'Không thể tải đề xuất công việc')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true)
      await loadRecommendations()
    } finally {
      setRefreshing(false)
    }
  }, [loadRecommendations])

  const handleJobClick = useCallback(async (job) => {
    try {
      // Log impression event
      await searchService.logEvent({
        event_type: 'impression',
        job_id: job.id,
        query: 'recommendations',
        position: recommendations.findIndex(j => j.id === job.id) + 1,
        filters: { source: 'recommendations' },
        result_count: recommendations.length,
        timestamp_ms: Date.now()
      })
    } catch (err) {
      console.warn('Failed to log impression:', err)
    }

    navigate(`/jobs/${job.id}`)
  }, [recommendations, navigate])

  const handleJobSave = useCallback(async (jobId) => {
    // This would integrate with saved jobs service
    console.log('Save job:', jobId)
    // TODO: Implement save functionality
  }, [])

  const handleFeedback = useCallback(async (jobId, feedback) => {
    try {
      // Log feedback event
      await searchService.logEvent({
        event_type: feedback === 'positive' ? 'click' : 'dismiss',
        job_id: jobId,
        query: 'recommendations',
        filters: { source: 'recommendations', feedback },
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

  if (loading) {
    return (
      <div className="for-you-page">
        <div className="page-header">
          <h1>Dành cho bạn</h1>
          <p>Khám phá các công việc phù hợp với hồ sơ của bạn</p>
        </div>

        <div className="recommendations-grid">
          {Array.from({ length: 6 }, (_, index) => (
            <LoadingSkeleton key={index} type="job-card" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="for-you-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Dành cho bạn</h1>
          <p>Khám phá các công việc phù hợp với hồ sơ của bạn</p>
        </div>

        <div className="header-actions">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="refresh-button"
          >
            {refreshing ? '🔄' : '🔄'} Làm mới
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={handleRefresh}>Thử lại</button>
        </div>
      )}

      <div className="recommendations-content">
        {recommendations.length > 0 ? (
          <>
            <div className="recommendations-stats">
              <span>{recommendations.length} công việc được đề xuất cho bạn</span>
            </div>

            <div className="recommendations-grid">
              {recommendations.map((job, index) => (
                <div key={job.id || `job-${index}`} className="recommendation-item">
                  <JobCard
                    job={job._source || job}
                    onClick={() => handleJobClick(job)}
                    showActions={true}
                    onSave={() => handleJobSave(job.id)}
                    score={job.score}
                    experimentVariant={job.experiment_variant}
                  />

                  <div className="recommendation-feedback">
                    <span className="match-score">
                      Độ phù hợp: {Math.round((job.score_percent || job.score || 0) * 100)}%
                    </span>

                    <div className="feedback-buttons">
                      <button
                        onClick={() => handleFeedback(job.id, 'positive')}
                        className="feedback-btn positive"
                        aria-label="Thích đề xuất này"
                      >
                        👍
                      </button>
                      <button
                        onClick={() => handleFeedback(job.id, 'negative')}
                        className="feedback-btn negative"
                        aria-label="Không thích đề xuất này"
                      >
                        👎
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <NoResults
            message="Chúng tôi chưa có đủ thông tin để đề xuất công việc phù hợp."
            suggestion="Hãy cập nhật hồ sơ của bạn để nhận được đề xuất tốt hơn."
          />
        )}
      </div>
    </div>
  )
}
