// Unit tests for matchingService

import { matchingService } from '../matchingService'

// Mock the api module
jest.mock('../../lib/api', () => ({
  api: {
    get: jest.fn()
  }
}))

import { api } from '../../lib/api'

const mockApiResponse = (data) => ({ data })

describe('matchingService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCandidatesForJob', () => {
    test('should call api.get with job ID and default parameters', async () => {
      const jobId = 'job-123'

      const mockResponse = mockApiResponse({
        jobId: 'job-123',
        total: 25,
        candidates: [
          { id: 'cand-1', score_percent: 85, explanation: { skills: 'match' } },
          { id: 'cand-2', score_percent: 72, explanation: { experience: 'match' } }
        ]
      })

      api.get.mockResolvedValue(mockResponse)

      const result = await matchingService.getCandidatesForJob(jobId)

      expect(api.get).toHaveBeenCalledWith('/api/matching/job/job-123/candidates?size=50')
      expect(result).toEqual({
        jobId: 'job-123',
        total: 25,
        candidates: [
          { id: 'cand-1', score_percent: 85, explanation: { skills: 'match' } },
          { id: 'cand-2', score_percent: 72, explanation: { experience: 'match' } }
        ]
      })
    })

    test('should call api.get with custom size', async () => {
      const jobId = 'job-456'
      const filters = { size: 20 }

      const mockResponse = mockApiResponse({
        jobId: 'job-456',
        total: 12,
        candidates: []
      })

      api.get.mockResolvedValue(mockResponse)

      await matchingService.getCandidatesForJob(jobId, filters)

      expect(api.get).toHaveBeenCalledWith('/api/matching/job/job-456/candidates?size=20')
    })

    test('should handle additional filter parameters', async () => {
      const jobId = 'job-789'
      const filters = {
        size: 30,
        filters: {
          min_score: 70,
          location: 'hanoi'
        }
      }

      const mockResponse = mockApiResponse({
        jobId: 'job-789',
        total: 8,
        candidates: []
      })

      api.get.mockResolvedValue(mockResponse)

      await matchingService.getCandidatesForJob(jobId, filters)

      expect(api.get).toHaveBeenCalledWith('/api/matching/job/job-789/candidates?size=30&min_score=70&location=hanoi')
    })
  })

  describe('getJobsForProfile', () => {
    test('should call api.get with profile ID', async () => {
      const profileId = 'prof-123'

      const mockResponse = mockApiResponse({
        profileId: 'prof-123',
        total: 18,
        jobs: [
          { id: 'job-1', score_percent: 88, explanation: { skills: 'perfect' } },
          { id: 'job-2', score_percent: 76, explanation: { location: 'nearby' } }
        ]
      })

      api.get.mockResolvedValue(mockResponse)

      const result = await matchingService.getJobsForProfile(profileId)

      expect(api.get).toHaveBeenCalledWith('/api/matching/profile/prof-123/jobs?size=50')
      expect(result).toEqual({
        profileId: 'prof-123',
        total: 18,
        jobs: [
          { id: 'job-1', score_percent: 88, explanation: { skills: 'perfect' } },
          { id: 'job-2', score_percent: 76, explanation: { location: 'nearby' } }
        ]
      })
    })

    test('should handle custom filters', async () => {
      const profileId = 'prof-456'
      const filters = {
        size: 15,
        filters: {
          salary_min: 2000,
          job_type: 'full_time'
        }
      }

      const mockResponse = mockApiResponse({
        profileId: 'prof-456',
        total: 5,
        jobs: []
      })

      api.get.mockResolvedValue(mockResponse)

      await matchingService.getJobsForProfile(profileId, filters)

      expect(api.get).toHaveBeenCalledWith('/api/matching/profile/prof-456/jobs?size=15&salary_min=2000&job_type=full_time')
    })
  })

  describe('error handling', () => {
    test('getCandidatesForJob should handle API errors', async () => {
      const mockError = new Error('Server Error')
      mockError.status = 500

      api.get.mockRejectedValue(mockError)

      await expect(matchingService.getCandidatesForJob('job-123')).rejects.toThrow('Server Error')
    })

    test('getJobsForProfile should handle network errors', async () => {
      const networkError = new Error('Connection failed')
      networkError.cause = new Error('Network timeout')

      api.get.mockRejectedValue(networkError)

      await expect(matchingService.getJobsForProfile('prof-123')).rejects.toThrow('Connection failed')
    })
  })
})
