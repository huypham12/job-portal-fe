import {
  getAuthToken,
  getRefreshToken,
  setAuthToken,
  setRefreshToken,
  logout,
} from "../auth/auth";

const BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function buildUrl(path) {
  const isAbs = /^https?:\/\//i.test(path);
  if (isAbs) return path;
  if (path.startsWith("/api")) return `${BASE}${path}`;
  return `${BASE}${path}`;
}

let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  if (refreshPromise) return refreshPromise;
  refreshPromise = fetch(`${BASE}/api/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
    .then(async (res) => {
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(payload?.message || "Khong the lam moi token");
        err.status = res.status;
        throw err;
      }
      const access = payload?.data?.access_token || payload?.access_token;
      const newRefresh = payload?.data?.refresh_token || payload?.refresh_token;
      if (access) setAuthToken(access);
      if (newRefresh) setRefreshToken(newRefresh);
      return access;
    })
    .catch((err) => {
      logout();
      throw err;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

async function request(
  path,
  { method = "GET", headers = {}, body, withCredentials = false } = {}
) {
  const url = buildUrl(path);
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;
  const makeFetch = async () => {
    const opts = {
      method,
      headers: isFormData
        ? { ...headers }
        : { "Content-Type": "application/json", ...headers },
      credentials: withCredentials ? "include" : "omit",
    };
    const token = getAuthToken();
    if (token) {
      opts.headers = { ...opts.headers, Authorization: `Bearer ${token}` };
    }
    if (body !== undefined) {
      if (isFormData) {
        opts.body = body;
      } else {
        opts.body = typeof body === "string" ? body : JSON.stringify(body);
      }
    }
    return fetch(url, opts);
  };

  let response;
  let retried = false;
  const MAX_RETRIES = 1;
  let retryCount = 0;

  while (retryCount <= MAX_RETRIES) {
    try {
      response = await makeFetch();
    } catch (e) {
      const err = new Error(
        "Khong the ket noi may chu. Kiem tra backend/proxy/URL."
      );
      err.cause = e;
      throw err;
    }
    if (response.status === 401 && !retried && retryCount < MAX_RETRIES) {
      try {
        await refreshAccessToken();
        retried = true;
        retryCount++;
        continue;
      } catch (err) {
        throw err;
      }
    }
    break;
  }

  const ct = response.headers.get("content-type") || "";
  const data = ct.includes("application/json")
    ? await response.json()
    : await response.text();
  if (!response.ok) {
    const err = new Error(
      data?.message || response.statusText || "Request error"
    );
    err.status = response.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  get: (p, o) => request(p, { ...o, method: "GET" }),
  post: (p, b, o) => request(p, { ...o, method: "POST", body: b }),
  put: (p, b, o) => request(p, { ...o, method: "PUT", body: b }),
  patch: (p, b, o) => request(p, { ...o, method: "PATCH", body: b }),
  del: (p, o) => request(p, { ...o, method: "DELETE" }),
};

/**
 * Build query string from filters object
 * Note: URLSearchParams always converts values to strings, which is normal.
 * Backend validator with z.coerce.number() should parse them correctly.
 */
function buildQueryString(filters = {}) {
  const params = new URLSearchParams();

  // Pagination - convert to number first, then to string for URLSearchParams
  // This ensures we send valid numeric strings that backend can parse
  if (filters.page !== undefined && filters.page !== null) {
    const pageNum = parseInt(String(filters.page), 10);
    if (!isNaN(pageNum) && pageNum > 0) {
      params.append("page", String(pageNum));
    }
  }
  if (filters.limit !== undefined && filters.limit !== null) {
    const limitNum = parseInt(String(filters.limit), 10);
    if (!isNaN(limitNum) && limitNum > 0) {
      params.append("limit", String(limitNum));
    }
  }

  // Search
  if (filters.search) params.append("search", filters.search);
  if (filters.skill_names) params.append("skill_names", filters.skill_names);
  if (filters.location_name)
    params.append("location_name", filters.location_name);
  if (filters.category) params.append("category", filters.category);

  // Filters
  if (filters.company_id) params.append("company_id", filters.company_id);
  if (filters.location_id) params.append("location_id", filters.location_id);
  if (filters.job_type) params.append("job_type", filters.job_type);
  if (
    filters.experience_level !== undefined &&
    filters.experience_level !== null
  ) {
    const expNum = parseInt(String(filters.experience_level), 10);
    if (!isNaN(expNum)) {
      params.append("experience_level", String(expNum));
    }
  }
  if (filters.status) params.append("status", filters.status);
  if (filters.interest_type)
    params.append("interest_type", filters.interest_type);
  if (filters.role) params.append("role", filters.role);
  if (filters.candidate_id) params.append("candidate_id", filters.candidate_id);
  if (filters.min_experience !== undefined && filters.min_experience !== null) {
    const expNum = parseInt(String(filters.min_experience), 10);
    if (!isNaN(expNum) && expNum >= 0) {
      params.append("min_experience", String(expNum));
    }
  }
  if (
    filters.is_looking_for_job !== undefined &&
    filters.is_looking_for_job !== null
  ) {
    params.append("is_looking_for_job", String(filters.is_looking_for_job));
  }
  if (filters.scope) params.append("scope", filters.scope);
  if (filters.job_id) params.append("job_id", filters.job_id);

  // Salary range
  if (
    filters.salary_min !== undefined &&
    filters.salary_min !== null &&
    filters.salary_min !== ""
  ) {
    const minNum = parseInt(String(filters.salary_min), 10);
    if (!isNaN(minNum)) {
      params.append("salary_min", String(minNum));
    }
  }
  if (
    filters.salary_max !== undefined &&
    filters.salary_max !== null &&
    filters.salary_max !== ""
  ) {
    const maxNum = parseInt(String(filters.salary_max), 10);
    if (!isNaN(maxNum)) {
      params.append("salary_max", String(maxNum));
    }
  }

  // Sorting
  if (filters.sort_by) params.append("sort_by", filters.sort_by);
  if (filters.sort_order) params.append("sort_order", filters.sort_order);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export const JobService = {
  /**
   * List jobs with filters
   * @param {Object} filters - Filter object with pagination, search, and filter params
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  list: (filters) => {
    const query = buildQueryString(filters);
    // Debug: log the final URL to see what's being sent
    if (process.env.NODE_ENV === "development") {
      console.log("JobService.list - Filters object:", filters);
      console.log("JobService.list - Query string:", query);
      console.log(
        "JobService.list - Full URL:",
        `/api/search/jobs/list${query}`
      );
    }
    return api.get(`/api/search/jobs/list${query}`);
  },
  /**
   * Get featured jobs (public)
   * @returns {Promise<{data: Array}>}
   */
  featured: () => api.get("/api/search/jobs/featured"),
  /**
   * Get latest jobs (public)
   * @returns {Promise<{data: Array}>}
   */
  latest: () => api.get("/api/search/jobs/latest"),
  /**
   * Get job detail (public)
   * @param {string} id - Job ID
   * @returns {Promise<{data: Object}>}
   */
  detail: (id) => api.get(`/api/jobs/${id}/public`),
  /**
   * Track job view
   * @param {string} id - Job ID
   * @returns {Promise<void>}
   */
  trackView: (id) => api.post(`/api/jobs/${id}/view`),
  /**
   * Create a new job (Recruiter only)
   * @param {Object} data - Job data according to CreateJobRequest schema
   * @returns {Promise<{message: string, data: Object}>}
   */
  create: (data) => api.post("/api/jobs", data),
  /**
   * List my jobs (Recruiter)
   * @param {Object} filters - Filter object with pagination and status
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  myJobs: (filters) => {
    const query = buildQueryString(filters);
    return api.get(`/api/jobs/my-jobs${query}`);
  },
  /**
   * Get job detail for management (Recruiter)
   * @param {string} id - Job ID
   * @returns {Promise<{data: Object}>}
   */
  getManage: (id) => api.get(`/api/jobs/${id}/manage`),
  /**
   * Get job statistics (Recruiter)
   * @param {string} id - Job ID
   * @returns {Promise<{data: Object}>}
   */
  getStats: (id) => api.get(`/api/jobs/${id}/stats`),
  /**
   * Update job (Recruiter)
   * @param {string} id - Job ID
   * @param {Object} data - Job data according to UpdateJobRequest schema
   * @returns {Promise<{message: string, data: Object}>}
   */
  update: (id, data) => api.put(`/api/jobs/${id}`, data),
  /**
   * Delete job (Recruiter)
   * @param {string} id - Job ID
   * @returns {Promise<{message: string}>}
   */
  delete: (id) => api.del(`/api/jobs/${id}`),
  /**
   * Update job status (Recruiter)
   * @param {string} id - Job ID
   * @param {string} status - Status: 'approved' or 'closed'
   * @returns {Promise<{message: string}>}
   */
  updateStatus: (id, status) => api.patch(`/api/jobs/${id}/status`, { status }),
};

export const CompanyService = {
  /**
   * List public companies with query string (already includes ?page=...&limit=...)
   */
  list: (query) => api.get(`/api/search/companies${query || ""}`),
  /**
   * Get public company detail with full info
   */
  detail: (id) => api.get(`/api/companies/${id}?details=true`),
};

/**
 * Build query string for saved jobs filters
 */
function buildSavedJobsQueryString(filters = {}) {
  const params = new URLSearchParams();

  // Pagination
  if (filters.page !== undefined && filters.page !== null) {
    const pageNum = parseInt(String(filters.page), 10);
    if (!isNaN(pageNum) && pageNum > 0) {
      params.append("page", String(pageNum));
    }
  }
  if (filters.limit !== undefined && filters.limit !== null) {
    const limitNum = parseInt(String(filters.limit), 10);
    if (!isNaN(limitNum) && limitNum > 0) {
      params.append("limit", String(limitNum));
    }
  }

  // Search
  if (filters.search) params.append("search", filters.search);

  // Filters
  if (filters.job_type) params.append("job_type", filters.job_type);
  if (filters.location_id) params.append("location_id", filters.location_id);

  // Sorting
  if (filters.sort_by) params.append("sort_by", filters.sort_by);
  if (filters.order) params.append("order", filters.order);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export const SkillService = {
  /**
   * Search skills
   * @param {Object} params - Search parameters (search, category, limit, offset)
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  search: (params) => {
    const query = buildQueryString(params);
    return api.get(`/api/skills${query}`);
  },
  /**
   * Get skill categories
   * @returns {Promise<Array<string>>}
   */
  getCategories: () => api.get("/api/skills/categories"),
};

export const LocationService = {
  /**
   * Get all provinces (tỉnh/thành)
   * @returns {Promise<{data: Array}>}
   */
  getProvinces: () => api.get("/api/locations/provinces"),
  /**
   * Get districts by province ID
   * @param {string} provinceId - Province ID
   * @returns {Promise<{data: Array}>}
   */
  getDistricts: (provinceId) =>
    api.get(`/api/locations/districts?province_id=${provinceId}`),
  /**
   * Get location by ID (includes children if province, parent if district)
   * @param {string} id - Location ID
   * @returns {Promise<{data: Object}>}
   */
  getById: (id) => api.get(`/api/locations/${id}`),
  /**
   * Search locations by name
   * @param {Object} params - Search parameters (search, limit)
   * @returns {Promise<{data: Array}>}
   */
  search: (params) => {
    const { search, limit } = params || {};
    if (!search) {
      return Promise.reject(new Error("search parameter is required"));
    }
    const query = limit
      ? `?search=${encodeURIComponent(search)}&limit=${limit}`
      : `?search=${encodeURIComponent(search)}`;
    return api.get(`/api/locations/search${query}`);
  },
  /**
   * Get child locations by parent ID (for backward compatibility)
   * Uses getById which returns children if it's a province
   * @param {string} id - Parent location ID
   * @returns {Promise<{data: Array}>}
   */
  getChildren: async (id) => {
    const response = await api.get(`/api/locations/${id}`);
    // If location has children, return them, otherwise return empty array
    return { data: response.data?.children || [] };
  },
  /**
   * List locations (for backward compatibility - maps to getProvinces)
   * @param {Object} params - Search parameters (deprecated, use getProvinces or search instead)
   * @returns {Promise<{data: Array}>}
   */
  list: async (params) => {
    // If type is specified, try to use appropriate endpoint
    if (params?.type) {
      const type = String(params.type).toLowerCase();
      if (
        type === "tinh" ||
        type === "province" ||
        type.includes("province") ||
        type.includes("tinh")
      ) {
        return api.get("/api/locations/provinces");
      }
    }
    // Default to provinces
    return api.get("/api/locations/provinces");
  },
};

export const TagService = {
  /**
   * Search tags
   * @param {Object} params - Search parameters (search, limit, offset)
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  list: (params) => {
    const query = buildQueryString(params);
    return api.get(`/api/tags${query}`);
  },
  /**
   * Get tag by ID
   * @param {string} id - Tag ID
   * @returns {Promise<{data: Object}>}
   */
  getById: (id) => api.get(`/api/tags/${id}`),
};

export const SavedJobsService = {
  /**
   * Save a job
   * @param {string} jobId - Job ID to save
   * @returns {Promise<{message: string, data: Object}>}
   */
  save: (jobId) => api.post("/api/saved-jobs", { job_id: jobId }),

  /**
   * List saved jobs with filters
   * @param {Object} filters - Filter object with pagination, search, and filter params
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  list: (filters) => {
    const query = buildSavedJobsQueryString(filters);
    return api.get(`/api/saved-jobs${query}`);
  },

  /**
   * Unsave a job
   * @param {string} jobId - Job ID to unsave
   * @returns {Promise<{message: string}>}
   */
  unsave: (jobId) => api.del(`/api/saved-jobs/${jobId}`),

  /**
   * Check if a job is saved
   * @param {string} jobId - Job ID to check
   * @returns {Promise<{data: {saved: boolean}}>}
   */
  check: (jobId) => api.get(`/api/saved-jobs/check/${jobId}`),
};

// ============================================
// APPLICATION SERVICES
// ============================================

export const ApplicationService = {
  /**
   * Create application (Candidate)
   */
  create: (data) => api.post("/api/applications/candidate", data),

  /**
   * List my applications (Candidate)
   */
  listMine: (filters = {}) => {
    const params = new URLSearchParams();
    params.append("page", String(filters.page || 1));
    params.append("limit", String(filters.limit || 20));
    if (filters.status) params.append("status", filters.status);
    if (filters.sort_by) params.append("sort_by", filters.sort_by);
    if (filters.order) params.append("order", filters.order);
    const query = params.toString();
    return api.get(`/api/applications/candidate${query ? `?${query}` : ""}`);
  },

  /**
   * Withdraw my application (Candidate)
   */
  withdraw: (id) => api.del(`/api/applications/candidate/${id}`),

  /**
   * Upload application document (Candidate)
   */
  uploadDocument: (id, file, documentType) => {
    const formData = new FormData();
    formData.append("file", file);
    if (documentType) formData.append("document_type", documentType);
    return api.post(`/api/applications/candidate/${id}/documents`, formData);
  },

  /**
   * Submit candidate feedback for interview stage (Candidate)
   */
  submitStageFeedback: (id, stageId, feedback) =>
    api.patch(`/api/applications/candidate/${id}/stages/${stageId}/feedback`, {
      candidate_feedback: feedback,
    }),

  /**
   * List applications for a job (Recruiter)
   * @param {string} jobId - Job ID
   * @param {Object} filters - Filter object with pagination, status, stage, sort_by, order
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  listByJob: (jobId, filters = {}) => {
    const params = new URLSearchParams();
    params.append("page", String(filters.page || 1));
    params.append("limit", String(filters.limit || 20));
    if (
      filters.status &&
      typeof filters.status === "string" &&
      filters.status.trim()
    ) {
      params.append("status", filters.status);
    }
    if (
      filters.stage &&
      typeof filters.stage === "string" &&
      filters.stage.trim()
    ) {
      params.append("stage", filters.stage);
    }
    params.append("sort_by", filters.sort_by || "applied_at");
    params.append("order", filters.order || "desc");
    const query = params.toString();
    return api.get(`/api/applications/recruiter/job/${jobId}?${query}`);
  },

  /**
   * Get job application statistics (Recruiter)
   */
  getStats: (jobId) =>
    api.get(`/api/applications/recruiter/job/${jobId}/stats`),

  /**
   * Get dashboard statistics for recruiter (Recruiter)
   * @returns {Promise<{data: {active_jobs: number, draft_jobs: number, total_applications: number}}>}
   */
  getDashboardStats: () =>
    api.get("/api/applications/recruiter/dashboard/stats"),

  /**
   * Get application detail (Candidate)
   */
  getDetail: (id) => api.get(`/api/applications/candidate/${id}`),

  /**
   * Get application detail (Recruiter)
   */
  getDetailRecruiter: (id) => api.get(`/api/applications/recruiter/${id}`),

  /**
   * Get application CV (Recruiter)
   */
  getCVRecruiter: (id) => api.get(`/api/applications/recruiter/${id}/cv`),

  /**
   * Update application status (Recruiter)
   */
  updateStatus: (id, data) =>
    api.patch(`/api/applications/recruiter/${id}/status`, data),

  /**
   * Bulk update applications (Recruiter)
   */
  bulkUpdate: (data) =>
    api.post("/api/applications/recruiter/bulk-update", data),

  /**
   * Get application stages (Candidate)
   */
  getStages: (id) => api.get(`/api/applications/candidate/${id}/stages`),
  /**
   * Get single stage details (Candidate)
   */
  getStageDetail: (id, stageId) =>
    api.get(`/api/applications/candidate/${id}/stage/${stageId}`),
  /**
   * Candidate accepts a stage
   */
  acceptStage: (id, stageId) =>
    api.patch(`/api/applications/candidate/${id}/stage/${stageId}/accept`),
  /**
   * Candidate declines a stage
   */
  declineStage: (id, stageId, reason) =>
    api.patch(`/api/applications/candidate/${id}/stage/${stageId}/decline`, {
      reason,
    }),

  /**
   * Get application timeline (Recruiter) - includes all stages
   */
  getTimeline: (id) => api.get(`/api/applications/recruiter/${id}/timeline`),

  /**
   * Create application stage (Recruiter)
   */
  createStage: (id, data) =>
    api.post(`/api/applications/recruiter/${id}/stage`, data),

  /**
   * Bulk create interview stages with shared round_id (Recruiter)
   */
  bulkCreateStages: (data) =>
    api.post("/api/applications/recruiter/bulk/create-stages", data),

  /**
   * Get interview round details (Recruiter)
   */
  getInterviewRound: (roundId) =>
    api.get(`/api/applications/recruiter/rounds/${roundId}`),

  /**
   * Get all interview rounds for a job (Recruiter)
   */
  getJobInterviewRounds: (jobId) =>
    api.get(`/api/applications/recruiter/job/${jobId}/rounds`),

  /**
   * Update application stage (Recruiter)
   */
  updateStage: (id, data) =>
    api.patch(`/api/applications/recruiter/${id}/stage`, data),
  /**
   * Make a decision after a stage (Recruiter)
   * action: 'create_next_stage' | 'accept_application'
   */
  makeStageDecision: (id, stageId, data) =>
    api.post(
      `/api/applications/recruiter/${id}/stage/${stageId}/decision`,
      data
    ),

  /**
   * Bulk stage decision for multiple candidates (Recruiter)
   */
  bulkStageDecision: (data) =>
    api.post("/api/applications/recruiter/bulk/stage-decision", data),

  /**
   * Add application note (Recruiter)
   */
  addNote: (id, note) =>
    api.post(`/api/applications/recruiter/${id}/notes`, { note }),

  /**
   * Contact candidate (Recruiter)
   */
  contact: (id, data) =>
    api.post(`/api/applications/recruiter/${id}/contact`, data),

  /**
   * Add or remove candidate from shortlist (Recruiter)
   */
  shortlistCandidate: (data) =>
    api.post("/api/applications/recruiter/shortlist", data),

  /**
   * Get shortlisted candidates (Recruiter)
   */
  getShortlistedCandidates: (filters = {}) => {
    const params = new URLSearchParams();
    params.append("page", String(filters.page || 1));
    params.append("limit", String(filters.limit || 20));
    if (filters.job_id) params.append("job_id", filters.job_id);
    if (filters.sort_by) params.append("sort_by", filters.sort_by);
    if (filters.order) params.append("order", filters.order);
    const query = params.toString();
    return api.get(`/api/applications/recruiter/shortlisted?${query}`);
  },

  /**
   * Compare multiple candidates side-by-side (Recruiter)
   */
  compareCandidates: (data) =>
    api.post("/api/applications/recruiter/compare", data),

  /**
   * Get application documents (Candidate)
   */
  getDocuments: (id) => api.get(`/api/applications/candidate/${id}/documents`),

  /**
   * Get application documents (Recruiter)
   */
  getDocumentsRecruiter: (id) =>
    api.get(`/api/applications/recruiter/${id}/documents`),
};

// ============================================
// MATCHING SERVICE (Recruiter)
// ============================================

export const MatchingService = {
  /**
   * Match candidates for a specific job
   * @param {string} jobId - Job ID to match candidates for
   * @param {Object} filters - Matching filters
   */
  matchCandidates: (jobId, filters = {}) => {
    const params = new URLSearchParams();
    params.append("size", String(filters.size || 50));

    // Build filters query string
    if (filters.minScore !== undefined)
      params.append("min_score", String(filters.minScore));
    if (filters.location) params.append("location", filters.location);
    if (filters.experienceMin !== undefined)
      params.append("experience_min", String(filters.experienceMin));
    if (filters.experienceMax !== undefined)
      params.append("experience_max", String(filters.experienceMax));
    if (filters.education) params.append("education_level", filters.education);

    // Add any additional filters
    Object.entries(filters).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        ![
          "size",
          "minScore",
          "location",
          "experienceMin",
          "experienceMax",
          "education",
        ].includes(key)
      ) {
        params.append(key, String(value));
      }
    });

    const query = params.toString();
    return api.get(
      `/api/matching/job/${jobId}/candidates${query ? `?${query}` : ""}`
    );
  },
};

// ============================================
// TALENT POOL SERVICE (Recruiter)
// ============================================

export const TalentPoolService = {
  /**
   * Get saved candidates from talent pool
   * @param {Object} filters - Pagination and filter options
   */
  getSavedCandidates: (filters = {}) => {
    try {
      return api.get(`/api/talent-pool/candidates`, {
        params: {
          page: filters.page || 1,
          limit: filters.limit || 20,
          job_id: filters.jobId || undefined,
        },
      });
    } catch (error) {
      // Fallback to localStorage if API is not available
      console.warn("TalentPool API not available, using localStorage fallback");
      return Promise.resolve({
        data: this._getLocalSavedCandidates(filters),
      });
    }
  },

  /**
   * Save candidate to talent pool
   * @param {string} candidateId - Candidate profile ID
   * @param {string} jobId - Job ID
   * @param {string} note - Optional note
   */
  saveCandidate: (candidateId, jobId, note = "") => {
    try {
      return api.post("/api/talent-pool/candidates", {
        candidate_id: candidateId,
        job_id: jobId,
        note,
      });
    } catch (error) {
      // Fallback to localStorage
      console.warn("TalentPool API not available, using localStorage fallback");
      this._saveLocalCandidate(candidateId, jobId, note);
      return Promise.resolve({ success: true });
    }
  },

  /**
   * Remove candidate from talent pool
   * @param {string} candidateId - Candidate profile ID
   * @param {string} jobId - Job ID
   */
  removeCandidate: (candidateId, jobId) => {
    try {
      return api.delete(`/api/talent-pool/candidates/${candidateId}`, {
        params: { job_id: jobId },
      });
    } catch (error) {
      // Fallback to localStorage
      console.warn("TalentPool API not available, using localStorage fallback");
      this._removeLocalCandidate(candidateId, jobId);
      return Promise.resolve({ success: true });
    }
  },

  /**
   * Bulk save candidates to talent pool
   * @param {string[]} candidateIds - Array of candidate profile IDs
   * @param {string} jobId - Job ID
   */
  bulkSaveCandidates: (candidateIds, jobId) => {
    try {
      return api.post("/api/talent-pool/candidates/bulk", {
        candidate_ids: candidateIds,
        job_id: jobId,
      });
    } catch (error) {
      // Fallback to localStorage
      console.warn("TalentPool API not available, using localStorage fallback");
      candidateIds.forEach((candidateId) => {
        this._saveLocalCandidate(candidateId, jobId);
      });
      return Promise.resolve({
        success: true,
        saved_count: candidateIds.length,
      });
    }
  },

  // Local storage fallback methods
  _getLocalSavedCandidates: (filters = {}) => {
    try {
      const saved = JSON.parse(localStorage.getItem("talent_pool") || "[]");
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      let filtered = saved;
      if (filters.jobId) {
        filtered = saved.filter((item) => item.jobId === filters.jobId);
      }

      return {
        data: filtered.slice(startIndex, endIndex),
        pagination: {
          current_page: page,
          total_pages: Math.ceil(filtered.length / limit),
          total_count: filtered.length,
          per_page: limit,
        },
      };
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return {
        data: [],
        pagination: {
          current_page: 1,
          total_pages: 0,
          total_count: 0,
          per_page: 20,
        },
      };
    }
  },

  _saveLocalCandidate: (candidateId, jobId, note = "") => {
    try {
      const saved = JSON.parse(localStorage.getItem("talent_pool") || "[]");
      const existingIndex = saved.findIndex(
        (item) => item.candidateId === candidateId && item.jobId === jobId
      );

      if (existingIndex >= 0) {
        // Update existing
        saved[existingIndex].note = note;
        saved[existingIndex].updatedAt = new Date().toISOString();
      } else {
        // Add new
        saved.push({
          id: `${candidateId}_${jobId}_${Date.now()}`,
          candidateId,
          jobId,
          note,
          savedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      localStorage.setItem("talent_pool", JSON.stringify(saved));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  },

  _removeLocalCandidate: (candidateId, jobId) => {
    try {
      const saved = JSON.parse(localStorage.getItem("talent_pool") || "[]");
      const filtered = saved.filter(
        (item) => !(item.candidateId === candidateId && item.jobId === jobId)
      );
      localStorage.setItem("talent_pool", JSON.stringify(filtered));
    } catch (error) {
      console.error("Error removing from localStorage:", error);
    }
  },
};

// ============================================
// USER SERVICE
// ============================================

export const UserService = {
  getPublicProfile: (profileId) =>
    api.get(`/api/user/profiles/${profileId}/public`),
};

// ============================================
// CANDIDATE SEARCH SERVICE (Recruiter)
// ============================================

export const CandidateSearchService = {
  /**
   * Search candidates for recruiter
   * @param {Object} filters - search, skill_names, location_id, min_experience, is_looking_for_job, scope, job_id, page, limit
   */
  search: (filters = {}) => {
    const query = buildQueryString(filters);
    return api.get(`/api/user/candidates/search${query}`);
  },
};

// ============================================
// CONNECTION INTEREST SERVICE (Recruiter + Candidate)
// ============================================

export const ConnectionInterestService = {
  /**
   * Get connection stats for recruiter dashboard
   */
  stats: () => api.get("/api/connection-interests/stats"),

  /**
   * List connection interests with filters (status, interest_type, role, page, limit)
   */
  list: (filters = {}) => {
    const query = buildQueryString(filters);
    return api.get(`/api/connection-interests${query}`);
  },

  /**
   * Get detail of a connection interest
   * @param {string} id
   */
  getById: (id) => api.get(`/api/connection-interests/${id}`),

  /**
   * Create a connection interest (Recruiter)
   * @param {Object} payload - CreateConnectionInterestRequest
   */
  create: (payload) => api.post("/api/connection-interests", payload),

  /**
   * Delete/withdraw a connection interest (Recruiter) when pending
   * @param {string} id
   */
  remove: (id) => api.del(`/api/connection-interests/${id}`),
};
