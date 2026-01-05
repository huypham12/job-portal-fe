import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthClient } from '../services/authClient'
import { loginAs, loginWithGoogle, logout, decodeJWT, getAuthToken } from '../auth/auth.js'

export default function Login() {
  const [tab, setTab] = useState('candidate') // candidate | recruiter
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const normalizeRole = (role, fallback) => {
    if (typeof role !== 'string') return fallback
    const normalized = role.toLowerCase()
    if (['recruiter'].includes(normalized)) return 'recruiter'
    // Accept both backend 'candidate' and legacy 'seeker' strings, normalize to 'candidate'
    if (['candidate', 'seeker'].includes(normalized)) return 'candidate'
    return fallback
  }

  const resolveRedirect = async (role) => {
    const redirectParam = params.get('redirect')
    const requestedRole = params.get('role')
    const roleMatchesQuery =
      !requestedRole ||
      (role === 'recruiter' && (requestedRole === 'recruiter')) ||
      (role === 'seeker' && (requestedRole === 'seeker' || requestedRole === 'candidate'))
    if (redirectParam && roleMatchesQuery) return redirectParam
    if (role === 'recruiter') return '/recruiter/dashboard'
    return '/'
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const fallbackRole = tab === 'recruiter' ? 'recruiter' : 'candidate'
      const response = await AuthClient.login({ email: form.email.trim(), password: form.password })
      
      // Lấy access token giống như AuthClient.login() đã làm
      // Backend trả về: { statusCode, message, data: { access_token, refresh_token } }
      const accessToken = response?.data?.access_token || 
                         response?.access_token || 
                         response?.token || 
                         response?.jwt ||
                         getAuthToken() // Fallback: lấy từ localStorage sau khi AuthClient.login đã lưu
      
      // Decode JWT để lấy role từ payload
      let apiRole = null
      if (accessToken) {
        const decoded = decodeJWT(accessToken)
        apiRole = decoded?.role
      }
      
      // Debug logging
      if (!apiRole) {
        console.error('=== LOGIN DEBUG ===')
        console.error('Response:', response)
        console.error('Access Token:', accessToken ? accessToken.substring(0, 50) + '...' : 'NOT FOUND')
        console.error('Token from localStorage:', getAuthToken() ? getAuthToken().substring(0, 50) + '...' : 'NOT FOUND')
        if (accessToken) {
          const decoded = decodeJWT(accessToken)
          console.error('Decoded JWT:', decoded)
          console.error('Role in JWT:', decoded?.role)
        }
        console.error('==================')
      }
      
      const resolvedRole = normalizeRole(apiRole, fallbackRole)

      // Yêu cầu backend trả role, nếu không có thì chặn và báo đúng thông điệp theo tab
      if (!apiRole) {
        if (tab === 'candidate') {
          setError('Bạn chưa tạo tài khoản Người tìm việc. Vui lòng đăng nhập với tư cách Nhà tuyển dụng.')
        } else {
          setError('Bạn chưa tạo tài khoản Nhà tuyển dụng. Vui lòng đăng nhập với tư cách Người tìm việc.')
        }
        logout()
        setLoading(false)
        return
      }

      if (tab === 'candidate' && resolvedRole !== 'candidate') {
        setError('Tài khoản Nhà tuyển dụng chưa tạo tài khoản Người tìm việc. Vui lòng đăng nhập với tư cách Nhà tuyển dụng.')
        logout()
        setLoading(false)
        return
      }
      if (tab === 'recruiter' && resolvedRole !== 'recruiter') {
        setError('Tài khoản Ứng viên chưa tạo tài khoản Nhà tuyển dụng. Vui lòng đăng nhập với tư cách Người tìm việc.')
        logout()
        setLoading(false)
        return
      }

      loginAs(resolvedRole)
      const redirect = await resolveRedirect(resolvedRole)
      navigate(redirect, { replace: true })
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Đăng nhập thất bại.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const wantedRole = params.get('role')
    if (wantedRole === 'recruiter') setTab('recruiter')
    if (wantedRole === 'candidate' || wantedRole === 'seeker') setTab('seeker')
  }, [params])

  useEffect(() => {
    setForm({ email: '', password: '' })
  }, [tab])

  return (
    <section className="section" style={{ maxWidth: 920, margin: '40px auto' }}>
      <div className="card auth-card auth-grid">
        <div className="auth-side">
          <div className="brand" style={{ marginBottom: 12 }}>
            <span className="brand-badge">JF</span>
            <span>JobFinder</span>
          </div>
          <h2 style={{ margin: '0 0 6px' }}>Chào mừng trở lại!</h2>
          <div className="muted">Tìm việc nhanh hơn hoặc thu hút nhân tài tốt hơn.</div>
          <ul className="auth-points">
            <li>Hàng ngàn công việc mới mỗi ngày</li>
            <li>Theo dõi tin tuyển và gửi CV phù hợp</li>
            <li>Dành cho NTD và người tìm việc</li>
          </ul>
        </div>

        <div className="auth-form">
          <div className="tabs">
            <button className={`tab${tab === 'seeker' ? ' active' : ''}`} onClick={() => setTab('seeker')}>
              Người tìm việc
            </button>
            <button className={`tab${tab === 'recruiter' ? ' active' : ''}`} onClick={() => setTab('recruiter')}>
              Nhà tuyển dụng
            </button>
          </div>

          <form onSubmit={onSubmit} className="form-grid">
            <label className="field">
              <span>Email</span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                placeholder="you@example.com"
                autoComplete="off"
                required
              />
            </label>
            <label className="field">
              <span>Mật khẩu</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                <input
                  style={{ flex: 1 }}
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={onChange}
                  placeholder="********"
                  autoComplete="new-password"
                  required
                />
                <button type="button" className="btn" onClick={() => setShowPass((s) => !s)}>
                  {showPass ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </label>

            {error && <div className="error-banner">{error}</div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <Link className="muted" to="/forgot-password">Quên mật khẩu?</Link>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading} className="btn primary large">
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </div>

            <div className="muted" style={{ textAlign: 'center', marginTop: 6 }}>hoặc</div>
            <div className="social-login">
              <button
                type="button"
                className="social-btn google"
                onClick={async () => {
                  setLoading(true)
                  const role = tab === 'recruiter' ? 'recruiter' : 'seeker'
                  loginWithGoogle(role)
                  const redirect = await resolveRedirect(role)
                  navigate(redirect, { replace: true })
                  setLoading(false)
                }}
              >
                <span className="g-logo">G</span> Tiếp tục với Google
              </button>
            </div>

            <div style={{ marginTop: 10, textAlign: 'center' }}>
              <span className="muted">Chưa có tài khoản? </span>
              <Link to={`/register?role=${tab === 'recruiter' ? 'recruiter' : 'candidate'}`}>Đăng ký</Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
