import React, { useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import SearchBar from '../components/SearchBar.jsx'
import JobList from '../components/JobList.jsx'
import JobFiltersSidebar from '../components/JobFiltersSidebar.jsx'
import SortSelect from '../components/SortSelect.jsx'
import ActiveFilters from '../components/ActiveFilters.jsx'
import { useJobsSearch } from '../hooks/useJobs.js'
import { FEATURES, SEARCH_CONFIG } from '../config.js'
import './SearchPage.css'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  // Initialize search state from URL params
  const initialFilters = {
    q: searchParams.get('q') || '',
    location: searchParams.get('location') || '',
    locationId: searchParams.get('locationId') || null,
    jobType: searchParams.get('jobType') || '',
    experienceLevel: searchParams.get('experienceLevel') ? parseInt(searchParams.get('experienceLevel')) : null,
    skills: searchParams.getAll('skills').filter(Boolean) || [],
    salaryMin: searchParams.get('salaryMin') ? parseInt(searchParams.get('salaryMin')) : null,
    salaryMax: searchParams.get('salaryMax') ? parseInt(searchParams.get('salaryMax')) : null,
    jobCategories: searchParams.getAll('jobCategories').filter(Boolean) || [],
    jobBenefits: searchParams.getAll('jobBenefits').filter(Boolean) || [],
    remotePercentageMin: searchParams.get('remotePercentageMin') ? parseInt(searchParams.get('remotePercentageMin')) : null,
    flexibleHours: searchParams.get('flexibleHours') === 'true' ? true : searchParams.get('flexibleHours') === 'false' ? false : null,
    sort: searchParams.get('sort') || 'relevance',
    page: parseInt(searchParams.get('page')) || 1,
    size: 20
  }

  // Use the new search hook
  const {
    searchState,
    results,
    loading,
    error,
    total,
    took,
    hasActiveFilters,
    activeFilterCount,
    setFilter,
    setFilters,
    resetFilters,
    goToPage
  } = useJobsSearch(initialFilters)

  // Sync URL with search state
  useEffect(() => {
    const params = new URLSearchParams()

    // Add non-empty values to URL
    if (searchState.q) params.set('q', searchState.q)
    if (searchState.location) params.set('location', searchState.location)
    if (searchState.locationId) params.set('locationId', searchState.locationId)
    if (searchState.jobType) params.set('jobType', searchState.jobType)
    if (searchState.experienceLevel !== null) params.set('experienceLevel', String(searchState.experienceLevel))

    // Handle arrays (skills, categories, benefits)
    searchState.skills.forEach(skill => params.append('skills', skill))
    searchState.jobCategories.forEach(category => params.append('jobCategories', category))
    searchState.jobBenefits.forEach(benefit => params.append('jobBenefits', benefit))

    // Salary range
    if (searchState.salaryMin !== null) params.set('salaryMin', String(searchState.salaryMin))
    if (searchState.salaryMax !== null) params.set('salaryMax', String(searchState.salaryMax))

    // Work arrangement
    if (searchState.remotePercentageMin !== null) params.set('remotePercentageMin', String(searchState.remotePercentageMin))
    if (searchState.flexibleHours !== null) params.set('flexibleHours', String(searchState.flexibleHours))

    // Sort and pagination
    if (searchState.sort !== 'relevance') params.set('sort', searchState.sort)
    if (searchState.page > 1) params.set('page', String(searchState.page))

    setSearchParams(params)
  }, [searchState, setSearchParams])

  // Handle search input changes (debounced)
  const handleSearchChange = useCallback((query) => {
    setFilter('q', query)
  }, [setFilter])

  // Handle sort changes
  const handleSortChange = useCallback((sort) => {
    setFilter('sort', sort)
  }, [setFilter])

  // Handle filter changes
  const handleFilterChange = useCallback((filterKey, value) => {
    setFilter(filterKey, value)
  }, [setFilter])

  // Handle removing active filters
  const handleRemoveFilter = useCallback((filterKey, value) => {
    setFilter(filterKey, value)
  }, [setFilter])

  // Handle job click (log impression and navigate)
  const handleJobClick = useCallback(async (job) => {
    // Log impression event if analytics is enabled
    if (FEATURES.ENABLE_ANALYTICS) {
      try {
        await searchService.logEvent({
          event_type: 'impression',
          job_id: job.id,
          query: searchState.q,
          position: results.findIndex(j => j.id === job.id) + 1,
          filters: searchState,
          result_count: total,
          timestamp_ms: Date.now()
        })
      } catch (err) {
        console.warn('Failed to log impression:', err)
      }
    }

    // Navigate to job detail
    navigate(`/jobs/${job.id}`)
  }, [results, searchState, total, navigate])

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        // Note: error clearing would need to be handled in the hook
        // For now, we'll keep it simple
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  return (
    <div className="search-page">
      <div className="search-header">
        <h1>Tìm việc</h1>
        <SearchBar
          value={searchState.q}
          onChange={handleSearchChange}
          placeholder="Tìm kiếm vị trí, công ty, kỹ năng..."
          loading={loading}
          showSuggestions={FEATURES.ENABLE_SEARCH_SUGGESTIONS}
        />
      </div>

      <div className="search-content">
        <aside className="search-sidebar">
          <JobFiltersSidebar
            filters={searchState}
            onFilterChange={handleFilterChange}
            showAdvancedFilters={FEATURES.ENABLE_ADVANCED_SEARCH}
          />
        </aside>

        <main className="search-results">
          {FEATURES.ENABLE_ADVANCED_SEARCH && (
            <div className="search-controls">
              <SortSelect
                value={searchState.sort}
                onChange={handleSortChange}
                disabled={loading}
              />
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  className="clear-filters-btn"
                  onClick={resetFilters}
                  disabled={loading}
                >
                  Xóa tất cả bộ lọc ({activeFilterCount})
                </button>
              )}
            </div>
          )}

          {FEATURES.ENABLE_ADVANCED_SEARCH && hasActiveFilters && (
            <ActiveFilters
              filters={searchState}
              onRemoveFilter={handleRemoveFilter}
            />
          )}

          <div className="search-meta">
            {loading ? (
              <div className="loading-indicator">Đang tìm kiếm...</div>
            ) : (
              <div className="results-info">
                {total > 0 ? (
                  <span>
                    Tìm thấy {total.toLocaleString()} vị trí
                    {took > 0 && ` trong ${took}ms`}
                  </span>
                ) : searchState.q || hasActiveFilters ? (
                  <span>Không tìm thấy công việc phù hợp</span>
                ) : (
                  <span>Nhập từ khóa để tìm kiếm</span>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => goToPage(searchState.page)}>
                Thử lại
              </button>
            </div>
          )}

          <JobList
            jobs={results}
            loading={loading}
            onJobClick={handleJobClick}
            onPageChange={goToPage}
            currentPage={searchState.page}
            totalPages={Math.ceil(total / searchState.size)}
          />
        </main>
      </div>
    </div>
  )
}
