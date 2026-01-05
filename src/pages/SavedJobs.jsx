import React, { useCallback, useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import JobCard from '../components/JobCard.jsx'
import JobsList from './JobsList.jsx'
import { SavedJobsService } from '../lib/api.js'
import { mapJobData } from '../utils/jobUtils.js'
import { getRole } from '../auth/auth.js'

const PAGE_SIZE = 20
const SORT_OPTIONS = [
  { value: 'saved_at', label: 'Lưu gần đây', sort_by: 'saved_at', order: 'desc' },
  { value: 'saved_oldest', label: 'Lưu lâu nhất', sort_by: 'saved_at', order: 'asc' },
  { value: 'salaryHigh', label: 'Lương cao nhất', sort_by: 'salary', order: 'desc' },
  { value: 'salaryLow', label: 'Lương thấp nhất', sort_by: 'salary', order: 'asc' },
  { value: 'newest', label: 'Mới đăng nhất', sort_by: 'created_at', order: 'desc' }
]

const JOB_TYPES = [
  { value: 'full_time', label: 'Toàn thời gian' },
  { value: 'part_time', label: 'Bán thời gian' },
  { value: 'contract', label: 'Hợp đồng' }
]

export default function SavedJobs() {
  const navigate = useNavigate()
  const role = getRole()
  const [jobs, setJobs] = useState([])
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [sortOrder, setSortOrder] = useState('saved_at')
  const [locationId, setLocationId] = useState('')
  const [selectedJobType, setSelectedJobType] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, total_pages: 1 })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const searchTimeoutRef = useRef(null)

  // Redirect if not candidate
  useEffect(() => {
    if (role !== 'candidate') {
      navigate('/login?role=candidate&redirect=/saved-jobs', { replace: true })
    }
  }, [role, navigate])

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedKeyword(keyword)
      setCurrentPage(1)
    }, 500)
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [keyword])

  const fetchSavedJobs = useCallback(async () => {
    if (role !== 'candidate') return

    setIsLoading(true)
    setError('')
    try {
      const sortOption = SORT_OPTIONS.find(opt => opt.value === sortOrder) || SORT_OPTIONS[0]
      
      const pageNum = parseInt(String(currentPage), 10) || 1
      const limitNum = parseInt(String(PAGE_SIZE), 10) || 20
      
      const filters = {
        page: pageNum,
        limit: limitNum,
        search: debouncedKeyword.trim() || undefined,
        location_id: locationId || undefined,
        job_type: selectedJobType || undefined,
        sort_by: sortOption.sort_by,
        order: sortOption.order
      }

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined || filters[key] === null || filters[key] === '') {
          delete filters[key]
        }
      })

      const response = await SavedJobsService.list(filters)
      
      // Handle response format: { message, data, pagination }
      // Backend might return jobs with saved_at field
      const jobsList = Array.isArray(response?.data) ? response.data : []
      
      // Map jobs - saved jobs might have job object nested
      const mappedJobs = jobsList.map((item) => {
        // If item has a job property, use that; otherwise use item directly
        const jobData = item.job || item
        return mapJobData(jobData)
      })
      
      setJobs(mappedJobs)
      setPagination(response?.pagination || { page: 1, limit: PAGE_SIZE, total: 0, total_pages: 1 })
      setError('')
    } catch (err) {
      console.error('Error fetching saved jobs:', err)
      const errorMessage = err?.message || err?.data?.message || 'Không thể tải việc làm đã lưu. Vui lòng thử lại.'
      setError(errorMessage)
      setJobs([])
      setPagination({ page: 1, limit: PAGE_SIZE, total: 0, total_pages: 1 })
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, debouncedKeyword, sortOrder, locationId, selectedJobType, role])

  useEffect(() => {
    if (role === 'candidate') {
      fetchSavedJobs()
    }
  }, [fetchSavedJobs, role])

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [debouncedKeyword, sortOrder, locationId, selectedJobType])

  const handleUnsave = async (jobId) => {
    try {
      await SavedJobsService.unsave(jobId)
      // Remove from list
      setJobs(prev => prev.filter(job => job.id !== jobId))
      // Update pagination total
      setPagination(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1)
      }))
    } catch (err) {
      alert(err?.message || 'Không thể bỏ lưu việc làm. Vui lòng thử lại.')
    }
  }

  if (role !== 'candidate') {
    return null
  }

  return (
    <div className="jobs-page">
      <div className="jobs-container">
        <header className="jobs-page__header">
          <div>
            <h1>Việc làm đã lưu</h1>
            <p className="subtitle">Quản lý các việc làm bạn đã lưu</p>
          </div>
          <div className="jobs-page__controls">
            <input
              type="text"
              placeholder="Tìm theo vị trí hoặc công ty"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </header>

        <div className="jobs-page__layout">
          <aside className="jobs-page__sidebar">
            <div className="section-card">
              <h3>Bộ lọc</h3>
              <div className="filter-group">
                <label>Loại công việc</label>
                <select 
                  value={selectedJobType} 
                  onChange={(e) => {
                    setSelectedJobType(e.target.value)
                    setCurrentPage(1)
                  }}
                >
                  <option value="">Tất cả</option>
                  {JOB_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Địa điểm</label>
                <input
                  type="text"
                  placeholder="Nhập địa điểm..."
                  value={locationId}
                  onChange={(e) => {
                    setLocationId(e.target.value)
                    setCurrentPage(1)
                  }}
                />
                <small className="muted">Tính năng tìm kiếm địa điểm sẽ được cập nhật sau</small>
              </div>
            </div>
          </aside>

          <main className="jobs-page__content">
            {jobs.length === 0 && !isLoading && !error ? (
              <div className="state-card empty">
                <h3>Chưa có việc làm nào được lưu</h3>
                <p>Hãy lưu các việc làm bạn quan tâm để xem lại sau.</p>
                <button className="btn primary" onClick={() => navigate('/jobs')}>
                  Khám phá việc làm
                </button>
              </div>
            ) : (
              <JobsList
                jobs={jobs}
                totalPages={pagination.total_pages || 1}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                isLoading={isLoading}
                error={error}
                onRetry={fetchSavedJobs}
                showPagination={pagination.total_pages > 1}
                JobCardComponent={({ job, ...props }) => (
                  <div style={{ position: 'relative' }}>
                    <JobCard job={job} {...props} />
                    <button
                      className="btn ghost small"
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 10
                      }}
                      onClick={() => handleUnsave(job.id)}
                      title="Bỏ lưu"
                    >
                      ✕
                    </button>
                  </div>
                )}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

