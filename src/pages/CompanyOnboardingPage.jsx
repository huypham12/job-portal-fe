import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CompanyOnboardingStepBasic from './CompanyOnboardingStepBasic'
import CompanyOnboardingStepDetails from './CompanyOnboardingStepDetails'
import CompanyOnboardingComplete from './CompanyOnboardingComplete'
import { companyApi } from '../services/companyApi'
import './CompanyOnboarding.css'

export default function CompanyOnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState('basic')
  const [company, setCompany] = useState(null)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const checkCompany = async () => {
      try {
        setChecking(true)
        await companyApi.getMyCompany()
        if (!active) return
        // Đã có công ty -> chuyển thẳng sang trang quản lý
        navigate('/recruiter/company', { replace: true })
        setChecking(false)
      } catch (err) {
        if (!active) return
        if (err?.status === 404) {
          setChecking(false)
          return
        }
        setError(err?.message || 'Không thể kiểm tra hồ sơ công ty.')
        setChecking(false)
      }
    }
    checkCompany()
    return () => {
      active = false
    }
  }, [navigate])

  const handleBasicSuccess = (data) => {
    setCompany(data)
    setStep('details')
  }

  const handleDetailsSuccess = () => {
    setStep('complete')
  }

  const steps = useMemo(
    () => [
      { key: 'basic', label: 'Thông tin cơ bản' },
      { key: 'details', label: 'Chi tiết & pháp lý' },
      { key: 'complete', label: 'Hoàn tất' },
    ],
    []
  )

  const renderStep = () => {
    if (step === 'basic') return <CompanyOnboardingStepBasic onSuccess={handleBasicSuccess} />
    if (step === 'details')
      return (
        <CompanyOnboardingStepDetails
          company={company}
          onBack={() => setStep('basic')}
          onSuccess={handleDetailsSuccess}
        />
      )
    return <CompanyOnboardingComplete />
  }

  if (checking) {
    return (
      <div className="onboarding-shell">
        <div className="loading-block">
          <div className="spinner" aria-hidden />
          <div>Đang kiểm tra trạng thái công ty...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="onboarding-shell">
        <div className="onboarding-card">
          <h3>Có lỗi xảy ra</h3>
          <p className="error-text">{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="onboarding-shell">
      <div className="onboarding-header">
        <div>
          <p className="eyebrow-text">Onboarding Recruiter</p>
          <h1 className="onboarding-title">Tạo hồ sơ công ty để bắt đầu tuyển dụng</h1>
          <p className="muted">
            Chỉ mất vài bước ngắn để xây dựng hồ sơ doanh nghiệp hoàn chỉnh và bắt đầu đăng tin tuyển dụng.
          </p>
        </div>
        <div className="onboarding-meta">
          <div className="mini-card">
            <div className="mini-label">Trạng thái</div>
            <strong>Chưa xác minh</strong>
            <p className="muted small">Bổ sung thông tin để được phê duyệt nhanh.</p>
          </div>
        </div>
      </div>

      <div className="stepper">
        {steps.map((item, idx) => {
          const active = step === item.key
          const done = steps.findIndex((s) => s.key === step) > idx
          return (
            <div key={item.key} className={`step ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
              <div className="step-index">{done ? '✓' : idx + 1}</div>
              <div className="step-body">
                <div className="step-label">{item.label}</div>
                <div className="step-desc">
                  {item.key === 'basic' && 'Thông tin cơ bản công ty'}
                  {item.key === 'details' && 'Chi tiết hồ sơ & pháp lý'}
                  {item.key === 'complete' && 'Hoàn tất hồ sơ'}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {renderStep()}
    </div>
  )
}
