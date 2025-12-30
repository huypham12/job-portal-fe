/**
 * Search history utilities using localStorage
 */

const STORAGE_KEY = 'jobfinder_search_history'
const MAX_HISTORY_ITEMS = 10

export const searchHistoryUtils = {
  /**
   * Get search history from localStorage
   */
  getHistory: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.warn('Failed to get search history:', error)
      return []
    }
  },

  /**
   * Add a search term to history
   */
  addToHistory: (term) => {
    if (!term || typeof term !== 'string') return

    const trimmedTerm = term.trim()
    if (!trimmedTerm) return

    try {
      let history = searchHistoryUtils.getHistory()

      // Remove if already exists (to move to top)
      history = history.filter(item => item.term !== trimmedTerm)

      // Add to beginning
      history.unshift({
        term: trimmedTerm,
        timestamp: Date.now(),
        count: 1
      })

      // Keep only recent items
      if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS)
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    } catch (error) {
      console.warn('Failed to add to search history:', error)
    }
  },

  /**
   * Remove a search term from history
   */
  removeFromHistory: (term) => {
    try {
      let history = searchHistoryUtils.getHistory()
      history = history.filter(item => item.term !== term)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    } catch (error) {
      console.warn('Failed to remove from search history:', error)
    }
  },

  /**
   * Clear all search history
   */
  clearHistory: () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear search history:', error)
    }
  },

  /**
   * Get recent searches (last 24 hours)
   */
  getRecentSearches: (hours = 24) => {
    const history = searchHistoryUtils.getHistory()
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000)

    return history.filter(item => item.timestamp > cutoffTime)
  }
}
