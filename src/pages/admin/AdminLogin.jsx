import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AuthClient } from '../../services/authClient'
import { loginAs, decodeJWT, getAuthToken, logout } from '../../auth/auth.js'
import './styles/admin-login.css'

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await AuthClient.login({ 
        email: form.email.trim(), 
        password: form.password 
      })
      
      const accessToken = response?.data?.access_token || 
                         response?.access_token || 
                         response?.token || 
                         response?.jwt ||
                         getAuthToken()
      
      let apiRole = null
      if (accessToken) {
        const decoded = decodeJWT(accessToken)
        apiRole = decoded?.role
      }
      
      // Kiểm tra role phải là admin
      if (apiRole !== 'admin') {
        setError('Tài khoản này không có quyền quản trị viên.')
        logout()
        setLoading(false)
        return
      }

      loginAs('admin')
      const redirectParam = params.get('redirect')
      const redirect = redirectParam || '/admin/dashboard'
      navigate(redirect, { replace: true })
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Đăng nhập thất bại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-header">
          <div className="admin-login-brand">
            <span className="admin-login-badge">AD</span>
            <span>JobFinder Admin</span>
          </div>
          <h1>Đăng nhập quản trị</h1>
          <p className="admin-login-subtitle">Khu vực dành cho quản trị viên</p>
        </div>

        <form onSubmit={onSubmit} className="admin-login-form">
          <div className="admin-form-field">
            <label>Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              placeholder="admin@example.com"
              autoComplete="off"
              required
            />
          </div>

          <div className="admin-form-field">
            <label>Mật khẩu</label>
            <div className="admin-password-input">
              <input
                name="password"
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={onChange}
                placeholder="********"
                autoComplete="new-password"
                required
              />
              <button 
                type="button" 
                className="admin-toggle-password"
                onClick={() => setShowPass((s) => !s)}
              >
                {showPass ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
          </div>

          {error && (
            <div className="admin-error-banner">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="admin-login-btn"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="admin-login-footer">
          <a href="/login" className="admin-back-link">
            ← Quay lại trang đăng nhập thường
          </a>
        </div>
      </div>
    </div>
  )
}

