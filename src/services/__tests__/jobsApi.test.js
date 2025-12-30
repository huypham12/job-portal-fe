// Basic unit tests for jobsApi
// Note: This is a basic test structure. In a real project,
// you'd use Jest, Vitest, or similar testing framework

import { jobsApi, skillsApi, categoriesApi } from '../jobsApi'

// Mock the api module
jest.mock('../../lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    del: jest.fn(),
  }
}))

import { api } from '../../lib/api'

const mockApiResponse = (data) => ({ data })

describe('jobsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createJob', () => {
    test('should call api.post with correct payload', async () => {
      const mockJobData = {
        title: 'Test Job',
        description: 'Test description',
        company_id: '123e4567-e89b-12d3-a456-426614174000',
        skill_ids: ['456e7890-e89b-12d3-a456-426614174001'],
        category_ids: ['789e0123-e89b-12d3-a456-426614174002']
      }
      const mockResponse = mockApiResponse({ id: 'job-123', title: 'Test Job' })

      api.post.mockResolvedValue(mockResponse)

      const result = await jobsApi.createJob(mockJobData)

      expect(api.post).toHaveBeenCalledWith('/api/jobs', mockJobData)
      expect(result).toEqual({ id: 'job-123', title: 'Test Job' })
    })

    test('should handle API errors', async () => {
      const mockError = new Error('API Error')
      mockError.status = 400
      mockError.data = { message: 'Validation failed' }

      api.post.mockRejectedValue(mockError)

      await expect(jobsApi.createJob({})).rejects.toThrow('API Error')
    })
  })

  describe('getMyJobs', () => {
    test('should call api.get with correct query string', async () => {
      const params = { page: 1, limit: 10, status: 'draft' }
      const mockResponse = mockApiResponse({
        data: [{ id: 'job-1', title: 'Job 1' }],
        pagination: { page: 1, limit: 10, total: 1, total_pages: 1 }
      })

      api.get.mockResolvedValue(mockResponse)

      const result = await jobsApi.getMyJobs(params)

      expect(api.get).toHaveBeenCalledWith('/api/jobs/my-jobs?page=1&limit=10&status=draft')
      expect(result).toEqual({
        data: [{ id: 'job-1', title: 'Job 1' }],
        pagination: { page: 1, limit: 10, total: 1, total_pages: 1 }
      })
    })

    test('should handle empty params', async () => {
      const mockResponse = mockApiResponse({ data: [], pagination: {} })

      api.get.mockResolvedValue(mockResponse)

      const result = await jobsApi.getMyJobs()

      expect(api.get).toHaveBeenCalledWith('/api/jobs/my-jobs')
      expect(result).toEqual({ data: [], pagination: {} })
    })
  })

  describe('updateJob', () => {
    test('should call api.put with job ID and payload', async () => {
      const jobId = '123e4567-e89b-12d3-a456-426614174000'
      const updateData = { title: 'Updated Title' }
      const mockResponse = mockApiResponse({ id: jobId, title: 'Updated Title' })

      api.put.mockResolvedValue(mockResponse)

      const result = await jobsApi.updateJob(jobId, updateData)

      expect(api.put).toHaveBeenCalledWith(`/api/jobs/${jobId}`, updateData)
      expect(result).toEqual({ id: jobId, title: 'Updated Title' })
    })
  })

  describe('bulkJobActions', () => {
    test('should call api.post with bulk action payload', async () => {
      const payload = {
        action: 'close',
        job_ids: ['job-1', 'job-2']
      }
      const mockResponse = mockApiResponse({
        message: 'Successfully closed 2 job(s)',
        affected_jobs: 2
      })

      api.post.mockResolvedValue(mockResponse)

      const result = await jobsApi.bulkJobActions(payload)

      expect(api.post).toHaveBeenCalledWith('/api/jobs/bulk-actions', payload)
      expect(result).toEqual({
        message: 'Successfully closed 2 job(s)',
        affected_jobs: 2
      })
    })
  })
})

describe('skillsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('searchSkills', () => {
    test('should call api.get with search params', async () => {
      const params = { search: 'react', category: 'frontend', limit: 20 }
      const mockResponse = mockApiResponse([
        { id: 'skill-1', name: 'React', category: 'frontend' }
      ])

      api.get.mockResolvedValue(mockResponse)

      const result = await skillsApi.searchSkills(params)

      expect(api.get).toHaveBeenCalledWith('/api/skills?search=react&category=frontend&limit=20')
      expect(result).toEqual([{ id: 'skill-1', name: 'React', category: 'frontend' }])
    })
  })

  describe('getCategories', () => {
    test('should call api.get for skill categories', async () => {
      const mockResponse = mockApiResponse([
        { id: 'cat-1', name: 'Frontend', type: 'technical' }
      ])

      api.get.mockResolvedValue(mockResponse)

      const result = await skillsApi.getCategories()

      expect(api.get).toHaveBeenCalledWith('/api/skills/categories')
      expect(result).toEqual([{ id: 'cat-1', name: 'Frontend', type: 'technical' }])
    })
  })
})

describe('categoriesApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCategories', () => {
    test('should call api.get with type filter', async () => {
      const params = { type: 'industry' }
      const mockResponse = mockApiResponse([
        { id: 'cat-1', name: 'Technology', type: 'industry' }
      ])

      api.get.mockResolvedValue(mockResponse)

      const result = await categoriesApi.getCategories(params)

      expect(api.get).toHaveBeenCalledWith('/api/categories?type=industry')
      expect(result).toEqual([{ id: 'cat-1', name: 'Technology', type: 'industry' }])
    })

    test('should call api.get without params', async () => {
      const mockResponse = mockApiResponse([
        { id: 'cat-1', name: 'Technology', type: 'industry' }
      ])

      api.get.mockResolvedValue(mockResponse)

      const result = await categoriesApi.getCategories()

      expect(api.get).toHaveBeenCalledWith('/api/categories')
      expect(result).toEqual([{ id: 'cat-1', name: 'Technology', type: 'industry' }])
    })
  })

  describe('getCategoriesGrouped', () => {
    test('should call api.get for grouped categories', async () => {
      const mockResponse = mockApiResponse({
        industry: [{ id: 'cat-1', name: 'Technology' }],
        technical: [{ id: 'cat-2', name: 'Frontend' }]
      })

      api.get.mockResolvedValue(mockResponse)

      const result = await categoriesApi.getCategoriesGrouped()

      expect(api.get).toHaveBeenCalledWith('/api/categories/grouped')
      expect(result).toEqual({
        industry: [{ id: 'cat-1', name: 'Technology' }],
        technical: [{ id: 'cat-2', name: 'Frontend' }]
      })
    })
  })
})

// Note: To run these tests, you would need to set up a test runner like Jest or Vitest
// For now, these tests demonstrate the expected API contract and can be verified manually
