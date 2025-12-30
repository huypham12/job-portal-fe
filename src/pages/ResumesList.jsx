import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ResumeApi } from '../services/resumeApi'
import UploadResumeModal from '../components/resumes/UploadResumeModal'
import ResumeCard from '../components/resumes/ResumeCard'
import EmptyState from '../components/resumes/EmptyState'
import SkeletonLoader from '../components/resumes/SkeletonLoader'

export default function ResumesList() {
  const navigate = useNavigate()
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [missingProfile, setMissingProfile] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const menuRefs = useRef({})

  useEffect(() => {
    loadResumes()
    
    // Close dropdowns when clicking outside
    const handleClickOutside = (e) => {
      Object.keys(menuRefs.current).forEach((id) => {
        if (menuRefs.current[id] && !menuRefs.current[id].contains(e.target)) {
          // Menu closing handled by ResumeCard component
        }
      })
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const loadResumes = async () => {
    setLoading(true)
    setError('')
    setMissingProfile(false)
    try {
      const data = await ResumeApi.getResumes()
      setResumes(Array.isArray(data) ? data : [])
    } catch (err) {
      const isProfileMissing =
        err?.status === 404 &&
        (err?.message?.toLowerCase()?.includes('profile') ||
          err?.data?.message?.toLowerCase?.()?.includes('profile'))

      if (isProfileMissing) {
        setMissingProfile(true)
        setResumes([])
      } else {
        setError(err?.message || 'Không thể tải danh sách CV.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSetDefault = async (id) => {
    try {
      await ResumeApi.setDefaultResume(id)
      await loadResumes()
    } catch (err) {
      alert(err?.message || 'Không thể đặt CV làm mặc định.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa CV này?')) return
    try {
      await ResumeApi.deleteResume(id)
      await loadResumes()
    } catch (err) {
      alert(err?.message || 'Không thể xóa CV.')
    }
  }

  const handleUploadSuccess = () => {
    loadResumes()
    setUploadModalOpen(false)
  }

  const stats = {
    total: resumes.length,
    active: resumes.filter((r) => r.status === 'active').length,
    default: resumes.filter((r) => r.is_default).length,
  }

  return (
    <section className="section resumes-list-page">
      {/* Hero Section */}
      <div className="resumes-hero">
        <div className="resumes-hero__content">
          <div className="resumes-hero__text">
            <h1 className="resumes-hero__title">Quản lý CV của bạn</h1>
            <p className="resumes-hero__subtitle">
              Tạo, chỉnh sửa và quản lý các CV chuyên nghiệp. Xuất PDF và chia sẻ với nhà tuyển dụng.
            </p>
          </div>
          <div className="resumes-hero__actions">
            <button
              className="btn btn--upload"
              onClick={() => setUploadModalOpen(true)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Tải CV lên
            </button>
            <button
              className="btn btn--create primary"
              onClick={() => navigate('/resumes/create')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Tạo CV mới
            </button>
          </div>
        </div>
        <div className="resumes-hero__stats">
          <div className="resumes-hero__stat">
            <div className="resumes-hero__stat-value">{stats.total}</div>
            <div className="resumes-hero__stat-label">Tổng số CV</div>
          </div>
          <div className="resumes-hero__stat">
            <div className="resumes-hero__stat-value">{stats.active}</div>
            <div className="resumes-hero__stat-label">Đang hoạt động</div>
          </div>
          <div className="resumes-hero__stat">
            <div className="resumes-hero__stat-value">{stats.default}</div>
            <div className="resumes-hero__stat-label">CV mặc định</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="card resumes-content">
        {error && (
          <div className="error-banner resumes-banner">
            {error}
          </div>
        )}

        {loading ? (
          <SkeletonLoader count={3} />
        ) : missingProfile ? (
          <EmptyState
            title="Bạn chưa có hồ sơ"
            description="Vui lòng tạo hồ sơ để sử dụng và quản lý CV của bạn."
            actions={
              <button className="btn primary" onClick={() => navigate('/profile')}>
                Đi đến trang hồ sơ
              </button>
            }
          />
        ) : resumes.length === 0 ? (
          <EmptyState
            title="Chưa có CV nào"
            description="Bắt đầu bằng cách tạo CV mới từ profile của bạn hoặc tải CV file lên."
            actions={
              <>
                <button className="btn" onClick={() => setUploadModalOpen(true)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Tải CV lên
                </button>
                <button className="btn primary" onClick={() => navigate('/resumes/create')}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Tạo CV mới
                </button>
              </>
            }
          />
        ) : (
          <>
            <div className="resumes-list__header">
              <h2 className="resumes-list__title">Danh sách CV ({resumes.length})</h2>
            </div>
            <div className="resumes-list">
              {resumes.map((resume) => (
                <ResumeCard
                  key={resume.id}
                  resume={resume}
                  onSetDefault={handleSetDefault}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {uploadModalOpen && (
        <UploadResumeModal
          open={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </section>
  )
}
