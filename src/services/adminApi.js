import { api } from '../lib/api'

/**
 * Admin API Client
 * Tất cả các API này yêu cầu quyền admin
 */
export const adminApi = {
  // ==================== USER MANAGEMENT ====================
  
  /**
   * Lấy danh sách tất cả users với filter và pagination
   * @param {Object} params - { page, limit, search, role, verified, deleted }
   */
  getAllUsers: async (params = {}) => {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append('page', String(params.page))
    if (params.limit) queryParams.append('limit', String(params.limit))
    if (params.search) queryParams.append('search', params.search)
    if (params.role) queryParams.append('role', params.role)
    // Backend validator expect string 'true'/'false', không phải boolean
    if (params.verified !== undefined && params.verified !== null && params.verified !== '') {
      queryParams.append('verified', String(params.verified))
    }
    if (params.deleted !== undefined && params.deleted !== null && params.deleted !== '') {
      queryParams.append('deleted', String(params.deleted))
    }
    
    const query = queryParams.toString()
    return api.get(`/api/admin/users${query ? `?${query}` : ''}`)
  },

  /**
   * Lấy chi tiết một user
   * @param {string} userId - UUID của user
   */
  getUserDetails: async (userId) => {
    return api.get(`/api/admin/users/${userId}`)
  },

  /**
   * Cập nhật user (role, verified, deleted)
   * @param {string} userId - UUID của user
   * @param {Object} data - { role?, verified?, deleted? }
   */
  updateUser: async (userId, data) => {
    return api.patch(`/api/admin/users/${userId}`, data)
  },

  /**
   * Xóa vĩnh viễn user
   * @param {string} userId - UUID của user
   */
  deleteUser: async (userId) => {
    return api.del(`/api/admin/users/${userId}`)
  },

  // ==================== JOB MANAGEMENT ====================

  /**
   * Lấy danh sách tất cả jobs với filter và pagination
   * @param {Object} params - { page, limit, search, status, deleted }
   */
  getAllJobs: async (params = {}) => {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append('page', params.page)
    if (params.limit) queryParams.append('limit', params.limit)
    if (params.search) queryParams.append('search', params.search)
    if (params.status) queryParams.append('status', params.status)
    if (params.deleted !== undefined) queryParams.append('deleted', params.deleted)
    
    const query = queryParams.toString()
    return api.get(`/api/admin/jobs${query ? `?${query}` : ''}`)
  },

  /**
   * Lấy danh sách jobs chờ duyệt (pending)
   * @param {Object} params - { page, limit }
   */
  getPendingJobs: async (params = {}) => {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append('page', params.page)
    if (params.limit) queryParams.append('limit', params.limit)
    
    const query = queryParams.toString()
    return api.get(`/api/admin/jobs/pending${query ? `?${query}` : ''}`)
  },

  /**
   * Lấy chi tiết một job
   * @param {string} jobId - UUID của job
   */
  getJobDetails: async (jobId) => {
    return api.get(`/api/admin/jobs/${jobId}`)
  },

  /**
   * Duyệt job (approve)
   * @param {string} jobId - UUID của job
   */
  approveJob: async (jobId) => {
    return api.patch(`/api/admin/jobs/${jobId}/approve`)
  },

  /**
   * Từ chối job
   * @param {string} jobId - UUID của job
   * @param {string} reason - Lý do từ chối
   */
  rejectJob: async (jobId, reason) => {
    return api.patch(`/api/admin/jobs/${jobId}/reject`, { reason })
  },

  /**
   * Cập nhật labels cho job (hot, urgent, featured)
   * @param {string} jobId - UUID của job
   * @param {Object} labels - { hot?, urgent?, featured? }
   */
  updateJobLabels: async (jobId, labels) => {
    return api.patch(`/api/admin/jobs/${jobId}/label`, labels)
  },

  /**
   * Xóa job vi phạm (soft delete)
   * @param {string} jobId - UUID của job
   */
  deleteJobForViolation: async (jobId) => {
    return api.delete(`/api/admin/jobs/${jobId}/violation`)
  },

  /**
   * Khôi phục job đã xóa
   * @param {string} jobId - UUID của job
   */
  restoreJob: async (jobId) => {
    return api.post(`/api/admin/jobs/${jobId}/restore`)
  },
}

