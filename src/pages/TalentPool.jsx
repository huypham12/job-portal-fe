import { useState, useEffect } from "react"
import { JobService, MatchingService, TalentPoolService } from "../lib/api.js"
import TalentPoolFilters from "./components/TalentPoolFilters.jsx"
import TalentPoolResults from "./components/TalentPoolResults.jsx"
import TalentPoolSaved from "./components/TalentPoolSaved.jsx"

function TalentPool() {
  const [activeTab, setActiveTab] = useState('matching') // matching | saved
  const [jobs, setJobs] = useState([])
  const [selectedJobId, setSelectedJobId] = useState('')
  const [loading, setLoading] = useState(false)
  const [matchingResults, setMatchingResults] = useState([])
  const [matchingError, setMatchingError] = useState(null)

  // Load jobs for matching
  useEffect(() => {
    const loadJobs = async () => {
      try {
        const response = await JobService.myJobs({ page: 1, limit: 100 })
        const jobsData = response?.data || response || []
        const approvedJobs = jobsData.filter(job => job.status === 'approved')
        setJobs(approvedJobs)

        // Default select first approved job
        if (approvedJobs.length > 0 && !selectedJobId) {
          setSelectedJobId(approvedJobs[0].id)
        }
      } catch (error) {
        console.error('Failed to load jobs:', error)
      }
    }
    loadJobs()
  }, [selectedJobId])

  const handleMatching = async (filters) => {
    if (!selectedJobId) return

    setLoading(true)
    setMatchingError(null)
    try {
      const response = await MatchingService.matchCandidates(selectedJobId, filters)
      const payload = response?.data || response || {}
      const candidates = payload.candidates || payload || []
      setMatchingResults(candidates)
    } catch (error) {
      console.error('Matching failed:', error)
      setMatchingError(error?.message || 'Không thể tìm kiếm ứng viên. Vui lòng thử lại.')
      setMatchingResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCandidate = async (candidateId) => {
    try {
      await TalentPoolService.saveCandidate(candidateId, selectedJobId)
      // Show success feedback (could be replaced with toast notification)
      console.log(`Successfully saved candidate ${candidateId} to talent pool`)
      // In a real app, you might want to show a toast notification here
    } catch (error) {
      console.error('Failed to save candidate:', error)
      // In a real app, show error toast
      alert('Không thể lưu ứng viên. Vui lòng thử lại.')
    }
  }

  const handleBulkSaveCandidates = async (candidateIds) => {
    try {
      await TalentPoolService.bulkSaveCandidates(candidateIds, selectedJobId)
      console.log(`Successfully saved ${candidateIds.length} candidates to talent pool`)
      // In a real app, show success toast with count
    } catch (error) {
      console.error('Failed to bulk save candidates:', error)
      alert('Không thể lưu ứng viên. Vui lòng thử lại.')
      throw error // Re-throw to let the UI handle it
    }
  }

  return (
    <div className="talent-pool">
      <section className="rd-card rd-hero-card">
        <div>
          <h1>Talent Pool</h1>
          <p>Khám phá và quản lý nguồn ứng viên tiềm năng cho công ty bạn</p>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="rd-tabs">
        <button
          className={activeTab === 'matching' ? 'active' : ''}
          onClick={() => setActiveTab('matching')}
        >
          Tìm ứng viên mới
        </button>
        <button
          className={activeTab === 'saved' ? 'active' : ''}
          onClick={() => setActiveTab('saved')}
        >
          Ứng viên đã lưu
        </button>
      </div>

      {activeTab === 'matching' && (
        <>
          {/* Job Selection */}
          <section className="rd-card job-selection-card">
            <div className="rd-card__head">
              <h3>Chọn vị trí cần tuyển</h3>
            </div>
            <div className="rd-card__body">
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="rd-select"
                disabled={loading}
              >
                <option value="">Chọn vị trí...</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.title} - {job.location?.name || 'Chưa xác định'}
                  </option>
                ))}
              </select>
              {jobs.length === 0 && (
                <div className="empty-state" style={{ padding: '20px', margin: '10px 0' }}>
                  <div className="empty-icon">💼</div>
                  <p className="empty-description">
                    Bạn chưa có vị trí nào được duyệt. Hãy <a href="/post-job" style={{ color: '#3b82f6', textDecoration: 'underline' }}>đăng tin tuyển dụng</a> trước.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Filters */}
          <TalentPoolFilters
            onMatch={handleMatching}
            loading={loading}
            disabled={!selectedJobId}
          />

          {/* Error Display */}
          {matchingError && (
            <div className="rd-card" style={{ borderColor: '#ef4444', backgroundColor: '#fef2f2' }}>
              <div className="rd-card__body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>⚠️</span>
                  <div>
                    <p style={{ margin: 0, fontWeight: '600', color: '#dc2626' }}>Không thể tìm kiếm ứng viên</p>
                    <p style={{ margin: '4px 0 0 0', color: '#7f1d1d' }}>{matchingError}</p>
                  </div>
                  <button
                    onClick={() => setMatchingError(null)}
                    style={{
                      marginLeft: 'auto',
                      background: 'none',
                      border: 'none',
                      fontSize: '18px',
                      cursor: 'pointer',
                      color: '#dc2626'
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          <TalentPoolResults
            candidates={matchingResults}
            loading={loading}
            onSaveCandidate={handleSaveCandidate}
            onBulkSaveCandidates={handleBulkSaveCandidates}
            selectedJobId={selectedJobId}
          />
        </>
      )}

      {activeTab === 'saved' && (
        <TalentPoolSaved selectedJobId={selectedJobId} />
      )}
    </div>
  )
}

export default TalentPool
