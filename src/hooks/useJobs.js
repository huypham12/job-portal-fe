import { useState, useCallback, useEffect, useMemo } from "react";
import { jobsApi, skillsApi, categoriesApi } from "../services/jobsApi";
import { searchService } from "../services/searchService.js";
import { debounce } from "../services/apiClient.js";

// ==================== JOBS LISTING HOOK ====================

export function useMyJobs(initialFilters = {}) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0,
  });
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: null,
    sort_by: "posted_at",
    sort_order: "desc",
    ...initialFilters,
  });

  const fetchJobs = useCallback(
    async (newFilters = {}) => {
      const searchFilters = { ...filters, ...newFilters };
      setLoading(true);
      setError(null);

      try {
        const response = await jobsApi.getMyJobs(searchFilters);

        // jobsApi.getMyJobs may return either:
        // 1) an array of jobs (when pickData returned res.data)
        // 2) an object with { message, data, pagination }
        // Handle both shapes for compatibility.
        let jobsData = [];
        let paginationData = {
          page: searchFilters.page,
          limit: searchFilters.limit,
          total: 0,
          total_pages: 0,
        };

        if (Array.isArray(response)) {
          jobsData = response;
        } else if (response && typeof response === "object") {
          // prefer response.data when present
          if (Array.isArray(response.data)) {
            jobsData = response.data;
          } else if (Array.isArray(response.items)) {
            // fallback if backend uses items key
            jobsData = response.items;
          } else if (Array.isArray(response.jobs)) {
            jobsData = response.jobs;
          } else if (
            response.data &&
            typeof response.data === "object" &&
            Array.isArray(response.data.data)
          ) {
            // nested { data: { data: [...] } } edge-case
            jobsData = response.data.data;
          } else {
            // last resort: try to use response as jobs array-like
            jobsData = response || [];
          }

          if (response.pagination && typeof response.pagination === "object") {
            paginationData = {
              page: response.pagination.page || searchFilters.page,
              limit: response.pagination.limit || searchFilters.limit,
              total: response.pagination.total || 0,
              total_pages:
                response.pagination.total_pages ||
                response.pagination.totalPages ||
                0,
            };
          }
        }

        setJobs(jobsData);
        setPagination(paginationData);
        setFilters(searchFilters);
      } catch (err) {
        setError(err.message || "Failed to fetch jobs");
        console.error("useMyJobs error:", err);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 })); // Reset to page 1 on filter change
  }, []);

  const goToPage = useCallback(
    (page) => {
      if (page >= 1 && page <= pagination.total_pages) {
        setFilters((prev) => ({ ...prev, page }));
      }
    },
    [pagination.total_pages]
  );

  const refresh = useCallback(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    fetchJobs();
  }, [
    filters.page,
    filters.limit,
    filters.status,
    filters.sort_by,
    filters.sort_order,
    filters.search, // trigger fetch when search term changes
  ]);

  return {
    jobs,
    loading,
    error,
    pagination,
    filters,
    fetchJobs,
    updateFilters,
    goToPage,
    refresh,
  };
}

// ==================== JOB CRUD HOOKS ====================

export function useJobCreate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const createJob = useCallback(async (jobData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await jobsApi.createJob(jobData);
      setSuccess(true);
      return result;
    } catch (err) {
      const errorMessage =
        err.data?.message || err.message || "Failed to create job";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(false);
  }, []);

  return {
    createJob,
    loading,
    error,
    success,
    reset,
  };
}

