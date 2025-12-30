import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthClient } from '../services/authClient'
import { getAuthToken } from '../auth/auth'

const passwordSpecial = /[!@#$%^&*(),.?":{}|<>_\-]/

export default function ChangePassword() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm_password: '' })
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!getAuthToken()) navigate('/login', { replace: true })
  }, [navigate])

  const onChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if(!form.old_password || !form.new_password || !form.confirm_password){
      setError('Vui lòng điền đầy đủ thông tin.')
      return
    }
    if(form.new_password.length < 10 || !passwordSpecial.test(form.new_password)){
      setError('Mật khẩu mới phải có ít nhất 10 ký tự và ký tự đặc biệt.')
      return
    }
    if(form.new_password !== form.confirm_password){
      setError('Xác nhận mật khẩu không khớp.')
      return
    }
    setLoading(true)
    try{
      await AuthClient.changePassword(form)
      setSuccess('Đổi mật khẩu thành công.')
      setForm({ old_password: '', new_password: '', confirm_password: '' })
    } catch(err){
      setError(err?.data?.message || err?.message || 'Đổi mật khẩu thất bại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section" style={{ maxWidth: 520, margin: '40px auto' }}>
      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>Đổi mật khẩu</h2>
        <p className="muted" style={{ marginBottom: 12 }}>
          Vui lòng nhập mật khẩu hiện tại và mật khẩu mới của bạn.
        </p>

        {error && <div className="error-banner">{error}</div>}
        {success && (
          <div style={{ background:'#e6ffed', border:'1px solid #b7eb8f', color:'#2f6b2f', padding:10, borderRadius:8, marginBottom:12 }}>
            {success}
          </div>
        )}

        <form onSubmit={onSubmit} className="form-grid">
          <label className="field">
            <span>Mật khẩu hiện tại</span>
            <div style={{display:'flex', gap:8, alignItems:'center', width:'100%'}}>
              <input
                style={{flex:1}}
                type={showOld ? 'text' : 'password'}
                name="old_password"
                placeholder="********"
                value={form.old_password}
                onChange={onChange}
                autoComplete="current-password"
                required
              />
              <button type="button" className="btn" onClick={()=>setShowOld(s=>!s)}>{showOld ? 'Ẩn' : 'Hiện'}</button>
            </div>
          </label>

          <label className="field">
            <span>Mật khẩu mới</span>
            <div style={{display:'flex', gap:8, alignItems:'center', width:'100%'}}>
              <input
                style={{flex:1}}
                type={showNew ? 'text' : 'password'}
                name="new_password"
                placeholder="********"
                value={form.new_password}
                onChange={onChange}
                autoComplete="new-password"
                required
              />
              <button type="button" className="btn" onClick={()=>setShowNew(s=>!s)}>{showNew ? 'Ẩn' : 'Hiện'}</button>
            </div>
            {form.new_password && (form.new_password.length < 10 || !passwordSpecial.test(form.new_password)) && (
              <div className="field-error">Tối thiểu 10 ký tự và ký tự đặc biệt.</div>
            )}
          </label>

          <label className="field">
            <span>Xác nhận mật khẩu mới</span>
            <input
              type={showNew ? 'text' : 'password'}
              name="confirm_password"
              placeholder="********"
              value={form.confirm_password}
              onChange={onChange}
              autoComplete="new-password"
              required
            />
            {form.confirm_password && form.confirm_password !== form.new_password && (
              <div className="field-error">Không khớp.</div>
            )}
          </label>

          <div className="form-actions">
            <button type="submit" className="btn primary large" disabled={loading}>
              {loading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
