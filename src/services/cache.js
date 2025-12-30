/**
 * Lightweight cache service with SWR-like functionality
 * Provides caching, deduplication, and background revalidation for API calls
 */

class Cache {
  constructor() {
    this.cache = new Map()
    this.pendingRequests = new Map()
  }

  /**
   * Generate cache key from URL and params
   */
  generateKey(url, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key]
        return result
      }, {})

    return `${url}:${JSON.stringify(sortedParams)}`
  }

  /**
   * Get cached data if available and not expired
   */
  get(key, maxAge = 30000) { // 30 seconds default
    const cached = this.cache.get(key)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > maxAge) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  /**
   * Set cache data
   */
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * Clear expired cache entries
   */
  clearExpired(maxAge = 300000) { // 5 minutes default
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > maxAge) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get pending request promise to avoid duplicate requests
   */
  getPending(key) {
    return this.pendingRequests.get(key)
  }

  /**
   * Set pending request promise
   */
  setPending(key, promise) {
    this.pendingRequests.set(key, promise)
    promise.finally(() => {
      this.pendingRequests.delete(key)
    })
  }

  /**
   * Clear all cache and pending requests
   */
  clear() {
    this.cache.clear()
    this.pendingRequests.clear()
  }
}

// Global cache instance
const cache = new Cache()

// Auto-clear expired cache every 5 minutes
setInterval(() => {
  cache.clearExpired()
}, 300000)

/**
 * SWR-like fetch with caching and deduplication
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @param {number} maxAge - Cache max age in milliseconds (default: 30s)
 * @returns {Promise} Cached or fresh data
 */
export const swrFetch = async (url, options = {}, maxAge = 30000) => {
  const key = cache.generateKey(url, options)

  // Check cache first
  const cached = cache.get(key, maxAge)
  if (cached) {
    // Trigger background revalidation
    setTimeout(() => {
      fetchData(url, options, key)
    }, 0)
    return cached
  }

  // Check if request is already pending
  const pending = cache.getPending(key)
  if (pending) {
    return pending
  }

  // Make fresh request
  return fetchData(url, options, key)
}

/**
 * Make actual API request and cache result
 */
const fetchData = async (url, options, cacheKey) => {
  const { api } = await import('../lib/api.js')
  const method = options.method || 'GET'

  let promise
  if (method === 'GET') {
    promise = api.get(url, options)
  } else if (method === 'POST') {
    promise = api.post(url, options.body, options)
  } else if (method === 'PUT') {
    promise = api.put(url, options.body, options)
  } else if (method === 'PATCH') {
    promise = api.patch(url, options.body, options)
  } else if (method === 'DELETE') {
    promise = api.del(url, options)
  } else {
    throw new Error(`Unsupported method: ${method}`)
  }

  cache.setPending(cacheKey, promise)

  try {
    const result = await promise
    // Cache successful GET requests only
    if (method === 'GET') {
      cache.set(cacheKey, result)
    }
    return result
  } catch (error) {
    throw error
  }
}

/**
 * Hook-like cache utilities for React components
 */
export const useCache = () => {
  return {
    get: (key, maxAge) => cache.get(key, maxAge),
    set: (key, data) => cache.set(key, data),
    clear: () => cache.clear(),
    clearExpired: (maxAge) => cache.clearExpired(maxAge)
  }
}

/**
 * Cache statistics for debugging
 */
export const getCacheStats = () => {
  return {
    size: cache.cache.size,
    pendingRequests: cache.pendingRequests.size,
    keys: Array.from(cache.cache.keys())
  }
}

export default cache
