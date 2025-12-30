import { api } from '../lib/api.js'

/**
 * Matching Service
 * Handles candidate-job matching functionality
 */

export const matchingService = {
  /**
   * Get candidates that match a specific job
   * @param {string} jobId - Job ID to match candidates for
   * @param {Object} filters - Optional matching filters
   * @returns {Promise<{jobId: string, total: number, candidates: Array}>}
   */
  getCandidatesForJob: (jobId, filters = {}) => {
    const params = new URLSearchParams()
    if (filters.size) params.append('size', String(filters.size))
    if (filters.filters) {
      // Add any additional filters as needed
      Object.entries(filters.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
    }

    const query = params.toString()
    return api.get(`/api/matching/job/${jobId}/candidates${query ? `?${query}` : ''}`)
  },

  /**
   * Get jobs that match a candidate's profile
   * @param {string} profileId - Profile ID to match jobs for
   * @param {Object} filters - Optional matching filters
   * @returns {Promise<{profileId: string, total: number, jobs: Array}>}
   */
  getJobsForProfile: (profileId, filters = {}) => {
    const params = new URLSearchParams()
    if (filters.size) params.append('size', String(filters.size))
    if (filters.filters) {
      // Add any additional filters as needed
      Object.entries(filters.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
    }

    const query = params.toString()
    return api.get(`/api/matching/profile/${profileId}/jobs${query ? `?${query}` : ''}`)
  }
}
