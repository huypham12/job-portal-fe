// Unit tests for useJobsSearch hook
// Tests the search state management and API integration

import { renderHook, act, waitFor } from '@testing-library/react'
import { useJobsSearch } from '../useJobs.js'

// Mock the dependencies
jest.mock('../../services/searchService.js', () => ({
  searchService: {
    searchJobs: jest.fn()
  }
}))

jest.mock('../../services/apiClient.js', () => ({
  debounce: jest.fn((fn) => fn) // Mock debounce to execute immediately
}))

import { searchService } from '../../services/searchService.js'

const mockSearchJobs = searchService.searchJobs

describe('useJobsSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSearchJobs.mockResolvedValue({
      total: 0,
      took_ms: 0,
      hits: []
    })
  })

  test('should initialize with default state', () => {
    const { result } = renderHook(() => useJobsSearch())

    expect(result.current.searchState).toEqual({
      q: '',
      location: '',
      locationId: null,
      jobType: '',
      experienceLevel: null,
      skills: [],
      salaryMin: null,
      salaryMax: null,
      jobCategories: [],
      jobBenefits: [],
      remotePercentageMin: null,
      flexibleHours: null,
      sort: 'relevance',
      page: 1,
      size: 20,
      highlight: true,
      userExperienceLevel: null,
      userLocationId: null,
      userPrefersRemote: null,
      userSkills: [],
      userDesiredSalaryMin: null,
      userDesiredSalaryMax: null,
      recruiterId: null
    })
  })

  test('should initialize with provided filters', () => {
    const initialFilters = {
      q: 'developer',
      location: 'hanoi',
      skills: ['javascript', 'react']
    }

    const { result } = renderHook(() => useJobsSearch(initialFilters))

    expect(result.current.searchState.q).toBe('developer')
    expect(result.current.searchState.location).toBe('hanoi')
    expect(result.current.searchState.skills).toEqual(['javascript', 'react'])
  })

  test('should update filter and reset page', () => {
    const { result } = renderHook(() => useJobsSearch())

    act(() => {
      result.current.setFilter('q', 'frontend')
      result.current.setFilter('page', 3) // Set page to 3
      result.current.setFilter('location', 'hanoi') // This should reset page to 1
    })

    expect(result.current.searchState.q).toBe('frontend')
    expect(result.current.searchState.location).toBe('hanoi')
    expect(result.current.searchState.page).toBe(1) // Should be reset
  })

  test('should update multiple filters at once', () => {
    const { result } = renderHook(() => useJobsSearch())

    act(() => {
      result.current.setFilters({
        q: 'developer',
        jobType: 'full_time',
        page: 2 // This should be preserved
      })
    })

    expect(result.current.searchState.q).toBe('developer')
    expect(result.current.searchState.jobType).toBe('full_time')
    expect(result.current.searchState.page).toBe(2)
  })

  test('should reset filters to defaults', () => {
    const { result } = renderHook(() => useJobsSearch({
      q: 'developer',
      location: 'hanoi'
    }))

    act(() => {
      result.current.resetFilters()
    })

    expect(result.current.searchState.q).toBe('')
    expect(result.current.searchState.location).toBe('')
  })

  test('should compute active filters correctly', () => {
    const { result } = renderHook(() => useJobsSearch())

    act(() => {
      result.current.setFilters({
        q: 'developer',
        location: 'hanoi',
        skills: ['javascript'],
        salaryMin: 1000000
      })
    })

    expect(result.current.hasActiveFilters).toBe(true)
    expect(result.current.activeFilterCount).toBe(4)
  })

  test('should call search API when filters change', async () => {
    mockSearchJobs.mockResolvedValue({
      total: 25,
      took_ms: 15,
      hits: [{ id: 'job-1', _source: { title: 'Developer' } }]
    })

    const { result } = renderHook(() => useJobsSearch())

    act(() => {
      result.current.setFilter('q', 'developer')
    })

    await waitFor(() => {
      expect(mockSearchJobs).toHaveBeenCalledWith({
        q: 'developer',
        location: '',
        locationId: null,
        jobType: '',
        experienceLevel: null,
        skills: [],
        salaryMin: null,
        salaryMax: null,
        jobCategories: [],
        jobBenefits: [],
        remotePercentageMin: null,
        flexibleHours: null,
        sort: 'relevance',
        page: 1,
        size: 20,
        highlight: true,
        userExperienceLevel: null,
        userLocationId: null,
        userPrefersRemote: null,
        userSkills: [],
        userDesiredSalaryMin: null,
        userDesiredSalaryMax: null,
        recruiterId: null
      })
    })

    expect(result.current.results).toEqual([{ id: 'job-1', _source: { title: 'Developer' } }])
    expect(result.current.total).toBe(25)
    expect(result.current.took).toBe(15)
  })

  test('should handle search errors', async () => {
    const mockError = new Error('Search failed')
    mockSearchJobs.mockRejectedValue(mockError)

    const { result } = renderHook(() => useJobsSearch())

    act(() => {
      result.current.setFilter('q', 'developer')
    })

    await waitFor(() => {
      expect(result.current.error).toBe('Có lỗi xảy ra khi tìm kiếm')
      expect(result.current.results).toEqual([])
    })
  })

  test('should navigate pages correctly', () => {
    const { result } = renderHook(() => useJobsSearch())

    act(() => {
      result.current.goToPage(3)
    })

    expect(result.current.searchState.page).toBe(3)

    act(() => {
      result.current.nextPage()
    })

    expect(result.current.searchState.page).toBe(4)

    act(() => {
      result.current.prevPage()
    })

    expect(result.current.searchState.page).toBe(3)
  })

  test('should not navigate to invalid pages', () => {
    const { result } = renderHook(() => useJobsSearch())

    act(() => {
      result.current.goToPage(0) // Invalid page
    })

    expect(result.current.searchState.page).toBe(1) // Should stay at 1

    act(() => {
      result.current.prevPage() // Try to go below 1
    })

    expect(result.current.searchState.page).toBe(1) // Should stay at 1
  })
})
