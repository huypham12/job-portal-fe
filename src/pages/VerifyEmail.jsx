import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AuthClient } from '../services/authClient'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const navigate = useNavigate()
  const [status, setStatus] = useState(token ? 'loading' : 'error')
  const [message, setMessage] = useState(token ? 'Đang xác thực email...' : 'Thiếu mã xác thực.')

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!token) return
      try {
        await AuthClient.verifyEmail(token)
        if (cancelled) return
        setStatus('success')
        setMessage('Email của bạn đã được xác thực thành công. Bạn có thể đăng nhập ngay.')
      } catch (err) {
        if (cancelled) return
        setStatus('error')
        setMessage(err?.data?.message || err?.message || 'Xác thực thất bại. Vui lòng thử lại.')
      }
    }
    run()
    return () => { cancelled = true }
  }, [token])

  return (
    <section className="section" style={{ maxWidth: 520, margin: '40px auto' }}>
      <div className="card" style={{ padding: 20, textAlign: 'center' }}>
        <h2 style={{ marginTop: 0 }}>Xác thực email</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          {message}
        </p>
        {status === 'loading' && <div className="muted">Vui lòng chờ trong giây lát...</div>}
        {status === 'success' && (
          <button className="btn primary" style={{ marginTop: 12 }} onClick={() => navigate('/login')}>
            Đi tới đăng nhập
          </button>
        )}
        {status === 'error' && (
          <button className="btn" style={{ marginTop: 12 }} onClick={() => navigate('/login')}>
            Quay lại đăng nhập
          </button>
        )}
      </div>
    </section>
  )
}
