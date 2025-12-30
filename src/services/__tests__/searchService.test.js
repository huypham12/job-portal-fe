// Unit tests for searchService
// Tests the search API integration and data transformation

import { searchService } from '../searchService'

// Mock the api module
jest.mock('../../lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  }
}))

import { api } from '../../lib/api'

const mockApiResponse = (data) => ({ data })

describe('searchService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('searchJobs', () => {
    test('should call api.get with correct search parameters', async () => {
      const filters = {
        q: 'frontend developer',
        location: 'hanoi',
        jobType: 'full_time',
        experienceLevel: '2',
        page: 1,
        size: 20
      }

      const mockResponse = mockApiResponse({
        total: 150,
        took_ms: 45,
        hits: [
          { id: 'job-1', _source: { title: 'Frontend Developer', company_name: 'Tech Corp' } },
          { id: 'job-2', _source: { title: 'Senior Frontend Dev', company_name: 'Startup Inc' } }
        ]
      })

      api.get.mockResolvedValue(mockResponse)

      const result = await searchService.searchJobs(filters)

      expect(api.get).toHaveBeenCalledWith('/api/search/jobs?q=frontend%20developer&location=hanoi&jobType=full_time&experienceLevel=2&page=1&size=20')
      expect(result).toEqual({
        total: 150,
        took_ms: 45,
        hits: [
          { id: 'job-1', _source: { title: 'Frontend Developer', company_name: 'Tech Corp' } },
          { id: 'job-2', _source: { title: 'Senior Frontend Dev', company_name: 'Startup Inc' } }
        ]
      })
    })

    test('should handle empty filters', async () => {
      const mockResponse = mockApiResponse({
        total: 0,
        took_ms: 12,
        hits: []
      })

      api.get.mockResolvedValue(mockResponse)

      const result = await searchService.searchJobs({})

      expect(api.get).toHaveBeenCalledWith('/api/search/jobs')
      expect(result).toEqual({
        total: 0,
        took_ms: 12,
        hits: []
      })
    })

    test('should handle skills array parameter as repeated params', async () => {
      const filters = {
        skills: ['react', 'typescript', 'css']
      }

      const mockResponse = mockApiResponse({
        total: 75,
        took_ms: 28,
        hits: []
      })

      api.get.mockResolvedValue(mockResponse)

      const result = await searchService.searchJobs(filters)

      expect(api.get).toHaveBeenCalledWith('/api/search/jobs?skills=react&skills=typescript&skills=css')
    })

    test('should handle new filter parameters', async () => {
      const filters = {
        q: 'developer',
        salaryMin: 1000000,
        salaryMax: 3000000,
        jobCategories: ['technology', 'engineering'],
        jobBenefits: ['health_insurance', 'remote_work'],
        remotePercentageMin: 50,
        flexibleHours: true,
        sort: 'salary_high',
        page: 1,
        size: 20
      }

      const mockResponse = mockApiResponse({
        total: 45,
        took_ms: 32,
        hits: []
      })

      api.get.mockResolvedValue(mockResponse)

      const result = await searchService.searchJobs(filters)

      expect(api.get).toHaveBeenCalledWith('/api/search/jobs?q=developer&salaryMin=1000000&salaryMax=3000000&jobCategories=technology&jobCategories=engineering&jobBenefits=health_insurance&jobBenefits=remote_work&remotePercentageMin=50&flexibleHours=true&sort=salary_high&page=1&size=20')
    })
  })

  describe('getSuggestions', () => {
    test('should call api.get with query parameter', async () => {
      const filters = { q: 'front' }

      const mockResponse = mockApiResponse({
        suggestions: [
          { text: 'frontend developer', score: 0.95 },
          { text: 'frontend engineer', score: 0.88 }
        ]
      })

      api.get.mockResolvedValue(mockResponse)

      const result = await searchService.getSuggestions(filters)

      expect(api.get).toHaveBeenCalledWith('/api/search/suggestions?q=front&size=10')
      expect(result).toEqual({
        suggestions: [
          { text: 'frontend developer', score: 0.95 },
          { text: 'frontend engineer', score: 0.88 }
        ]
      })
    })

    test('should handle custom size parameter', async () => {
      const filters = { q: 'dev', size: 5 }

      const mockResponse = mockApiResponse({
        suggestions: []
      })

      api.get.mockResolvedValue(mockResponse)

      await searchService.getSuggestions(filters)

      expect(api.get).toHaveBeenCalledWith('/api/search/suggestions?q=dev&size=5')
    })
  })

  describe('logEvent', () => {
    test('should call api.post with event data', async () => {
      const eventData = {
        event_type: 'impression',
        job_id: 'job-123',
        query: 'frontend',
        position: 1,
        filters: { location: 'hanoi' },
        result_count: 50,
        timestamp_ms: Date.now()
      }

      const mockResponse = mockApiResponse({ success: true })

      api.post.mockResolvedValue(mockResponse)

      const result = await searchService.logEvent(eventData)

      expect(api.post).toHaveBeenCalledWith('/api/search/events', eventData)
      expect(result).toEqual({ success: true })
    })
  })

  describe('searchCompanies', () => {
    test('should call api.get with company search parameters', async () => {
      const filters = { q: 'tech corp', page: 1, size: 10 }

      const mockResponse = mockApiResponse({
        total: 25,
        hits: [
          { id: 'comp-1', name: 'Tech Corp', industry: 'Technology' }
        ],
        took_ms: 15
      })

      api.get.mockResolvedValue(mockResponse)

      const result = await searchService.searchCompanies(filters)

      expect(api.get).toHaveBeenCalledWith('/api/search/companies?q=tech%20corp&page=1&size=10')
      expect(result).toEqual({
        total: 25,
        hits: [
          { id: 'comp-1', name: 'Tech Corp', industry: 'Technology' }
        ],
        took_ms: 15
      })
    })
  })

  describe('getPopularQueries', () => {
    test('should call api.get with analytics parameters', async () => {
      const filters = { days: 7, limit: 10 }

      const mockResponse = mockApiResponse([
        { search_query: 'frontend developer', search_count: 150 },
        { search_query: 'backend engineer', search_count: 120 }
      ])

      api.get.mockResolvedValue(mockResponse)

      const result = await searchService.getPopularQueries(filters)

      expect(api.get).toHaveBeenCalledWith('/api/search/popular-queries?days=7&limit=10')
      expect(result).toEqual([
        { search_query: 'frontend developer', search_count: 150 },
        { search_query: 'backend engineer', search_count: 120 }
      ])
    })
  })

  describe('error handling', () => {
    test('should propagate API errors', async () => {
      const mockError = new Error('API Error')
      mockError.status = 500

      api.get.mockRejectedValue(mockError)

      await expect(searchService.searchJobs({ q: 'test' })).rejects.toThrow('API Error')
    })

    test('should handle network errors', async () => {
      const networkError = new Error('Network Error')
      networkError.cause = new Error('Connection failed')

      api.get.mockRejectedValue(networkError)

      await expect(searchService.getSuggestions({ q: 'test' })).rejects.toThrow('Network Error')
    })
  })
})
