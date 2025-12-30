import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { recommendationsService } from '../../services/recommendationsService.js'
import { searchService } from '../../services/searchService.js'
import CandidateCard from '../../components/CandidateCard.jsx'
import LoadingSkeleton from '../../components/LoadingSkeleton.jsx'
import NoResults from '../../components/NoResults.jsx'
import './CandidateRecommendations.css'

export default function CandidateRecommendations() {
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

      // Get user's company ID from context/auth (placeholder for now)
      const companyId = 'current-company-id' // TODO: Get from auth context

      const response = await recommendationsService.getRecruiterRecommendations({
        companyId,
        limit: 20
      })

      setRecommendations(response || [])
    } catch (err) {
      console.error('Failed to load candidate recommendations:', err)
      setError(err.message || 'Không thể tải đề xuất ứng viên')
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

  const handleCandidateClick = useCallback(async (candidate) => {
    try {
      // Log impression event
      await searchService.logEvent({
        event_type: 'impression',
        profile_id: candidate.id,
        query: 'recruiter_recommendations',
        position: recommendations.findIndex(c => c.profile_id === candidate.profile_id) + 1,
        filters: { source: 'recruiter_recommendations' },
        result_count: recommendations.length,
        timestamp_ms: Date.now()
      })
    } catch (err) {
      console.warn('Failed to log impression:', err)
    }

    navigate(`/candidates/${candidate.id || candidate.profile_id}`)
  }, [recommendations, navigate])

  const handleContactCandidate = useCallback(async (candidate) => {
    // TODO: Implement contact functionality
    console.log('Contact candidate:', candidate)
    // This would open a contact modal or navigate to messaging
  }, [])

  const handleFeedback = useCallback(async (candidateId, feedback) => {
    try {
      // Log feedback event
      await searchService.logEvent({
        event_type: feedback === 'positive' ? 'click' : 'dismiss',
        profile_id: candidateId,
        query: 'recruiter_recommendations',
        filters: { source: 'recruiter_recommendations', feedback },
        result_count: recommendations.length,
        timestamp_ms: Date.now()
      })

      // Remove from recommendations if negative feedback
      if (feedback === 'negative') {
        setRecommendations(prev => prev.filter(c => c.profile_id !== candidateId))
      }
    } catch (err) {
      console.warn('Failed to log feedback:', err)
    }
  }, [recommendations.length])

  if (loading) {
    return (
      <div className="candidate-recommendations-page">
        <div className="page-header">
          <h1>Ứng viên được đề xuất</h1>
          <p>Khám phá các ứng viên phù hợp với công việc của bạn</p>
        </div>

        <div className="candidates-grid">
          {Array.from({ length: 6 }, (_, index) => (
            <LoadingSkeleton key={index} type="card" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="candidate-recommendations-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Ứng viên được đề xuất</h1>
          <p>Khám phá các ứng viên phù hợp với công việc của bạn</p>
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
              <span>{recommendations.length} ứng viên được đề xuất</span>
            </div>

            <div className="candidates-grid">
              {recommendations.map((candidate, index) => (
                <div key={candidate.profile_id || `candidate-${index}`} className="recommendation-item">
                  <CandidateCard
                    candidate={candidate}
                    onClick={() => handleCandidateClick(candidate)}
                    score={candidate.score}
                    experimentVariant={candidate.experiment_variant}
                  />

                  <div className="candidate-feedback">
                    <div className="match-details">
                      <span className="match-score">
                        Độ phù hợp: {Math.round((candidate.score_percent || candidate.score || 0) * 100)}%
                      </span>
                      {candidate.explanation && (
                        <details className="match-explanation">
                          <summary>Chi tiết phù hợp</summary>
                          <div className="explanation-content">
                            {Object.entries(candidate.explanation).map(([key, value]) => (
                              key !== 'variant' && (
                                <div key={key} className="explanation-item">
                                  <span className="explanation-key">{key}:</span>
                                  <span className="explanation-value">{JSON.stringify(value)}</span>
                                </div>
                              )
                            ))}
                          </div>
                        </details>
                      )}
                    </div>

                    <div className="feedback-buttons">
                      <button
                        onClick={() => handleFeedback(candidate.profile_id, 'positive')}
                        className="feedback-btn positive"
                        aria-label="Ứng viên phù hợp"
                        title="Ứng viên này phù hợp"
                      >
                        👍
                      </button>
                      <button
                        onClick={() => handleFeedback(candidate.profile_id, 'negative')}
                        className="feedback-btn negative"
                        aria-label="Ứng viên không phù hợp"
                        title="Ứng viên này không phù hợp"
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
            message="Chưa có ứng viên nào được đề xuất cho công việc của bạn."
            suggestion="Hãy đăng thêm công việc hoặc cập nhật yêu cầu để nhận được đề xuất tốt hơn."
          />
        )}
      </div>
    </div>
  )
}
