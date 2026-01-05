import React, { useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import SearchBar from '../components/SearchBar.jsx'
import JobList from '../components/JobList.jsx'
import JobFiltersSidebar from '../components/JobFiltersSidebar.jsx'
import CompanyFilters from './CompanyFilters.jsx'
import CompanyList from './CompanyList.jsx'
import SortSelect from '../components/SortSelect.jsx'
import ActiveFilters from '../components/ActiveFilters.jsx'
import { useJobsSearch } from '../hooks/useJobs.js'
import { useCompaniesSearch } from '../hooks/useCompanies.js'
import { searchService } from '../services/searchService.js'
import { FEATURES, SEARCH_CONFIG } from '../config.js'
import './SearchPage.css'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  // Search type state (jobs or companies)
  const [searchType, setSearchType] = React.useState(searchParams.get('type') || 'jobs')

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

  // Initialize company search state from URL params
  const initialCompanyFilters = {
    q: searchParams.get('q') || '',
    industry: searchParams.get('industry') || '',
    location: searchParams.get('location') || '',
    company_type: searchParams.get('company_type') || '',
    size_range: searchParams.get('size_range') || '',
    has_open_jobs: searchParams.get('has_open_jobs') === 'true',
    sort: searchParams.get('sort') || 'relevance',
    page: parseInt(searchParams.get('page')) || 1,
    size: 20
  }

  // Use the new search hooks
  const jobsSearch = useJobsSearch(initialFilters)
  const companiesSearch = useCompaniesSearch(initialCompanyFilters)

  // Get current search context based on search type
  const currentSearch = searchType === 'jobs' ? jobsSearch : companiesSearch
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
  } = currentSearch

  // Search history state
  const [searchHistory, setSearchHistory] = React.useState(null)
  const [searchHistoryLoading, setSearchHistoryLoading] = React.useState(false)

  // Company search options
  const [industryOptions, setIndustryOptions] = React.useState([{ value: '', label: 'Tất cả ngành' }])
  const [locationOptions, setLocationOptions] = React.useState([{ value: '', label: 'Tất cả địa điểm' }])
  const [companyTypeOptions] = React.useState([
    { value: '', label: 'Tất cả loại hình' },
    { value: 'Product', label: 'Product' },
    { value: 'Outsourcing', label: 'Outsourcing' },
    { value: 'Agency', label: 'Agency' },
    { value: 'Hybrid', label: 'Hybrid' }
  ])
  const [sizeOptions] = React.useState([
    { value: '', label: 'Tất cả quy mô' },
    { value: '1-10', label: '1-10', min: 1, max: 10 },
    { value: '11-50', label: '11-50', min: 11, max: 50 },
    { value: '51-200', label: '51-200', min: 51, max: 200 },
    { value: '201-500', label: '201-500', min: 201, max: 500 },
    { value: '500+', label: '500+', min: 500, max: null }
  ])

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

  // Update company search options when results change
  React.useEffect(() => {
    if (searchType === 'companies' && companiesSearch.results.length > 0) {
      const industries = new Set(companiesSearch.results.map((c) => c._source?.industry).filter(Boolean))
      setIndustryOptions([{ value: '', label: 'Tất cả ngành' }, ...Array.from(industries).map((i) => ({ value: i, label: i }))])

      const locationsMap = new Map()
      companiesSearch.results.forEach((c) => {
        const company = c._source
        if (company?.headquarters_location) {
          const key = company.headquarters_location
          locationsMap.set(key, {
            value: key,
            label: company.headquarters_location
          })
        }
      })
      setLocationOptions([{ value: '', label: 'Tất cả địa điểm' }, ...Array.from(locationsMap.values())])
    }
  }, [searchType, companiesSearch.results])

  // Handle search type change
  const handleSearchTypeChange = useCallback((newType) => {
    setSearchType(newType)
    // Reset to page 1 when switching search type
    if (newType === 'jobs') {
      jobsSearch.setFilter('page', 1)
    } else {
      companiesSearch.setFilter('page', 1)
    }
  }, [jobsSearch, companiesSearch])

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

    // Add search type
    if (searchType !== 'jobs') params.set('type', searchType)

    // Add search state based on type
    if (searchType === 'jobs') {
      // Jobs search params
      if (jobsSearch.searchState.q) params.set('q', jobsSearch.searchState.q)
      if (jobsSearch.searchState.location) params.set('location', jobsSearch.searchState.location)
      if (jobsSearch.searchState.locationId) params.set('locationId', jobsSearch.searchState.locationId)
      if (jobsSearch.searchState.jobType) params.set('jobType', jobsSearch.searchState.jobType)
      if (jobsSearch.searchState.experienceLevel !== null) params.set('experienceLevel', String(jobsSearch.searchState.experienceLevel))

      // Handle arrays (skills)
      jobsSearch.searchState.skills.forEach(skill => params.append('skills', skill))

      // Salary range
      if (jobsSearch.searchState.salaryMin !== null && jobsSearch.searchState.salaryMin !== undefined) params.set('salaryMin', String(jobsSearch.searchState.salaryMin))
      if (jobsSearch.searchState.salaryMax !== null && jobsSearch.searchState.salaryMax !== undefined) params.set('salaryMax', String(jobsSearch.searchState.salaryMax))

      // Work arrangement
      if (jobsSearch.searchState.remotePercentageMin !== null) params.set('remotePercentageMin', String(jobsSearch.searchState.remotePercentageMin))
      if (jobsSearch.searchState.flexibleHours !== null) params.set('flexibleHours', String(jobsSearch.searchState.flexibleHours))

      // Sort and pagination
      if (jobsSearch.searchState.sort !== 'relevance') params.set('sort', jobsSearch.searchState.sort)
      if (jobsSearch.searchState.page > 1) params.set('page', String(jobsSearch.searchState.page))
    } else {
      // Companies search params
      if (companiesSearch.searchState.q) params.set('q', companiesSearch.searchState.q)
      if (companiesSearch.searchState.industry) params.set('industry', companiesSearch.searchState.industry)
      if (companiesSearch.searchState.location) params.set('location', companiesSearch.searchState.location)
      if (companiesSearch.searchState.company_type) params.set('company_type', companiesSearch.searchState.company_type)
      if (companiesSearch.searchState.size_range) params.set('size_range', companiesSearch.searchState.size_range)
      if (companiesSearch.searchState.has_open_jobs) params.set('has_open_jobs', 'true')

      // Sort and pagination
      if (companiesSearch.searchState.sort !== 'relevance') params.set('sort', companiesSearch.searchState.sort)
      if (companiesSearch.searchState.page > 1) params.set('page', String(companiesSearch.searchState.page))
    }

    setSearchParams(params)
  }, [searchType, jobsSearch.searchState, companiesSearch.searchState, setSearchParams])

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

  // Handle company suggestion payload
  const handleCompanySuggestionPayload = useCallback((payload) => {
    if (!payload) return

    // For companies, we mainly handle text suggestions
    // Company payload might contain company_id or company name
    if (payload.company_id) {
      companiesSearch.setFilter('q', payload.text || '')
    }

    // Trigger search immediately
    try {
      companiesSearch.applyFilters()
    } catch (e) {
      // fallback: nothing
    }
  }, [companiesSearch])

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
        <h1>{searchType === 'jobs' ? 'Tìm việc' : 'Tìm công ty'}</h1>
        <div className="search-type-toggle">
          <button
            className={`search-type-btn ${searchType === 'jobs' ? 'active' : ''}`}
            onClick={() => handleSearchTypeChange('jobs')}
            type="button"
          >
            🔍 Tìm việc làm
          </button>
          <button
            className={`search-type-btn ${searchType === 'companies' ? 'active' : ''}`}
            onClick={() => handleSearchTypeChange('companies')}
            type="button"
          >
            🏢 Tìm công ty
          </button>
        </div>
          <button
            type="button"
            className={`clear-all-button ${(searchState.q || searchState.location || hasActiveFilters) ? '' : 'hidden'}`}
            onClick={handleClearAll}
            disabled={loading}
          >
            <svg
              className="clear-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Đặt lại
          </button>
        </div>
        <SearchBar
          value={searchState.q}
          onChange={handleSearchChange}
          placeholder={searchType === 'jobs' ? "Tìm kiếm vị trí, công ty, kỹ năng..." : "Tìm kiếm công ty, ngành nghề, địa điểm..."}
          loading={loading}
          showSuggestions={FEATURES.ENABLE_SEARCH_SUGGESTIONS}
          onSelectPayload={searchType === 'jobs' ? handleSuggestionPayload : handleCompanySuggestionPayload}
          userContext={userContext}
          onClear={handleClearAll}
          backendHistory={searchHistory}
          onRemoveHistoryEntry={handleRemoveHistoryEntry}
          onClearAllHistory={handleClearAllHistory}
          searchHistoryLoading={searchHistoryLoading}
        />
      </div>

      <div className="search-content">
        <aside className="search-sidebar">
          {searchType === 'jobs' ? (
            <JobFiltersSidebar
              filters={jobsSearch.searchState}
              onFilterChange={(filterKey, value) => jobsSearch.setFilter(filterKey, value)}
              showAdvancedFilters={FEATURES.ENABLE_ADVANCED_SEARCH}
            />
          ) : (
            <CompanyFilters
              filters={companiesSearch.searchState}
              onChange={(partial) => companiesSearch.setFilters(partial)}
              onApply={companiesSearch.applyFilters}
              onClear={companiesSearch.resetFilters}
              sizeOptions={sizeOptions}
              industryOptions={industryOptions}
              locationOptions={locationOptions}
              companyTypeOptions={companyTypeOptions}
            />
          )}
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
