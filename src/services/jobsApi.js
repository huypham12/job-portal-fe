import { api } from "../lib/api";

const pickData = (res) => res?.data ?? res;

export const jobsApi = {
  // ==================== RECRUITER ENDPOINTS ====================

  /**
   * Create a new job posting
   * POST /api/jobs
   */
  createJob: (payload) => api.post("/api/jobs", payload).then(pickData),

  /**
   * Get all jobs posted by the recruiter
   * GET /api/jobs/my-jobs
   */
  getMyJobs: (params) => {
    const qs = params
      ? `?${new URLSearchParams(
          Object.entries(params).reduce((acc, [k, v]) => {
            if (v === undefined || v === null) return acc;
            acc[k] = String(v);
            return acc;
          }, {})
        ).toString()}`
      : "";
    return api.get(`/api/jobs/my-jobs${qs}`).then(pickData);
  },

  /**
   * Get job details for management (recruiter view)
   * GET /api/jobs/:id/manage
   */
  getJobForManage: (jobId) =>
    api.get(`/api/jobs/${jobId}/manage`).then(pickData),

  /**
   * Get job statistics
   * GET /api/jobs/:id/stats
   */
  getJobStats: (jobId) => api.get(`/api/jobs/${jobId}/stats`).then(pickData),

  /**
   * Update a job posting
   * PUT /api/jobs/:id
   */
  updateJob: (jobId, payload) =>
    api.put(`/api/jobs/${jobId}`, payload).then(pickData),

  /**
   * Update job status (open/close)
   * PATCH /api/jobs/:id/status
   */
  updateJobStatus: (jobId, payload) =>
    api.patch(`/api/jobs/${jobId}/status`, payload).then(pickData),

  /**
   * Publish a draft job (change status to approved)
   * PATCH /api/jobs/:id/publish
   */
  publishJob: (jobId, payload = {}) =>
    api.patch(`/api/jobs/${jobId}/publish`, payload).then(pickData),

  /**
   * Soft delete a job posting
   * DELETE /api/jobs/:id
   */
  deleteJob: (jobId) => api.del(`/api/jobs/${jobId}`).then(pickData),

  /**
   * Perform bulk actions on multiple jobs
   * POST /api/jobs/bulk-actions
   */
  bulkJobActions: (payload) =>
    api.post("/api/jobs/bulk-actions", payload).then(pickData),

  /**
   * Bulk extend job expiry dates
   * PATCH /api/jobs/bulk-extend
   */
  bulkExtendExpiry: (payload) =>
    api.patch("/api/jobs/bulk-extend", payload).then(pickData),

  // ==================== PUBLIC ENDPOINTS ====================

  /**
   * Get job detail (public view)
   * GET /api/jobs/:id/public
   */
  getJobPublic: (jobId) => api.get(`/api/jobs/${jobId}/public`).then(pickData),

  /**
   * Track job view (can be anonymous or authenticated)
   * POST /api/jobs/:id/view
   */
  trackView: (jobId, source = "direct") =>
    api.post(`/api/jobs/${jobId}/view`, { source }).then(pickData),
};

export const skillsApi = {
  /**
   * Search skills with optional filters
   * GET /api/skills
   */
  searchSkills: (params) => {
    const qs = params
      ? `?${new URLSearchParams(
          Object.entries(params).reduce((acc, [k, v]) => {
            if (v === undefined || v === null) return acc;
            acc[k] = String(v);
            return acc;
          }, {})
        ).toString()}`
      : "";
    return api.get(`/api/skills${qs}`).then(pickData);
  },

  /**
   * Get all skill categories
   * GET /api/skills/categories
   */
  getCategories: () => api.get("/api/skills/categories").then(pickData),
};

export const categoriesApi = {
  /**
   * Get all categories with optional type filtering
   * GET /api/categories
   */
  getCategories: (params) => {
    const qs = params?.type
      ? `?${new URLSearchParams({ type: params.type }).toString()}`
      : "";
    return api.get(`/api/categories${qs}`).then(pickData);
  },

  /**
   * Get categories grouped by type
   * GET /api/categories/grouped
   */
  getCategoriesGrouped: () => api.get("/api/categories/grouped").then(pickData),
};
