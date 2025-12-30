import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthClient } from '../services/authClient'

export default function VerifyForgotPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const navigate = useNavigate()
  const [status, setStatus] = useState(token ? 'loading' : 'error')
  const [message, setMessage] = useState(token ? 'Đang kiểm tra mã khôi phục...' : 'Thiếu token xác thực.')
  const [verifiedToken, setVerifiedToken] = useState(token)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!token) return
      try {
        await AuthClient.verifyForgotPassword(token)
        if (cancelled) return
        setStatus('success')
        setMessage('Mã khôi phục hợp lệ. Bạn có thể đặt lại mật khẩu.')
        setVerifiedToken(token)
      } catch (err) {
        if (cancelled) return
        setStatus('error')
        setMessage(err?.data?.message || err?.message || 'Xác thực token thất bại. Vui lòng yêu cầu lại.')
      }
    }
    run()
    return () => { cancelled = true }
  }, [token])

  return (
    <section className="section" style={{ maxWidth: 520, margin: '40px auto' }}>
      <div className="card" style={{ padding: 24, textAlign: 'center' }}>
        <h2 style={{ marginTop: 0 }}>Xác thực khôi phục</h2>
        <p className="muted" style={{ marginBottom: 16 }}>{message}</p>

        {status === 'loading' && <div className="muted">Vui lòng chờ...</div>}

        {status === 'success' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10, alignItems:'center' }}>
            <div style={{ background:'#e6ffed', border:'1px solid #b7eb8f', color:'#2f6b2f', padding:10, borderRadius:8, width:'100%' }}>
              Token đã được xác thực thành công.
            </div>
            <button
              className="btn primary"
              onClick={() => navigate(`/reset-password?token=${encodeURIComponent(verifiedToken)}`)}
            >
              Tiếp tục đặt lại mật khẩu
            </button>
          </div>
        )}

        {status === 'error' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10, alignItems:'center' }}>
            <div className="error-banner" style={{ width:'100%' }}>{message}</div>
            <Link className="btn" to="/forgot-password">Gửi lại yêu cầu</Link>
          </div>
        )}
      </div>
    </section>
  )
}
