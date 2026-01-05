import React, { useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import SearchBar from '../components/SearchBar.jsx'
import JobList from '../components/JobList.jsx'
import JobFiltersSidebar from '../components/JobFiltersSidebar.jsx'
import SortSelect from '../components/SortSelect.jsx'
import ActiveFilters from '../components/ActiveFilters.jsx'
import { useJobsSearch } from '../hooks/useJobs.js'
import { searchService } from '../services/searchService.js'
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
    salaryMin: searchParams.get('salaryMin') ? parseInt(searchParams.get('salaryMin')) : undefined,
    salaryMax: searchParams.get('salaryMax') ? parseInt(searchParams.get('salaryMax')) : undefined,
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
    applyFilters, // allow explicit trigger when suggestion payload selected
    goToPage
  } = useJobsSearch(initialFilters)

  // Search history state
  const [searchHistory, setSearchHistory] = React.useState(null)
  const [searchHistoryLoading, setSearchHistoryLoading] = React.useState(false)

  // Lấy user context từ search state hoặc localStorage
  const getUserContext = useCallback(() => {
    // Từ search state (nếu user đã set preferences)
    const userContext = {
      userLocation: searchState.userLocationId || searchState.location,
      userExperienceLevel: searchState.userExperienceLevel,
      userSkills: searchState.userSkills || []
    }

    // Hoặc từ localStorage nếu có user profile
    const savedProfile = localStorage.getItem('user_profile')
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile)
        return {
          userLocation: userContext.userLocation || profile.location,
          userExperienceLevel: userContext.userExperienceLevel || profile.experienceLevel,
          userSkills: userContext.userSkills.length > 0 ? userContext.userSkills : (profile.skills || [])
        }
      } catch (e) {
        console.warn('Failed to parse user profile', e)
      }
    }

    return userContext
  }, [searchState])

  const userContext = getUserContext()

  // Fetch search history from backend
  React.useEffect(() => {
    const fetchSearchHistory = async () => {
      try {
        setSearchHistoryLoading(true)
        const response = await searchService.getSearchHistory({ limit: 10 })
        setSearchHistory(response)
      } catch (error) {
        console.warn('Failed to fetch search history:', error)
        // Keep searchHistory as null to fallback to localStorage
      } finally {
        setSearchHistoryLoading(false)
      }
    }

    // Only fetch if user is authenticated (has userContext with userLocation)
    if (userContext.userLocation) {
      fetchSearchHistory()
    }
  }, [userContext.userLocation])

  // Handle removing search history entry
  const handleRemoveHistoryEntry = useCallback(async (historyId) => {
    try {
      await searchService.deleteSearchHistoryEntry(historyId)
      // Refresh search history
      const response = await searchService.getSearchHistory({ limit: 10 })
      setSearchHistory(response)
    } catch (error) {
      console.error('Failed to delete search history entry:', error)
    }
  }, [])

  // Handle clearing all search history
  const handleClearAllHistory = useCallback(async () => {
    try {
      await searchService.clearSearchHistory()
      setSearchHistory({ history: [], pagination: { total: 0, has_more: false } })
    } catch (error) {
      console.error('Failed to clear search history:', error)
    }
  }, [])

  // Sync URL with search state
  useEffect(() => {
    const params = new URLSearchParams()

    // Add non-empty values to URL
    if (searchState.q) params.set('q', searchState.q)
    if (searchState.location) params.set('location', searchState.location)
    if (searchState.locationId) params.set('locationId', searchState.locationId)
    if (searchState.jobType) params.set('jobType', searchState.jobType)
    if (searchState.experienceLevel !== null) params.set('experienceLevel', String(searchState.experienceLevel))

    // Handle arrays (skills)
    searchState.skills.forEach(skill => params.append('skills', skill))

    // Salary range
    if (searchState.salaryMin !== null && searchState.salaryMin !== undefined) params.set('salaryMin', String(searchState.salaryMin))
    if (searchState.salaryMax !== null && searchState.salaryMax !== undefined) params.set('salaryMax', String(searchState.salaryMax))

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

  // Handle structured payload from suggestion (company only - location removed from text search)
  const handleSuggestionPayload = useCallback((payload) => {
    if (!payload) return

    // Example payload shapes: { company_id } or { location_id } or { location: { id, name } }
    if (payload.company_id || (payload.company && payload.company.id)) {
      const companyId = payload.company_id || payload.company.id
      // set an arbitrary filter field for company id (backend may read company id if supported)
      setFilter('companyId', companyId)
    }

    // Location removed from text search - users should use location filter dropdown instead
    // if (payload.location_id || (payload.location && payload.location.id)) {
    //   const locId = payload.location_id || payload.location.id
    //   setFilter('locationId', locId)
    //   // try to set human-friendly location text if available
    //   const locText = payload.location_name || (payload.location && payload.location.name)
    //   if (locText) setFilter('location', locText)
    // }

    // Trigger search immediately for selected payload
    try {
      applyFilters()
    } catch (e) {
      // fallback: nothing
    }
  }, [setFilter, applyFilters])

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

  // Handle clear all search and filters
  const handleClearAll = useCallback(() => {
    // Reset search query
    setFilter('q', '')
    // Reset location
    setFilter('location', '')
    setFilter('locationId', null)
    // Reset all filters
    resetFilters()
    // Reset salary to undefined to use defaults
    setFilter('salaryMin', undefined)
    setFilter('salaryMax', undefined)
  }, [setFilter, resetFilters])

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
    navigate(`/search/${job.id}`)
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
        <div className="header-top">
          <div className="header-content">
        <h1>Tìm việc</h1>
          </div>
        </div>
        <SearchBar
          value={searchState.q}
          onChange={handleSearchChange}
          placeholder="Tìm kiếm vị trí, công ty, kỹ năng..."
          loading={loading}
          showSuggestions={FEATURES.ENABLE_SEARCH_SUGGESTIONS}
          onSelectPayload={handleSuggestionPayload}
          userContext={userContext}
          onClear={handleClearAll}
          backendHistory={searchHistory}
          onRemoveHistoryEntry={handleRemoveHistoryEntry}
          onClearAllHistory={handleClearAllHistory}
          searchHistoryLoading={searchHistoryLoading}
        />
      </div>

      {/* Horizontal filter bar placed directly under the search header */}
      <div className="filter-bar">
        <JobFiltersSidebar
          filters={searchState}
          onFilterChange={handleFilterChange}
          showAdvancedFilters={FEATURES.ENABLE_ADVANCED_SEARCH}
        />
      </div>

      <div className="search-content">
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
                  Xóa bộ lọc ({activeFilterCount})
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
