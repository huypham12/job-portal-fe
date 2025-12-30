import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { matchingService } from '../../services/matchingService.js'
import { searchService } from '../../services/searchService.js'
import JobCard from '../../components/JobCard.jsx'
import LoadingSkeleton from '../../components/LoadingSkeleton.jsx'
import NoResults from '../../components/NoResults.jsx'
import './MatchedJobs.css'

export default function MatchedJobs() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [showExplanation, setShowExplanation] = useState(false)

  // Load matched jobs on mount
  useEffect(() => {
    loadMatchedJobs()
  }, [])

  const loadMatchedJobs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user profile ID (placeholder - should come from auth)
      const profileId = 'current-profile-id' // TODO: Get from auth context

      const response = await matchingService.getJobsForProfile(profileId, {
        size: 50 // Get more jobs for better matching
      })

      setJobs(response.jobs || [])
    } catch (err) {
      console.error('Failed to load matched jobs:', err)
      setError(err.message || 'Không thể tải danh sách công việc phù hợp')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true)
      await loadMatchedJobs()
    } finally {
      setRefreshing(false)
    }
  }, [loadMatchedJobs])

  const handleJobClick = useCallback(async (job) => {
    try {
      // Log impression event
      await searchService.logEvent({
        event_type: 'impression',
        job_id: job.id,
        query: 'profile_matching',
        position: jobs.findIndex(j => j.id === job.id) + 1,
        filters: { source: 'matched_jobs' },
        result_count: jobs.length,
        timestamp_ms: Date.now()
      })
    } catch (err) {
      console.warn('Failed to log impression:', err)
    }

    navigate(`/jobs/${job.id}`)
  }, [jobs, navigate])

  const handleShowExplanation = useCallback((job) => {
    setSelectedJob(job)
    setShowExplanation(true)
  }, [])

  const handleCloseExplanation = useCallback(() => {
    setSelectedJob(null)
    setShowExplanation(false)
  }, [])

  const handleSaveJob = useCallback(async (jobId) => {
    // TODO: Implement save job functionality
    console.log('Save job:', jobId)
  }, [])

  const handleApplyJob = useCallback(async (jobId) => {
    // Navigate to job detail with apply intent
    navigate(`/jobs/${jobId}?apply=true`)
  }, [navigate])

  const handleFeedback = useCallback(async (jobId, feedback) => {
    try {
      // Log feedback event
      await searchService.logEvent({
        event_type: feedback === 'positive' ? 'click' : 'dismiss',
        job_id: jobId,
        query: 'profile_matching',
        filters: { source: 'matched_jobs', feedback },
        result_count: jobs.length,
        timestamp_ms: Date.now()
      })

      // Update local state for immediate feedback
      setJobs(prev => prev.map(j =>
        j.id === jobId
          ? { ...j, userFeedback: feedback }
          : j
      ))
    } catch (err) {
      console.warn('Failed to log feedback:', err)
    }
  }, [jobs.length])

  if (loading) {
    return (
      <div className="matched-jobs-page">
        <div className="page-header">
          <h1>Công việc phù hợp</h1>
          <p>Khám phá các công việc phù hợp với hồ sơ của bạn</p>
        </div>

        <div className="jobs-grid">
          {Array.from({ length: 6 }, (_, index) => (
            <LoadingSkeleton key={index} type="job-card" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="matched-jobs-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Công việc phù hợp</h1>
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

      <div className="jobs-content">
        {jobs.length > 0 ? (
          <>
            <div className="jobs-stats">
              <span>{jobs.length} công việc được tìm thấy</span>
              <button
                onClick={() => setJobs(prev => [...prev].sort((a, b) => (b.score_percent || 0) - (a.score_percent || 0)))}
                className="sort-button"
              >
                Sắp xếp theo độ phù hợp
              </button>
            </div>

            <div className="jobs-grid">
              {jobs.map((job, index) => (
                <div key={job.id || `job-${index}`} className="job-item">
                  <JobCard
                    job={job._source || job}
                    onClick={() => handleJobClick(job)}
                    score={job.score_percent || job.score}
                    experimentVariant={job.experiment_variant}
                  />

                  <div className="job-actions">
                    <div className="match-info">
                      <span className="match-percentage">
                        {Math.round((job.score_percent || job.score || 0) * 100)}% phù hợp
                      </span>
                      <button
                        onClick={() => handleShowExplanation(job)}
                        className="explanation-btn"
                      >
                        Chi tiết
                      </button>
                    </div>

                    <div className="action-buttons">
                      <button
                        onClick={() => handleSaveJob(job.id)}
                        className="action-btn save"
                        aria-label="Lưu công việc"
                      >
                        💾 Lưu
                      </button>
                      <button
                        onClick={() => handleApplyJob(job.id)}
                        className="action-btn apply"
                        aria-label="Ứng tuyển"
                      >
                        📝 Ứng tuyển
                      </button>
                      <button
                        onClick={() => handleFeedback(job.id, 'negative')}
                        className={`feedback-btn negative ${job.userFeedback === 'negative' ? 'active' : ''}`}
                        aria-label="Không quan tâm"
                        title="Không quan tâm đến công việc này"
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
            message="Chưa có công việc nào phù hợp với hồ sơ của bạn."
            suggestion="Hãy cập nhật thông tin cá nhân và kỹ năng để nhận được đề xuất tốt hơn."
          />
        )}
      </div>

      {/* Explanation Modal */}
      {showExplanation && selectedJob && (
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
              <div className="job-summary">
                <h4>{selectedJob.title}</h4>
                <p>{selectedJob.company_name}</p>
                <div className="match-score-large">
                  Độ phù hợp: {Math.round((selectedJob.score_percent || selectedJob.score || 0) * 100)}%
                </div>
              </div>

              {selectedJob.explanation && (
                <div className="explanation-details">
                  <h5>Các yếu tố đánh giá:</h5>
                  <div className="explanation-breakdown">
                    {Object.entries(selectedJob.explanation).map(([key, value]) => {
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
                  handleJobClick(selectedJob)
                  handleCloseExplanation()
                }}
                className="view-job-btn"
              >
                Xem chi tiết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
