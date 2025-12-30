import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { companyApi } from '../services/companyApi'
import './CompanyOnboarding.css'

export default function RecruiterCompanyGuard({ children }) {
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    const verify = async () => {
      try {
        setError('')
        setStatus('loading')
        await companyApi.getMyCompany()
        if (!active) return
        setStatus('ready')
      } catch (err) {
        if (!active) return
        if (err?.status === 404) {
          navigate('/onboarding/company', { replace: true })
          return
        }
        setError(err?.message || 'Không thể kiểm tra hồ sơ công ty. Vui lòng thử lại.')
        setStatus('error')
      }
    }
    verify()
    return () => {
      active = false
    }
  }, [navigate, refreshKey])

  if (status === 'loading') {
    return (
      <div className="guard-state">
        <div className="spinner" aria-hidden />
        <div>Đang kiểm tra trạng thái doanh nghiệp của bạn...</div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="guard-state error">
        <div role="alert">{error}</div>
        <button className="btn btn-primary" onClick={() => setRefreshKey((k) => k + 1)}>
          Thử lại
        </button>
      </div>
    )
  }

  return children
}
