/**
 * Centralized API client for the job portal frontend
 * Provides a consistent interface for all API calls with built-in error handling,
 * authentication, retry logic, and rate limiting support.
 */

import { api } from '../lib/api.js'

// Re-export core API methods with additional error handling
export const apiClient = {
  // Core HTTP methods
  get: async (url, options = {}) => {
    try {
      return await api.get(url, options)
    } catch (error) {
      return handleApiError(error, 'GET', url)
    }
  },

  post: async (url, data, options = {}) => {
    try {
      return await api.post(url, data, options)
    } catch (error) {
      return handleApiError(error, 'POST', url)
    }
  },

  put: async (url, data, options = {}) => {
    try {
      return await api.put(url, data, options)
    } catch (error) {
      return handleApiError(error, 'PUT', url)
    }
  },

  patch: async (url, data, options = {}) => {
    try {
      return await api.patch(url, data, options)
    } catch (error) {
      return handleApiError(error, 'PATCH', url)
    }
  },

  delete: async (url, options = {}) => {
    try {
      return await api.del(url, options)
    } catch (error) {
      return handleApiError(error, 'DELETE', url)
    }
  },

  // Raw request method not available (internal implementation)
}

/**
 * Handle API errors with user-friendly messages and special handling for rate limits
 */
function handleApiError(error, method, url) {
  // Handle rate limiting (429 status)
  if (error.status === 429) {
    const userMessage = 'You\'re searching too fast. Please wait a moment and try again.'
    const enhancedError = new Error(userMessage)
    enhancedError.status = 429
    enhancedError.originalError = error
    enhancedError.retryAfter = error.data?.retryAfter || 60 // Default 60 seconds
    throw enhancedError
  }

  // Handle authentication errors
  if (error.status === 401) {
    const userMessage = 'Your session has expired. Please log in again.'
    const enhancedError = new Error(userMessage)
    enhancedError.status = 401
    enhancedError.originalError = error
    throw enhancedError
  }

  // Handle network errors
  if (error.cause) {
    const userMessage = 'Unable to connect to the server. Please check your internet connection and try again.'
    const enhancedError = new Error(userMessage)
    enhancedError.status = 0
    enhancedError.originalError = error
    throw enhancedError
  }

  // Re-throw other errors with original message
  throw error
}

/**
 * Utility to build query strings safely
 */
export const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        searchParams.append(key, value.join(','))
      } else {
        searchParams.append(key, String(value))
      }
    }
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

/**
 * Debounce utility for search inputs
 */
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export default apiClient
