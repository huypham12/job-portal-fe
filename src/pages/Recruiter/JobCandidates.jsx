import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { matchingService } from '../../services/matchingService.js'
import { searchService } from '../../services/searchService.js'
import CandidateCard from '../../components/CandidateCard.jsx'
import LoadingSkeleton from '../../components/LoadingSkeleton.jsx'
import NoResults from '../../components/NoResults.jsx'
import './JobCandidates.css'

export default function JobCandidates() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [showExplanation, setShowExplanation] = useState(false)

  // Load candidates on mount and when jobId changes
  useEffect(() => {
    if (jobId) {
      loadCandidates()
    }
  }, [jobId])

  const loadCandidates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await matchingService.getCandidatesForJob(jobId, {
        size: 50 // Get more candidates for better matching
      })

      setCandidates(response.candidates || [])
    } catch (err) {
      console.error('Failed to load job candidates:', err)
      setError(err.message || 'Không thể tải danh sách ứng viên phù hợp')
    } finally {
      setLoading(false)
    }
  }, [jobId])

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true)
      await loadCandidates()
    } finally {
      setRefreshing(false)
    }
  }, [loadCandidates])

  const handleCandidateClick = useCallback(async (candidate) => {
    try {
      // Log impression event
      await searchService.logEvent({
        event_type: 'impression',
        profile_id: candidate.id,
        job_id: jobId,
        query: 'job_matching',
        position: candidates.findIndex(c => c.id === candidate.id) + 1,
        filters: { source: 'job_candidates' },
        result_count: candidates.length,
        timestamp_ms: Date.now()
      })
    } catch (err) {
      console.warn('Failed to log impression:', err)
    }

    navigate(`/candidates/${candidate.id || candidate.profile_id}`)
  }, [candidates, jobId, navigate])

  const handleShowExplanation = useCallback((candidate) => {
    setSelectedCandidate(candidate)
    setShowExplanation(true)
  }, [])

  const handleCloseExplanation = useCallback(() => {
    setSelectedCandidate(null)
    setShowExplanation(false)
  }, [])

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
        job_id: jobId,
        query: 'job_matching',
        filters: { source: 'job_candidates', feedback },
        result_count: candidates.length,
        timestamp_ms: Date.now()
      })

      // Update local state for immediate feedback
      setCandidates(prev => prev.map(c =>
        c.id === candidateId
          ? { ...c, userFeedback: feedback }
          : c
      ))
    } catch (err) {
      console.warn('Failed to log feedback:', err)
    }
  }, [candidates.length, jobId])

  if (loading) {
    return (
      <div className="job-candidates-page">
        <div className="page-header">
          <h1>Ứng viên phù hợp</h1>
          <p>Khám phá các ứng viên phù hợp với công việc của bạn</p>
        </div>

        <div className="candidates-grid">
          {Array.from({ length: 8 }, (_, index) => (
            <LoadingSkeleton key={index} type="card" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="job-candidates-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Ứng viên phù hợp</h1>
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

      <div className="candidates-content">
        {candidates.length > 0 ? (
          <>
            <div className="candidates-stats">
              <span>{candidates.length} ứng viên được tìm thấy</span>
              <button
                onClick={() => setCandidates(prev => [...prev].sort((a, b) => (b.score_percent || 0) - (a.score_percent || 0)))}
                className="sort-button"
              >
                Sắp xếp theo độ phù hợp
              </button>
            </div>

            <div className="candidates-grid">
              {candidates.map((candidate, index) => (
                <div key={candidate.id || `candidate-${index}`} className="candidate-item">
                  <CandidateCard
                    candidate={candidate}
                    onClick={() => handleCandidateClick(candidate)}
                    score={candidate.score_percent || candidate.score}
                    experimentVariant={candidate.experiment_variant}
                  />

                  <div className="candidate-actions">
                    <div className="match-info">
                      <span className="match-percentage">
                        {Math.round((candidate.score_percent || candidate.score || 0) * 100)}% phù hợp
                      </span>
                      <button
                        onClick={() => handleShowExplanation(candidate)}
                        className="explanation-btn"
                      >
                        Chi tiết
                      </button>
                    </div>

                    <div className="action-buttons">
                      <button
                        onClick={() => handleFeedback(candidate.id, 'positive')}
                        className={`feedback-btn positive ${candidate.userFeedback === 'positive' ? 'active' : ''}`}
                        aria-label="Ứng viên phù hợp"
                        title="Ứng viên này phù hợp"
                      >
                        👍 {candidate.userFeedback === 'positive' && 'Đã thích'}
                      </button>
                      <button
                        onClick={() => handleFeedback(candidate.id, 'negative')}
                        className={`feedback-btn negative ${candidate.userFeedback === 'negative' ? 'active' : ''}`}
                        aria-label="Ứng viên không phù hợp"
                        title="Ứng viên này không phù hợp"
                      >
                        👎 {candidate.userFeedback === 'negative' && 'Đã bỏ qua'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <NoResults
            message="Không tìm thấy ứng viên nào phù hợp với công việc này."
            suggestion="Hãy thử điều chỉnh yêu cầu công việc hoặc đăng công việc với nhiều thông tin hơn."
          />
        )}
      </div>

      {/* Explanation Modal */}
      {showExplanation && selectedCandidate && (
        <div className="explanation-modal-overlay" onClick={handleCloseExplanation}>
          <div className="explanation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết độ phù hợp</h3>
              <button
                onClick={handleCloseExplanation}
                className="close-btn"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="modal-content">
              <div className="candidate-summary">
                <h4>{selectedCandidate.full_name || selectedCandidate.display_name}</h4>
                <p>{selectedCandidate.headline}</p>
                <div className="match-score-large">
                  Độ phù hợp: {Math.round((selectedCandidate.score_percent || selectedCandidate.score || 0) * 100)}%
                </div>
              </div>

              {selectedCandidate.explanation && (
                <div className="explanation-details">
                  <h5>Các yếu tố đánh giá:</h5>
                  <div className="explanation-breakdown">
                    {Object.entries(selectedCandidate.explanation).map(([key, value]) => {
                      if (key === 'variant') return null
                      return (
                        <div key={key} className="explanation-row">
                          <span className="factor-name">{key}:</span>
                          <span className="factor-value">{JSON.stringify(value)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button onClick={handleCloseExplanation} className="cancel-btn">
                Đóng
              </button>
              <button
                onClick={() => {
                  handleCandidateClick(selectedCandidate)
                  handleCloseExplanation()
                }}
                className="view-profile-btn"
              >
                Xem hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
