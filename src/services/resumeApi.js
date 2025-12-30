import { api } from '../lib/api'

const pickData = (res) => res?.data ?? res

export const ResumeApi = {
  // Lấy danh sách CV
  getResumes: () => api.get('/api/resumes').then(pickData),

  // Lấy chi tiết CV
  getResumeById: (id) => api.get(`/api/resumes/${id}`).then(pickData),

  // Tạo CV mới từ đầu
  createResume: (payload) => api.post('/api/resumes', payload).then(pickData),

  // Tạo CV từ profile
  createResumeFromProfile: (payload) => api.post('/api/resumes/from-profile', payload).then(pickData),

  // Cập nhật CV
  updateResume: (id, payload) => api.put(`/api/resumes/${id}`, payload).then(pickData),

  // Đặt CV làm mặc định
  setDefaultResume: (id) => api.patch(`/api/resumes/${id}/default`).then(pickData),

  // Xóa CV
  deleteResume: (id) => api.del(`/api/resumes/${id}`).then(pickData),

  // Upload CV file
  uploadResume: (file, payload) => {
    const formData = new FormData()
    formData.append('file', file)
    if (payload.title) formData.append('title', payload.title)
    if (payload.auto_parse !== undefined) formData.append('auto_parse', String(payload.auto_parse))
    if (payload.is_default !== undefined) formData.append('is_default', String(payload.is_default))
    return api.post('/api/resumes/upload', formData).then(pickData)
  },

  // Download CV file (returns URL)
  downloadResume: (id) => api.get(`/api/resumes/${id}/download`).then(pickData),

  // Download CV file directly (returns pre-signed URL)
  downloadResumeFile: async (id) => {
    const result = await api.get(`/api/resumes/${id}/download-file`).then(pickData)
    
    if (!result.url) {
      throw new Error('Không lấy được download URL')
    }
    
    // Trả về URL trực tiếp, không fetch để tránh CORS
    return {
      url: result.url,
      filename: result.filename || 'resume.pdf'
    }
  },

  // Export CV to PDF/HTML
  exportResume: (id, payload) => api.post(`/api/resumes/${id}/export`, payload).then(pickData),

  // Preview CV (returns HTML string)
  // Sử dụng lại request function từ api.js nhưng override response để nhận HTML
  previewResume: async (id) => {
    console.log('🚀 previewResume called with id:', id)
    const path = `/api/resumes/${id}/preview`
    
    // Sử dụng lại request function từ api.js
    // Import các function cần thiết từ api.js
    const { getAuthToken, getRefreshToken, setAuthToken, setRefreshToken, logout } = await import('../auth/auth')
    const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
    
    function buildUrl(path) {
      const isAbs = /^https?:\/\//i.test(path)
      if (isAbs) return path
      if (path.startsWith('/api')) return BASE ? `${BASE}${path}` : path
      return BASE ? `${BASE}${path}` : path
    }
    
    let refreshPromise = null
    
    async function refreshAccessToken() {
      const refreshToken = getRefreshToken()
      if (!refreshToken) return null
      if (refreshPromise) return refreshPromise
      const refreshUrl = buildUrl('/api/auth/refresh-token')
      refreshPromise = fetch(refreshUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      })
        .then(async (res) => {
          const payload = await res.json().catch(() => ({}))
          if (!res.ok) {
            const err = new Error(payload?.message || 'Không thể làm mới token')
            err.status = res.status
            throw err
          }
          const access = payload?.data?.access_token || payload?.access_token
          const newRefresh = payload?.data?.refresh_token || payload?.refresh_token
          if (access) setAuthToken(access)
          if (newRefresh) setRefreshToken(newRefresh)
          return access
        })
        .catch((err) => {
          logout()
          throw err
        })
        .finally(() => {
          refreshPromise = null
        })
      return refreshPromise
    }
    
    const url = buildUrl(path)
    
    const makeFetch = async () => {
      // Lấy token trực tiếp từ localStorage để đảm bảo
      let token = localStorage.getItem('authToken') || getAuthToken()
      
      if (!token || !token.trim()) {
        throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.')
      }
      
      const opts = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token.trim()}`,
        },
        credentials: 'omit'
      }
      
      // Debug - log để kiểm tra
      console.log('🔍 Preview fetch:', { 
        url, 
        hasToken: !!token, 
        tokenLength: token?.length,
        authorizationHeader: opts.headers.Authorization?.substring(0, 30) + '...'
      })
      
      return fetch(url, opts)
    }
    
    let response
    let retried = false
    const MAX_RETRIES = 1
    let retryCount = 0
    
    while (retryCount <= MAX_RETRIES) {
      try {
        response = await makeFetch()
        console.log('Preview response:', { status: response.status, statusText: response.statusText })
      } catch (e) {
        console.error('Preview fetch error:', e)
        const err = new Error('Không thể kết nối máy chủ. Kiểm tra backend/proxy/URL.')
        err.cause = e
        throw err
      }
      if (response.status === 401 && !retried && retryCount < MAX_RETRIES) {
        try {
          await refreshAccessToken()
          retried = true
          retryCount++
          continue
        } catch (err) {
          throw err
        }
      }
      break
    }
    
    // Xử lý response - nhận HTML thay vì JSON
    const ct = response.headers.get('content-type') || ''
    const data = ct.includes('application/json') ? await response.json() : await response.text()
    
    if (!response.ok) {
      console.error('Preview error response:', { status: response.status, data })
      const err = new Error(data?.message || response.statusText || 'Request error')
      err.status = response.status
      err.data = data
      throw err
    }
    
    // Trả về HTML string
    return data
  },

  // Lấy danh sách themes
  getThemes: () => api.get('/api/resumes/themes').then(pickData),

  // Lấy profile data để tạo CV
  getProfileData: () => api.get('/api/resumes/profile-data').then(pickData),
}

