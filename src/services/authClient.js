import { api } from '../lib/api'
import { setAuthToken, setRefreshToken } from '../auth/auth'

// Adjust endpoint paths to match your backend router
// Example assumes: POST /api/auth/login
export const AuthClient = {
  login: async ({ email, password }) => {
    const res = await api.post('/api/auth/login', { email, password })
    // Backend sample returns: { statusCode, message, data: { access_token, refresh_token } }
    const access = res?.data?.access_token || res?.access_token || res?.token || res?.jwt
    const refresh = res?.data?.refresh_token
    if(access) setAuthToken(access)
    if(refresh) setRefreshToken(refresh)
    return res
  },
  // Register expects: { name, email, password, confirm_password, date_of_birth(YYYY-MM-DD), role }
  register: async ({ name, email, password, confirm_password, date_of_birth, role }) =>
    api.post('/api/auth/register', { name, email, password, confirm_password, date_of_birth, role }),
  verifyEmail: async (token) => api.post('/api/auth/verify-email', { token }),
  logout: async (refresh_token) => api.post('/api/auth/logout', { refresh_token }),
  refresh: async (refresh_token) => api.post('/api/auth/refresh-token', { refresh_token }),
  forgotPassword: async (email) => api.post('/api/auth/forgot-password', { email }),
  verifyForgotPassword: async (token) =>
    api.post('/api/auth/verify-forgot-password', {}, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
  resetPassword: async ({ token, new_password }) => {
    const res = await api.post('/api/auth/reset-password', { token, new_password }, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    const access = res?.data?.access_token || res?.access_token
    const refresh = res?.data?.refresh_token
    if(access) setAuthToken(access)
    if(refresh) setRefreshToken(refresh)
    return res
  },
  changePassword: async ({ old_password, new_password, confirm_password }) =>
    api.patch('/api/auth/change-password', { old_password, new_password, confirm_password }),
}
