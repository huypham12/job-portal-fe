import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthClient } from '../services/authClient'

const passwordSpecial = /[!@#$%^&*(),.?":{}|<>_\-]/

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [token, setToken] = useState(params.get('token') || '')
  const [form, setForm] = useState({ new_password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    const t = params.get('token')
    if(t) setToken(t)
  }, [params])

  const onChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setDone(false)
    if(!token){
      setError('Không tìm thấy token trong liên kết. Vui lòng mở lại liên kết trong email.')
      return
    }
    if(form.new_password.length < 10 || !passwordSpecial.test(form.new_password)){
      setError('Mật khẩu mới phải có ít nhất 10 ký tự và ký tự đặc biệt.')
      return
    }
    if(form.new_password !== form.confirm){
      setError('Xác nhận mật khẩu không khớp.')
      return
    }
    setLoading(true)
    try {
      await AuthClient.resetPassword({ token, new_password: form.new_password })
      setDone(true)
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Đặt lại mật khẩu thất bại.')
    } finally {
      setLoading(false)
    }
  }

  if(done){
    return (
      <section className="section" style={{ maxWidth: 520, margin: '40px auto' }}>
        <div className="card" style={{ padding: 24, textAlign:'center' }}>
          <h2 style={{ marginTop: 0 }}>Đặt lại thành công</h2>
          <p className="muted" style={{ marginBottom: 16 }}>
            Mật khẩu mới đã được cập nhật. Bạn có thể đăng nhập với mật khẩu mới.
          </p>
          <button className="btn primary" onClick={() => navigate('/login')}>Đi đến đăng nhập</button>
        </div>
      </section>
    )
  }

  return (
    <section className="section" style={{ maxWidth: 520, margin: '40px auto' }}>
      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>Đặt lại mật khẩu</h2>
        <p className="muted" style={{ marginBottom: 12 }}>
          Mật khẩu mới sẽ được cập nhật bằng token trong liên kết email.
        </p>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={onSubmit} className="form-grid">
          <label className="field">
            <span>Mật khẩu mới</span>
            <div style={{display:'flex', gap:8, alignItems:'center', width:'100%'}}>
              <input
                style={{flex:1}}
                type={showPass ? 'text' : 'password'}
                name="new_password"
                placeholder="**********"
                value={form.new_password}
                onChange={onChange}
                required
              />
              <button type="button" className="btn" onClick={()=>setShowPass(s=>!s)}>{showPass ? 'Ẩn' : 'Hiện'}</button>
            </div>
            {form.new_password && (form.new_password.length < 10 || !passwordSpecial.test(form.new_password)) && (
              <div className="field-error">Tối thiểu 10 ký tự và ký tự đặc biệt.</div>
            )}
          </label>
          <label className="field">
            <span>Xác nhận</span>
            <input
              type={showPass ? 'text' : 'password'}
              name="confirm"
              placeholder="**********"
              value={form.confirm}
              onChange={onChange}
              required
            />
            {form.confirm && form.confirm !== form.new_password && (
              <div className="field-error">Không khớp.</div>
            )}
          </label>

          <div className="form-actions">
            <button type="submit" className="btn primary large" disabled={loading}>
              {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: 10, textAlign: 'center' }}>
          <Link to="/forgot-password">Gửi lại email khôi phục</Link>
        </div>
      </div>
    </section>
  )
}
