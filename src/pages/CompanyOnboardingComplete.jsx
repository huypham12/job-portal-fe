import { Link, useNavigate } from 'react-router-dom'
import './CompanyOnboarding.css'

export default function CompanyOnboardingComplete() {
  const navigate = useNavigate()
  return (
    <div className="onboarding-card success-card">
      <div className="success-icon" aria-hidden>✓</div>
      <h2>Hồ sơ công ty đã được tạo</h2>
      <p className="muted">
        Trạng thái: đang chờ xác minh. Chúng tôi sẽ thông báo khi hồ sơ được phê duyệt.
      </p>
      <div className="form-actions center">
        <button className="btn btn-primary" onClick={() => navigate('/recruiter/company')}>
          Đi tới trang quản lý công ty
        </button>
        <Link className="btn" to="/recruiter/dashboard">Quay lại dashboard</Link>
      </div>
    </div>
  )
}
