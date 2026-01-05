import { useState, useCallback, useEffect, useMemo } from "react";
import { searchService } from "../services/searchService.js";
import { debounce } from "../services/apiClient.js";

/**
 * Centralized hook for company search functionality
 * Matches backend search DTO and provides URL sync
 */
export function useCompaniesSearch(initialFilters = {}) {
  // Default search state matching backend DTO
  const defaultState = {
    q: "",
    industry: "",
    location: "",
    size_min: null,
    size_max: null,
    company_type: "",
    sort: "relevance",
    page: 1,
    size: 20,
    has_open_jobs: false,
    // Recruiter context
    recruiterId: null,
  };

  const [searchState, setSearchState] = useState({
    ...defaultState,
    ...initialFilters,
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [took, setTook] = useState(0);

  // Debounced search function (300ms delay for q input)
  const performSearch = useCallback(
    debounce(async (state) => {
      setLoading(true);
      setError(null);

      try {
        const response = await searchService.searchCompanies(state);
        setResults(response.hits || []);
        setTotal(response.total || 0);
        setTook(response.took_ms || 0);
      } catch (err) {
        console.error("Company search failed:", err);
        setError(err.message || "Có lỗi xảy ra khi tìm kiếm công ty");
        setResults([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  // Update single filter field
  const setFilter = useCallback((field, value) => {
    setSearchState((prev) => ({
      ...prev,
      [field]: value,
      page: field === "page" ? value : 1, // Reset to page 1 unless updating page itself
    }));
  }, []);

  // Update multiple filters at once
  const setFilters = useCallback((updates) => {
    setSearchState((prev) => ({
      ...prev,
      ...updates,
      page: updates.page !== undefined ? updates.page : 1, // Reset to page 1 unless page is explicitly set
    }));
  }, []);

  // Reset all filters to defaults
  const resetFilters = useCallback(() => {
    setSearchState(defaultState);
  }, []);

  // Apply current filters (trigger search)
  const applyFilters = useCallback(() => {
    performSearch(searchState);
  }, [searchState, performSearch]);

  // Navigation helpers
  const goToPage = useCallback(
    (page) => {
      if (page >= 1) {
        setFilter("page", page);
      }
    },
    [setFilter]
  );

  const nextPage = useCallback(() => {
    const maxPage = Math.ceil(total / searchState.size);
    if (searchState.page < maxPage) {
      goToPage(searchState.page + 1);
    }
  }, [searchState.page, searchState.size, total, goToPage]);

  const prevPage = useCallback(() => {
    if (searchState.page > 1) {
      goToPage(searchState.page - 1);
    }
  }, [searchState.page, goToPage]);

  // Auto-search when filters change (including debounced q input)
  useEffect(() => {
    const shouldSearchFilters =
      searchState.industry ||
      searchState.location ||
      searchState.company_type ||
      searchState.size_min ||
      searchState.size_max ||
      searchState.has_open_jobs ||
      searchState.sort !== "relevance";

    // If there's a non-empty q (user typed or selected suggestion), trigger debounced search.
    if (searchState.q && String(searchState.q).trim().length > 0) {
      performSearch(searchState);
    } else if (shouldSearchFilters) {
      performSearch(searchState);
    } else if (results.length > 0) {
      // Clear results if no active filters and no q
      setResults([]);
      setTotal(0);
      setTook(0);
    }
  }, [
    // include q so selecting suggestions or typing triggers the debounced search
    searchState.q,
    searchState.industry,
    searchState.location,
    searchState.company_type,
    searchState.size_min,
    searchState.size_max,
    searchState.has_open_jobs,
    searchState.sort,
    searchState.page,
    searchState.size,
    performSearch,
  ]);

  // Manual search trigger (for q input)
  const search = useCallback(() => {
    performSearch(searchState);
  }, [searchState, performSearch]);

  // Computed values
  const hasActiveFilters = useMemo(() => {
    return (
      searchState.industry ||
      searchState.location ||
      searchState.company_type ||
      searchState.size_min ||
      searchState.size_max ||
      searchState.has_open_jobs ||
      searchState.sort !== "relevance"
    );
  }, [searchState]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchState.industry) count++;
    if (searchState.location) count++;
    if (searchState.company_type) count++;
    if (searchState.size_min || searchState.size_max) count++;
    if (searchState.has_open_jobs) count++;
    if (searchState.sort !== "relevance") count++;
    return count;
  }, [searchState]);

  return {
    // State
    searchState,
    results,
    loading,
    error,
    total,
    took,
    hasActiveFilters,
    activeFilterCount,

    // Actions
    setFilter,
    setFilters,
    resetFilters,
    applyFilters,
    search,
    goToPage,
    nextPage,
    prevPage,

    // Utilities
    performSearch: () => performSearch(searchState),
  };
}