export function useJobUpdate(jobId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const updateJob = useCallback(
    async (jobData) => {
      if (!jobId) {
        throw new Error("Job ID is required for update");
      }

      setLoading(true);
      setError(null);
      setSuccess(false);

      try {
        const result = await jobsApi.updateJob(jobId, jobData);
        setSuccess(true);
        return result;
      } catch (err) {
        const errorMessage =
          err.data?.message || err.message || "Failed to update job";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [jobId]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(false);
  }, []);

  return {
    updateJob,
    loading,
    error,
    success,
    reset,
  };
}

export function useJobManage(jobId) {
  const [job, setJob] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchJob = useCallback(async () => {
    if (!jobId) return;

    setLoading(true);
    setError(null);

    try {
      const [jobData, statsData] = await Promise.all([
        jobsApi.getJobForManage(jobId),
        jobsApi.getJobStats(jobId),
      ]);
      // Normalize job shape from backend:
      // - job.job_skills: [{ job_id, skill_id, skills: {id,name} }] => job.skill_ids: [id], job.skills: [{id,name}]
      // - job.job_categories: [{ job_id, category_id, categories: {id,name,slug,type} }] => job.category_ids: [id], job.categories: [{...}]
      // - job.job_requirements: [...] => job.requirements: [...]
      // - job.job_benefits: [...] => job.benefits: [...]
      // - job.job_work_arrangements: {...} => job.work_arrangements: {...}
      const normalizeJob = (j) => {
        if (!j) return j;
        const copy = { ...j };
        try {
          // Normalize skills
          if (Array.isArray(copy.job_skills)) {
            copy.skill_ids = copy.job_skills.map((js) => js.skill_id);
            copy.skills = copy.job_skills
              .map((js) => js.skills)
              .filter(Boolean);
          }

          // Normalize categories
          if (Array.isArray(copy.job_categories)) {
            copy.category_ids = copy.job_categories.map((jc) => jc.category_id);
            copy.categories = copy.job_categories
              .map((jc) => jc.categories)
              .filter(Boolean);
          }

          // Normalize requirements
          if (Array.isArray(copy.job_requirements)) {
            copy.requirements = copy.job_requirements;
          }

          // Normalize benefits
          if (Array.isArray(copy.job_benefits)) {
            copy.benefits = copy.job_benefits;
          }

          // Normalize work arrangements
          if (
            copy.job_work_arrangements &&
            typeof copy.job_work_arrangements === "object"
          ) {
            copy.work_arrangements = copy.job_work_arrangements;
          }
        } catch (e) {
          console.warn("Failed to normalize job object", e);
        }
        return copy;
      };
      const normalized = normalizeJob(jobData);
      setJob(normalized);
      setStats(statsData);
    } catch (err) {
      setError(err.message || "Failed to fetch job details");
      console.error("useJobManage error:", err);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  const updateStatus = useCallback(
    async (status) => {
      if (!jobId) return;

      try {
        const result = await jobsApi.updateJobStatus(jobId, { status });
        // Optimistic update
        if (job) {
          setJob((prev) => ({ ...prev, status }));
        }
        return result;
      } catch (err) {
        // Refresh data on error
        await fetchJob();
        throw err;
      }
    },
    [jobId, job, fetchJob]
  );

  const publish = useCallback(async () => {
    if (!jobId) return;

    try {
      const result = await jobsApi.publishJobs({ job_ids: [jobId] });
      // Optimistic update - draft -> pending_approval
      if (job && job.status === "draft") {
        setJob((prev) => ({ ...prev, status: "pending_approval" }));
      }
      return result;
    } catch (err) {
      // Refresh data on error
      await fetchJob();
      throw err;
    }
  }, [jobId, job, fetchJob]);

  const deleteJob = useCallback(async () => {
    if (!jobId) return;

    try {
      const result = await jobsApi.deleteJob(jobId);
      return result;
    } catch (err) {
      throw err;
    }
  }, [jobId]);

  useEffect(() => {
    if (jobId) {
      fetchJob();
    }
  }, [jobId, fetchJob]);

  return {
    job,
    stats,
    loading,
    error,
    fetchJob,
    updateStatus,
    publish,
    deleteJob,
  };
}

// ==================== BULK ACTIONS HOOK ====================

export function useBulkJobActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const performBulkAction = useCallback(async (action, jobIds) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Normalize and validate job IDs before sending to backend
      const uuidRe =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const ids =
        Array.isArray(jobIds) && jobIds.length > 0
          ? jobIds
              .map((id) => String(id).trim())
              .filter((id) => uuidRe.test(id))
          : [];

      if (ids.length === 0) {
        throw new Error("No valid job IDs provided for bulk action");
      }
      if (ids.length > 50) {
        throw new Error("Maximum 50 jobs allowed per bulk request");
      }

      console.debug("Bulk action payload:", { action, job_ids: ids });
      const result = await jobsApi.bulkJobActions({ action, job_ids: ids });
      setSuccess(true);
      return result;
    } catch (err) {
      const errorMessage =
        err.data?.message || err.message || `Failed to ${action} jobs`;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkClose = useCallback(
    (jobIds) => performBulkAction("close", jobIds),
    [performBulkAction]
  );
  const bulkDelete = useCallback(
    (jobIds) => performBulkAction("delete", jobIds),
    [performBulkAction]
  );
  const bulkPublish = useCallback(async (jobIds) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Normalize and validate job IDs before sending to backend
      const uuidRe =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const ids =
        Array.isArray(jobIds) && jobIds.length > 0
          ? jobIds
              .map((id) => String(id).trim())
              .filter((id) => uuidRe.test(id))
          : [];

      if (ids.length === 0) {
        throw new Error("No valid job IDs provided for publish action");
      }
      if (ids.length > 50) {
        throw new Error("Maximum 50 jobs allowed per publish request");
      }

      console.debug("Publish action payload:", { job_ids: ids });
      const result = await jobsApi.publishJobs({ job_ids: ids });
      setSuccess(true);
      return result;
    } catch (err) {
      const errorMessage =
        err.data?.message || err.message || `Failed to publish jobs`;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkOpen = useCallback(async (jobIds) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate job IDs
      const uuidRe =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const ids =
        Array.isArray(jobIds) && jobIds.length > 0
          ? jobIds
              .map((id) => String(id).trim())
              .filter((id) => uuidRe.test(id))
          : [];

      if (ids.length === 0) {
        throw new Error("No valid job IDs provided for open action");
      }
      if (ids.length > 50) {
        throw new Error("Maximum 50 jobs allowed per open request");
      }

      console.debug("Bulk open action payload:", { job_ids: ids });
      // Use bulk API action 'open' (backend supports it)
      const result = await performBulkAction("open", ids);
      setSuccess(true);
      return result;
    } catch (err) {
      const errorMessage =
        err.data?.message || err.message || `Failed to open jobs`;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkExtendExpiry = useCallback(async (jobIds, newExpiresAt) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await jobsApi.bulkExtendExpiry({
        job_ids: jobIds,
        new_expires_at: newExpiresAt.toISOString(),
      });
      setSuccess(true);
      return result;
    } catch (err) {
      const errorMessage =
        err.data?.message || err.message || "Failed to extend job expiry";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(false);
  }, []);

  return {
    loading,
    error,
    success,
    bulkClose,
    bulkDelete,
    bulkPublish,
    bulkOpen,
    bulkExtendExpiry,
    reset,
  };
}

// ==================== SKILLS & CATEGORIES HOOKS ====================

export function useSkills(searchTerm = "", category = "", limit = 50) {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchSkills = useCallback(
    async (search = searchTerm, cat = category) => {
      setLoading(true);
      setError(null);

      try {
        const params = {};
        if (search.trim()) params.search = search.trim();
        if (cat) params.category = cat;
        if (limit) params.limit = limit;

        const result = await skillsApi.searchSkills(params);
        setSkills(result || []);
      } catch (err) {
        setError(err.message || "Failed to search skills");
        console.error("useSkills error:", err);
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, category, limit]
  );

  useEffect(() => {
    searchSkills();
  }, [searchSkills]);

  return {
    skills,
    loading,
    error,
    searchSkills,
  };
}

export function useCategories(type = null) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = type ? { type } : {};
      const result = await categoriesApi.getCategories(params);
      setCategories(result || []);
    } catch (err) {
      setError(err.message || "Failed to fetch categories");
      console.error("useCategories error:", err);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
}

export function useCategoriesGrouped() {
  const [groupedCategories, setGroupedCategories] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGroupedCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await categoriesApi.getCategoriesGrouped();
      setGroupedCategories(result || {});
    } catch (err) {
      setError(err.message || "Failed to fetch grouped categories");
      console.error("useCategoriesGrouped error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroupedCategories();
  }, [fetchGroupedCategories]);

  return {
    groupedCategories,
    loading,
    error,
    refetch: fetchGroupedCategories,
  };
}

// ==================== JOB SEARCH HOOK ====================

/**
 * Centralized hook for job search functionality
 * Matches backend search DTO and provides URL sync
 */
export function useJobsSearch(initialFilters = {}) {
  // Default search state matching backend DTO
  const defaultState = {
    q: "",
    location: "",
    locationId: null, // Optional location ID for precise matching
    jobType: "",
    experienceLevel: null,
    skills: [],
    salaryMin: null,
    salaryMax: null,
    remotePercentageMin: null,
    flexibleHours: null,
    sort: "relevance",
    page: 1,
    size: 20,
    highlight: true,
    // User context for personalization
    userExperienceLevel: null,
    userLocationId: null,
    userPrefersRemote: null,
    userSkills: [],
    userDesiredSalaryMin: null,
    userDesiredSalaryMax: null,
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
  const [cacheHit, setCacheHit] = useState(false);
  const [cachedAt, setCachedAt] = useState(null);

  // Search function without debounce - will be wrapped separately
  const executeSearch = useCallback(async (state) => {
    setLoading(true);
    setError(null);

    // Reset cache indicators before new search
    setCacheHit(false);
    setCachedAt(null);

    try {
      const response = await searchService.searchJobs(state);

      // Update all state values to trigger re-render
      setResults(response.hits || []);
      setTotal(response.total || 0);
      setTook(response.total_took_ms || response.took_ms || 0);
      setCacheHit(!!response.cache_hit); // Force boolean
      setCachedAt(response.cached_at || null);

      console.log("[Search] Response metadata:", {
        total_took_ms: response.total_took_ms,
        took_ms: response.took_ms,
        cache_hit: response.cache_hit,
        cached_at: response.cached_at,
      });

      // Log search event to backend for search history (only if user is authenticated and has query)
      if (state.q && state.q.trim()) {
        try {
          const token = localStorage.getItem("authToken");
          if (token) {
            // Get user_id from auth helper
            const { getCurrentUserId } = await import("../auth/auth.js");
            const userId = getCurrentUserId();

            await searchService.logEvent({
              event_type: "search",
              user_id: userId, // IMPORTANT: Backend needs this to save to search_history
              query: state.q,
              filters: {
                location: state.location,
                locationId: state.locationId,
                jobType: state.jobType,
                experienceLevel: state.experienceLevel,
                skills: state.skills,
                salaryMin: state.salaryMin,
                salaryMax: state.salaryMax,
                remotePercentageMin: state.remotePercentageMin,
                flexibleHours: state.flexibleHours,
              },
              result_count: response.total || 0,
              timestamp_ms: Date.now(),
            });
            console.log(
              "✅ [Search] Logged search event to backend with user_id:",
              userId
            );

            // Trigger event để SearchPage biết cần refetch history
            window.dispatchEvent(new CustomEvent("search-history-updated"));
          }
        } catch (err) {
          console.warn("Failed to log search event:", err);
        }
      }
    } catch (err) {
      console.error("Search failed:", err);
      setError(err.message || "Có lỗi xảy ra khi tìm kiếm");
      setResults([]);
      setTotal(0);
      setTook(0);
      setCacheHit(false);
      setCachedAt(null);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies - pure function

  // Debounced search function (300ms delay for q input)
  const performSearch = useCallback(
    debounce((state) => {
      executeSearch(state);
    }, 300),
    [executeSearch]
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

  // Immediate search without debounce (for actions like "Apply Filters")
  const searchNow = useCallback(() => {
    executeSearch(searchState);
  }, [searchState, executeSearch]);

  // Apply current filters (trigger immediate search)
  const applyFilters = useCallback(() => {
    searchNow();
  }, [searchNow]);

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
    const hasSalary =
      (searchState.salaryMin !== null && searchState.salaryMin !== undefined) ||
      (searchState.salaryMax !== null && searchState.salaryMax !== undefined);

    const shouldSearchFilters =
      searchState.location ||
      searchState.jobType ||
      searchState.experienceLevel ||
      (searchState.skills && searchState.skills.length > 0) ||
      hasSalary ||
      searchState.remotePercentageMin !== null ||
      searchState.flexibleHours !== null ||
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
    searchState.location,
    searchState.jobType,
    searchState.experienceLevel,
    searchState.skills,
    searchState.salaryMin,
    searchState.salaryMax,
    searchState.remotePercentageMin,
    searchState.flexibleHours,
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
    const hasSalary =
      (searchState.salaryMin !== null && searchState.salaryMin !== undefined) ||
      (searchState.salaryMax !== null && searchState.salaryMax !== undefined);

    return (
      searchState.location ||
      searchState.jobType ||
      searchState.experienceLevel ||
      (searchState.skills && searchState.skills.length > 0) ||
      hasSalary ||
      searchState.remotePercentageMin !== null ||
      searchState.flexibleHours !== null ||
      searchState.sort !== "relevance"
    );
  }, [searchState]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchState.location) count++;
    if (searchState.jobType) count++;
    if (searchState.experienceLevel) count++;
    if (searchState.skills && searchState.skills.length > 0) count++;
    if (
      (searchState.salaryMin !== null && searchState.salaryMin !== undefined) ||
      (searchState.salaryMax !== null && searchState.salaryMax !== undefined)
    )
      count++;
    if (searchState.remotePercentageMin !== null) count++;
    if (searchState.flexibleHours !== null) count++;
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
    cacheHit,
    cachedAt,
    hasActiveFilters,
    activeFilterCount,

    // Actions
    setFilter,
    setFilters,
    resetFilters,
    applyFilters,
    search,
    searchNow, // Immediate search without debounce
    goToPage,
    nextPage,
    prevPage,

    // Utilities
    performSearch: () => performSearch(searchState),
  };
}
