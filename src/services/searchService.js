import { api } from '../lib/api.js'
import { swrFetch } from './cache.js'

/**
 * Search Service
 * Handles all search-related API calls to the backend
 */

// Build query string from filters object - updated to match backend DTO
function buildSearchQueryString(filters = {}) {
  const params = new URLSearchParams()

  // Pagination
  if (filters.page !== undefined && filters.page !== null) {
    const pageNum = parseInt(String(filters.page), 10)
    if (!isNaN(pageNum) && pageNum > 0) {
      params.append('page', String(pageNum))
    }
  }
  if (filters.size !== undefined && filters.size !== null) {
    const sizeNum = parseInt(String(filters.size), 10)
    if (!isNaN(sizeNum) && sizeNum > 0) {
      params.append('size', String(sizeNum))
    }
  }

  // Search query
  if (filters.q) params.append('q', filters.q)

  // Location
  if (filters.location) params.append('location', filters.location)
  if (filters.locationId) params.append('locationId', filters.locationId)

  // Job type
  if (filters.jobType) params.append('jobType', filters.jobType)

  // Experience level
  if (filters.experienceLevel !== undefined && filters.experienceLevel !== null) {
    const expNum = parseInt(String(filters.experienceLevel), 10)
    if (!isNaN(expNum) && expNum >= 0 && expNum <= 50) {
      params.append('experienceLevel', String(expNum))
    }
  }

  // Skills - now as repeated params to match backend array support
  if (filters.skills && Array.isArray(filters.skills) && filters.skills.length > 0) {
    filters.skills.forEach(skill => {
      if (skill && typeof skill === 'string' && skill.trim()) {
        params.append('skills', skill.trim())
      }
    })
  }

  // Salary range
  if (filters.salaryMin !== undefined && filters.salaryMin !== null) {
    const minNum = parseInt(String(filters.salaryMin), 10)
    if (!isNaN(minNum) && minNum >= 0) {
      params.append('salaryMin', String(minNum))
    }
  }
  if (filters.salaryMax !== undefined && filters.salaryMax !== null) {
    const maxNum = parseInt(String(filters.salaryMax), 10)
    if (!isNaN(maxNum) && maxNum >= 0) {
      params.append('salaryMax', String(maxNum))
    }
  }

  // Job categories - repeated params
  if (filters.jobCategories && Array.isArray(filters.jobCategories) && filters.jobCategories.length > 0) {
    filters.jobCategories.forEach(category => {
      if (category && typeof category === 'string' && category.trim()) {
        params.append('jobCategories', category.trim())
      }
    })
  }

  // Job benefits - repeated params
  if (filters.jobBenefits && Array.isArray(filters.jobBenefits) && filters.jobBenefits.length > 0) {
    filters.jobBenefits.forEach(benefit => {
      if (benefit && typeof benefit === 'string' && benefit.trim()) {
        params.append('jobBenefits', benefit.trim())
      }
    })
  }

  // Remote percentage
  if (filters.remotePercentageMin !== undefined && filters.remotePercentageMin !== null) {
    const remoteNum = parseInt(String(filters.remotePercentageMin), 10)
    if (!isNaN(remoteNum) && remoteNum >= 0 && remoteNum <= 100) {
      params.append('remotePercentageMin', String(remoteNum))
    }
  }

  // Flexible hours
  if (filters.flexibleHours !== undefined && filters.flexibleHours !== null) {
    params.append('flexibleHours', String(filters.flexibleHours))
  }

  // Sort
  if (filters.sort && typeof filters.sort === 'string') {
    const validSorts = ['relevance', 'newest', 'oldest', 'salary_high', 'salary_low', 'experience_high', 'experience_low']
    if (validSorts.includes(filters.sort)) {
      params.append('sort', filters.sort)
    }
  }

  // Highlight
  if (filters.highlight !== undefined) {
    params.append('highlight', String(filters.highlight))
  }

  // User context for personalized search (unchanged)
  if (filters.userExperienceLevel !== undefined) {
    params.append('userExperienceLevel', String(filters.userExperienceLevel))
  }
  if (filters.userLocationId) params.append('userLocationId', filters.userLocationId)
  if (filters.userPrefersRemote !== undefined) {
    params.append('userPrefersRemote', String(filters.userPrefersRemote))
  }
  if (filters.userSkills && Array.isArray(filters.userSkills)) {
    filters.userSkills.forEach(skill => {
      if (skill && typeof skill === 'string' && skill.trim()) {
        params.append('userSkills', skill.trim())
      }
    })
  }
  if (filters.userDesiredSalaryMin !== undefined) {
    params.append('userDesiredSalaryMin', String(filters.userDesiredSalaryMin))
  }
  if (filters.userDesiredSalaryMax !== undefined) {
    params.append('userDesiredSalaryMax', String(filters.userDesiredSalaryMax))
  }

  // Recruiter context
  if (filters.recruiterId) params.append('recruiterId', filters.recruiterId)

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

// Build company search query string
function buildCompanySearchQueryString(filters = {}) {
  const params = new URLSearchParams()

  // Pagination
  if (filters.page !== undefined) {
    params.append('page', String(filters.page))
  }
  if (filters.size !== undefined) {
    params.append('size', String(filters.size))
  }

  // Search
  if (filters.q) params.append('q', filters.q)

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export const searchService = {
  /**
   * Search jobs with advanced filters
   * @param {Object} filters - Search filters including pagination, query, location, etc.
   * @returns {Promise<{total: number, took_ms: number, hits: Array}>}
   */
  searchJobs: (filters = {}) => {
    const query = buildSearchQueryString(filters)
    const url = `/api/search/jobs${query}`
    // Use SWR-like caching for search results (30 seconds cache)
    return swrFetch(url, {}, 30000)
  },

  /**
   * Get search suggestions
   * @param {Object} filters - Suggestion filters
   * @returns {Promise<{suggestions: Array}>}
   */
  getSuggestions: (filters = {}) => {
    const params = new URLSearchParams()
    params.append('q', filters.q || '')
    params.append('size', String(filters.size || 10))

    // User context for personalized suggestions
    if (filters.userLocation) params.append('userLocation', filters.userLocation)
    if (filters.userExperienceLevel !== undefined) {
      params.append('userExperienceLevel', String(filters.userExperienceLevel))
    }
    if (filters.userSkills && Array.isArray(filters.userSkills)) {
      params.append('userSkills', filters.userSkills.join(','))
    }

    return api.get(`/api/search/suggestions?${params.toString()}`)
  },

  /**
   * Log search events for analytics
   * @param {Object} event - Event data
   * @returns {Promise<void>}
   */
  logEvent: (event) => {
    return api.post('/api/search/events', event)
  },

  /**
   * Search companies
   * @param {Object} filters - Company search filters
   * @returns {Promise<{total: number, hits: Array, took_ms: number}>}
   */
  searchCompanies: (filters = {}) => {
    const query = buildCompanySearchQueryString(filters)
    return api.get(`/api/search/companies${query}`)
  },

  /**
   * Get company suggestions
   * @param {Object} filters - Suggestion filters
   * @returns {Promise<{suggestions: Array}>}
   */
  getCompanySuggestions: (filters = {}) => {
    const params = new URLSearchParams()
    params.append('q', filters.q || '')
    params.append('size', String(filters.size || 10))
    return api.get(`/api/search/companies/suggestions?${params.toString()}`)
  },

  /**
   * Get popular companies
   * @param {Object} filters - Filters for popular companies
   * @returns {Promise<{total: number, hits: Array, took_ms: number}>}
   */
  getPopularCompanies: (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.page) params.append('page', String(filters.page))
    if (filters.size) params.append('size', String(filters.size))
    const query = params.toString()
    return api.get(`/api/search/companies/popular${query ? `?${query}` : ''}`)
  },

  /**
   * Get popular queries
   * @param {Object} filters - Filters for popular queries
   * @returns {Promise<Array>}
   */
  getPopularQueries: (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.days) params.append('days', String(filters.days))
    if (filters.limit) params.append('limit', String(filters.limit))
    const query = params.toString()
    const url = `/api/search/popular-queries${query ? `?${query}` : ''}`
    // Cache popular queries for 5 minutes since they don't change frequently
    return swrFetch(url, {}, 300000)
  },

  /**
   * Get recently viewed jobs
   * @param {Object} filters - Pagination and filters
   * @returns {Promise<Array>}
   */
  getRecentlyViewedJobs: (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.page) params.append('page', String(filters.page))
    if (filters.size) params.append('size', String(filters.size))
    const query = params.toString()
    return api.get(`/api/search/jobs/recently-viewed${query ? `?${query}` : ''}`)
  },

  /**
   * Get recently viewed stats
   * @returns {Promise<Object>}
   */
  getRecentlyViewedStats: () => {
    return api.get('/api/search/jobs/recently-viewed/stats')
  },

  /**
   * Clear recently viewed jobs history
   * @returns {Promise<void>}
   */
  clearRecentlyViewed: () => {
    return api.del('/api/search/jobs/recently-viewed')
  },

  /**
   * Get recent searches
   * @param {Object} filters - Pagination and filters
   * @returns {Promise<Array>}
   */
  getRecentSearches: (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.page) params.append('page', String(filters.page))
    if (filters.size) params.append('size', String(filters.size))
    const query = params.toString()
    return api.get(`/api/search/recent${query ? `?${query}` : ''}`)
  },

  /**
   * Delete a recent search
   * @param {string} id - Search ID to delete
   * @returns {Promise<void>}
   */
  deleteRecentSearch: (id) => {
    return api.del(`/api/search/recent/${id}`)
  },

  /**
   * Clear all recent searches
   * @returns {Promise<void>}
   */
  clearRecentSearches: () => {
    return api.del('/api/search/recent')
  }
}
