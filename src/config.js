/**
 * Application configuration and feature flags
 */

// Feature flags for gradual rollout
export const FEATURES = {
  // Enable advanced search filters (salary, categories, benefits, remote options)
  ENABLE_ADVANCED_SEARCH: import.meta.env.VITE_ENABLE_ADVANCED_SEARCH === 'true' || true, // Default to true for development

  // Enable search suggestions
  ENABLE_SEARCH_SUGGESTIONS: import.meta.env.VITE_ENABLE_SEARCH_SUGGESTIONS !== 'false', // Default to true

  // Enable analytics/event logging
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS !== 'false', // Default to true

  // Enable debug mode
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true' || false
}

// Search configuration
export const SEARCH_CONFIG = {
  // Debounce delay for search input (ms)
  DEBOUNCE_DELAY: 300,

  // Default page size
  DEFAULT_PAGE_SIZE: 20,

  // Maximum page size
  MAX_PAGE_SIZE: 100,

  // Suggestion size
  SUGGESTION_SIZE: 8,

  // Cache TTL for search results (ms)
  CACHE_TTL: 30000,

  // Rate limiting
  RATE_LIMIT_DELAY: 60000, // 1 minute
  MAX_RETRIES: 1
}

// UI Configuration
export const UI_CONFIG = {
  // Breakpoints for responsive design
  BREAKPOINTS: {
    mobile: 768,
    tablet: 1024,
    desktop: 1440
  },

  // Animation durations
  ANIMATION_DURATION: {
    fast: 150,
    normal: 300,
    slow: 500
  }
}

// API Configuration
export const API_CONFIG = {
  // Base URL is handled by Vite env vars
  TIMEOUT: 30000,

  // Retry configuration
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY: 1000
}

// Validation rules
export const VALIDATION = {
  search: {
    minQueryLength: 1,
    maxQueryLength: 200
  },

  skills: {
    maxSkills: 10,
    maxSkillLength: 50
  },

  salary: {
    min: 0,
    max: 100000000, // 100M VND
    step: 1000000 // 1M VND steps
  },

  remotePercentage: {
    min: 0,
    max: 100,
    step: 10
  }
}
