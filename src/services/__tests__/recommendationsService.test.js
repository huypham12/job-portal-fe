// Unit tests for recommendationsService

import { recommendationsService } from '../recommendationsService'

// Mock the api module
jest.mock('../../lib/api', () => ({
  api: {
    get: jest.fn()
  }
}))

import { api } from '../../lib/api'

const mockApiResponse = (data) => ({ data })

describe('recommendationsService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCandidateRecommendations', () => {
    test('should call api.get with default parameters', async () => {
      const mockResponse = mockApiResponse([
        { job_id: 'job-1', score: 0.85, explanation: { skills: 'match' } },
        { job_id: 'job-2', score: 0.72, explanation: { location: 'match' } }
      ])

      api.get.mockResolvedValue(mockResponse)

      const result = await recommendationsService.getCandidateRecommendations()

      expect(api.get).toHaveBeenCalledWith('/api/search/recommendations/for-candidate')
      expect(result).toEqual([
        { job_id: 'job-1', score: 0.85, explanation: { skills: 'match' } },
        { job_id: 'job-2', score: 0.72, explanation: { location: 'match' } }
      ])
    })

    test('should call api.get with custom limit', async () => {
      const filters = { limit: 5 }

      const mockResponse = mockApiResponse([
        { job_id: 'job-1', score: 0.9 }
      ])

      api.get.mockResolvedValue(mockResponse)

      const result = await recommendationsService.getCandidateRecommendations(filters)

      expect(api.get).toHaveBeenCalledWith('/api/search/recommendations/for-candidate?limit=5')
    })

    test('should call api.get with experiment ID', async () => {
      const filters = { experimentId: 'enhanced_skills' }

      const mockResponse = mockApiResponse([])

      api.get.mockResolvedValue(mockResponse)

      await recommendationsService.getCandidateRecommendations(filters)

      expect(api.get).toHaveBeenCalledWith('/api/search/recommendations/for-candidate?experimentId=enhanced_skills')
    })
  })

  describe('getRecruiterRecommendations', () => {
    test('should call api.get with company ID', async () => {
      const filters = { companyId: 'comp-123', limit: 10 }

      const mockResponse = mockApiResponse([
        { profile_id: 'prof-1', job_id: 'job-1', score: 0.88 }
      ])

      api.get.mockResolvedValue(mockResponse)

      const result = await recommendationsService.getRecruiterRecommendations(filters)

      expect(api.get).toHaveBeenCalledWith('/api/search/recommendations/for-recruiter?companyId=comp-123&limit=10')
      expect(result).toEqual([
        { profile_id: 'prof-1', job_id: 'job-1', score: 0.88 }
      ])
    })

    test('should handle missing companyId', async () => {
      const mockResponse = mockApiResponse([])

      api.get.mockResolvedValue(mockResponse)

      const result = await recommendationsService.getRecruiterRecommendations({})

      expect(api.get).toHaveBeenCalledWith('/api/search/recommendations/for-recruiter')
      expect(result).toEqual([])
    })
  })

  describe('getJobRecommendations', () => {
    test('should call api.get with pagination', async () => {
      const filters = { page: 2, size: 15 }

      const mockResponse = mockApiResponse([
        { job_id: 'job-1', score: 0.75 }
      ])

      api.get.mockResolvedValue(mockResponse)

      await recommendationsService.getJobRecommendations(filters)

      expect(api.get).toHaveBeenCalledWith('/api/search/recommendations/jobs?page=2&size=15')
    })
  })

  describe('getForYouRecommendations', () => {
    test('should call api.get for for-you endpoint', async () => {
      const mockResponse = mockApiResponse([
        { job_id: 'job-1', score: 0.92 }
      ])

      api.get.mockResolvedValue(mockResponse)

      const result = await recommendationsService.getForYouRecommendations()

      expect(api.get).toHaveBeenCalledWith('/api/search/recommendations/jobs/for-you')
      expect(result).toEqual([
        { job_id: 'job-1', score: 0.92 }
      ])
    })
  })
})
