import { api } from '../lib/api.js'

/**
 * Recommendations Service
 * Handles personalized recommendations for candidates and recruiters
 */

export const recommendationsService = {
  /**
   * Get personalized job recommendations for authenticated candidate
   * @param {Object} filters - Optional filters for recommendations
   * @returns {Promise<Array>} Array of recommended jobs
   */
  getCandidateRecommendations: (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.limit) params.append('limit', String(filters.limit))
    if (filters.experimentId) params.append('experimentId', filters.experimentId)

    const query = params.toString()
    return api.get(`/api/search/recommendations/for-candidate${query ? `?${query}` : ''}`)
  },

  /**
   * Get candidate recommendations for recruiter
   * @param {Object} filters - Filters including companyId, limit, experimentId
   * @returns {Promise<Array>} Array of recommended candidates for jobs
   */
  getRecruiterRecommendations: (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.companyId) params.append('companyId', filters.companyId)
    if (filters.limit) params.append('limit', String(filters.limit))
    if (filters.experimentId) params.append('experimentId', filters.experimentId)

    const query = params.toString()
    return api.get(`/api/search/recommendations/for-recruiter${query ? `?${query}` : ''}`)
  },

  /**
   * Get job recommendations (alternative endpoint)
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Array of recommended jobs
   */
  getJobRecommendations: (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.page) params.append('page', String(filters.page))
    if (filters.size) params.append('size', String(filters.size))
    if (filters.experimentId) params.append('experimentId', filters.experimentId)

    const query = params.toString()
    return api.get(`/api/search/jobs/recommendations${query ? `?${query}` : ''}`)
  },

  /**
   * Get "For You" personalized recommendations
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Array of recommended jobs
   */
  getForYouRecommendations: (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.page) params.append('page', String(filters.page))
    if (filters.size) params.append('size', String(filters.size))
    if (filters.experimentId) params.append('experimentId', filters.experimentId)

    const query = params.toString()
    return api.get(`/api/search/jobs/recommendations/for-you${query ? `?${query}` : ''}`)
  }
}
