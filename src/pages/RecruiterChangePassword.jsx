import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthClient } from '../services/authClient'
import { getAuthToken, getRole } from '../auth/auth'
import './recruiter-dashboard.css'

const passwordSpecial = /[!@#$%^&*(),.?":{}|<>_\-]/

export default function RecruiterChangePassword() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm_password: '' })
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const role = getRole()
    if (role !== 'recruiter' || !getAuthToken()) {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (!form.old_password || !form.new_password || !form.confirm_password) {
      setError('Vui lòng điền đầy đủ thông tin.')
      return
    }
    if (form.new_password.length < 10 || !passwordSpecial.test(form.new_password)) {
      setError('Mật khẩu mới cần tối thiểu 10 ký tự và chứa ký tự đặc biệt.')
      return
    }
    if (form.new_password !== form.confirm_password) {
      setError('Xác nhận mật khẩu không khớp.')
      return
    }
    setLoading(true)
    try {
      await AuthClient.changePassword(form)
      setSuccess('Đổi mật khẩu thành công.')
      setForm({ old_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Đổi mật khẩu thất bại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rcp-shell">
      <div className="rcp-card">
        <header className="rcp-head">
          <div>
            <h1>Đổi mật khẩu</h1>
            <p>Cập nhật mật khẩu để giữ tài khoản của bạn an toàn.</p>
          </div>
          <button className="rcp-link" type="button" onClick={() => navigate('/recruiter/dashboard')}>
            Quay lại dashboard
          </button>
        </header>

        {error && <div className="rd-banner error">{error}</div>}
        {success && <div className="rd-banner success">{success}</div>}

        <form className="rcp-form" onSubmit={submit}>
          <label className="rcp-field">
            <span>Mật khẩu hiện tại</span>
            <div className="rcp-input">
              <input
                type={showOld ? 'text' : 'password'}
                name="old_password"
                placeholder="Nhập mật khẩu hiện tại"
                value={form.old_password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
              <button type="button" onClick={() => setShowOld((show) => !show)}>
                {showOld ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
          </label>

          <label className="rcp-field">
            <span>Mật khẩu mới</span>
            <div className="rcp-input">
              <input
                type={showNew ? 'text' : 'password'}
                name="new_password"
                placeholder="Nhập mật khẩu mới"
                value={form.new_password}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
              <button type="button" onClick={() => setShowNew((show) => !show)}>
                {showNew ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
            {form.new_password && (form.new_password.length < 10 || !passwordSpecial.test(form.new_password)) && (
              <small className="rcp-error">Tối thiểu 10 ký tự và có ký tự đặc biệt.</small>
            )}
          </label>

          <label className="rcp-field">
            <span>Xác nhận mật khẩu mới</span>
            <div className="rcp-input">
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirm_password"
                placeholder="Nhập lại mật khẩu mới"
                value={form.confirm_password}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
              <button type="button" onClick={() => setShowConfirm((show) => !show)}>
                {showConfirm ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
            {form.confirm_password && form.confirm_password !== form.new_password && (
              <small className="rcp-error">Không khớp với mật khẩu mới.</small>
            )}
          </label>

          <div className="rcp-actions">
            <button type="button" className="rcp-btn ghost" onClick={() => navigate('/recruiter/dashboard')}>
              Hủy
            </button>
            <button type="submit" className="rcp-btn primary" disabled={loading}>
              {loading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
