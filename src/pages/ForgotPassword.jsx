import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthClient } from '../services/authClient'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setDone(false)
    if(!email.trim()){
      setError('Vui lòng nhập email.')
      return
    }
    setLoading(true)
    try {
      await AuthClient.forgotPassword(email.trim())
      setDone(true)
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Gửi yêu cầu thất bại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section" style={{ maxWidth: 520, margin: '40px auto' }}>
      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>Quên mật khẩu</h2>
        <p className="muted" style={{ marginBottom: 18 }}>
          Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
        </p>

        {done && (
          <div style={{ background:'#e6ffed', border:'1px solid #b7eb8f', color:'#2f6b2f', padding:10, borderRadius:8, marginBottom:12 }}>
            Đã gửi email đặt lại mật khẩu (nếu tài khoản tồn tại). Vui lòng kiểm tra hộp thư.
          </div>
        )}
        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={onSubmit} className="form-grid">
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              required
            />
          </label>

          <div className="form-actions">
            <button type="submit" className="btn primary large" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi liên kết'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: 10, textAlign: 'center' }}>
          <Link to="/login">Quay lại đăng nhập</Link>
        </div>
      </div>
    </section>
  )
}
