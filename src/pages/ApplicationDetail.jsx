import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApplicationService, UserService } from '../lib/api.js'
import { Button, Card, CardBody, Badge, Input, Textarea, Select, Modal } from '../components/shared'
import ContactCandidateModal from '../components/ContactCandidateModal'
import Timeline from '../components/Timeline'
import '../styles/shared.css'
import './ApplicationDetail.css'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Đang chờ' },
  { value: 'reviewed', label: 'Đã xem' },
  { value: 'accepted', label: 'Chấp nhận' },
  { value: 'rejected', label: 'Từ chối' }
]

const STATUS_LABELS = {
  pending: 'Đang chờ',
  reviewed: 'Đã xem',
  accepted: 'Chấp nhận',
  rejected: 'Từ chối',
  withdrawn: 'Đã rút'
}

const STATUS_COLORS = {
  pending: 'default',
  reviewed: 'info',
  accepted: 'success',
  rejected: 'danger',
  withdrawn: 'default'
}

const STAGE_STATUS_OPTIONS = [
  'pending',
  'scheduled',
  'in_progress',
  'passed',
  'failed',
  'skipped',
  'completed'
]

function formatDate(dateString) {
  if (!dateString) return '--'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '--'
  }
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name[0].toUpperCase()
}

function renderRating(rating) {
  if (!rating || rating <= 0) return '--'
  const validRating = Math.min(5, Math.max(1, Math.floor(rating)))
  const filled = '★'.repeat(validRating)
  const empty = '☆'.repeat(5 - validRating)
  return filled + empty
}

/**
 * Download file from URL
 * @param {string} url - File URL
 * @param {string} filename - Filename for download
 */
async function downloadFile(url, filename) {
  try {
    const token = localStorage.getItem('auth_token')
    const headers = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename || 'cv.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)
  } catch (error) {
    console.error('Download error:', error)
    // Fallback: open in new tab if download fails
    window.open(url, '_blank')
    throw error
  }
}

export default function ApplicationDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [application, setApplication] = useState(null)
  const [stages, setStages] = useState([])
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('info')
  
  // Status management
  const [status, setStatus] = useState('')
  const [statusReason, setStatusReason] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  
  // Stage management
  
  // Notes
  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  
  // Profile modal
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [fullProfile, setFullProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  
  // CV modal
  const [showCVModal, setShowCVModal] = useState(false)
  const [cvData, setCvData] = useState(null)
  const [loadingCV, setLoadingCV] = useState(false)
  const [isShortlisted, setIsShortlisted] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)

  const fetchApplication = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
      try {
        const response = ApplicationService.getDetailRecruiter
          ? await ApplicationService.getDetailRecruiter(id)
          : await ApplicationService.getDetail(id)
      const data = response?.data || response
      console.log('Application data received:', data)
      console.log('Profile data:', data?.profiles)
      setApplication(data)
      setStatus(data.status || 'pending')

      // Đảm bảo notes luôn là mảng để tránh lỗi notes.map is not a function
      const rawNotes = data?.notes
      const normalizedNotes = Array.isArray(rawNotes)
        ? rawNotes
        : rawNotes
          ? [rawNotes]
          : []
      setNotes(normalizedNotes)
      
      // Fetch timeline for recruiter (includes all stages) or stages for candidate
      try {
        const stagesResponse = isRecruiter
          ? await ApplicationService.getTimeline(id)
          : await ApplicationService.getStages(id)
        const stagesData = stagesResponse?.data?.stages || stagesResponse?.data || stagesResponse || []
        setStages(stagesData)
        setStageForm(prev => ({ ...prev, stage_order: stagesData.length + 1 }))
      } catch (err) {
        console.error('Failed to fetch stages:', err)
      }
    } catch (err) {
      console.error('Failed to fetch application:', err)
      setError(err?.message || 'Không thể tải thông tin ứng viên. Vui lòng thử lại.')
      if (err?.status === 401) {
        navigate('/login?role=recruiter&redirect=' + encodeURIComponent(window.location.pathname))
      }
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    fetchApplication()
  }, [fetchApplication])

  const handleUpdateStatus = async () => {
    if (!status) return
    setUpdatingStatus(true)
    try {
      await ApplicationService.updateStatus(id, {
        status,
        reason: statusReason || undefined
      })
      alert('Đã cập nhật trạng thái thành công.')
      fetchApplication()
      setStatusReason('')
    } catch (err) {
      alert(err?.message || 'Không thể cập nhật trạng thái. Vui lòng thử lại.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleCreateStage = async () => {
    if (!stageForm.stage_name) {
      alert('Vui lòng nhập tên stage.')
      return
    }
    try {
      await ApplicationService.createStage(id, stageForm)
      alert('Đã tạo stage thành công.')
      setShowStageModal(false)
      setStageForm({
        stage_name: '',
        stage_order: stages.length + 2,
        scheduled_at: '',
        interviewer_notes: ''
      })
      fetchApplication()
    } catch (err) {
      alert(err?.message || 'Không thể tạo stage. Vui lòng thử lại.')
    }
  }

  const handleUpdateStage = async (stageId, data) => {
    try {
      await ApplicationService.updateStage(id, {
        stage_id: stageId,
        ...data
      })
      alert('Đã cập nhật stage thành công.')
      fetchApplication()
    } catch (err) {
      alert(err?.message || 'Không thể cập nhật stage. Vui lòng thử lại.')
    }
  }


  const handleAddNote = async () => {
    if (!newNote.trim()) {
      alert('Vui lòng nhập nội dung ghi chú.')
      return
    }
    setAddingNote(true)
    try {
      await ApplicationService.addNote(id, newNote)
      setNewNote('')
      fetchApplication()
    } catch (err) {
      alert(err?.message || 'Không thể thêm ghi chú. Vui lòng thử lại.')
    } finally {
      setAddingNote(false)
    }
  }

  const handleDownloadCV = async () => {
    try {
      const response = await ApplicationService.getCVRecruiter(id)
      const data = response?.data || response
      const resume = data?.resume || data
      const fileUrl = resume?.file_url || data?.file_url
      
      if (!fileUrl) {
        alert('CV không có sẵn để tải xuống.')
        return
      }

      // Get filename from resume title or use default
      const filename = resume?.title 
        ? `${resume.title}.pdf`
        : `CV_${application?.profiles?.full_name || 'candidate'}_${new Date().getTime()}.pdf`

      // Show loading indicator
      const downloadBtn = document.querySelector('[data-download-cv]')
      if (downloadBtn) {
        downloadBtn.disabled = true
        downloadBtn.textContent = 'Đang tải...'
      }

      await downloadFile(fileUrl, filename)
      
      if (downloadBtn) {
        downloadBtn.disabled = false
        downloadBtn.textContent = 'Tải CV'
      }
    } catch (err) {
      console.error('Download CV error:', err)
      alert(err?.message || 'Không thể tải CV. Vui lòng thử lại.')
    }
  }

  const handleViewFullProfile = async () => {
    const profileId = application?.profiles?.id || application?.profile_id
    if (!profileId) {
      alert('Không tìm thấy thông tin profile.')
      return
    }
    
    setShowProfileModal(true)
    setLoadingProfile(true)
    try {
      const response = await UserService.getPublicProfile(profileId)
      // API trả về { success, message, data }
      const data = response?.data?.data || response?.data || response
      // Lưu profile (dù rỗng) và giữ modal mở
      setFullProfile(data || {})
    } catch (err) {
      console.error('Failed to fetch profile:', err)
      alert(err?.message || 'Không thể tải thông tin profile. Vui lòng thử lại.')
      setShowProfileModal(false)
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleViewCV = async () => {
    setShowCVModal(true)
    setLoadingCV(true)
    setCvData(null)
    try {
      const response = await ApplicationService.getCVRecruiter(id)
      const data = response?.data || response
      console.log('CV data received:', data)
      setCvData(data)
    } catch (err) {
      console.error('Failed to fetch CV:', err)
      alert(err?.message || 'Không thể tải CV. Vui lòng thử lại.')
      setShowCVModal(false)
    } finally {
      setLoadingCV(false)
    }
  }

  const handleShortlistToggle = async () => {
    const action = isShortlisted ? 'remove' : 'add'

    try {
      await ApplicationService.shortlistCandidate({
        application_id: id,
        action: action
      })

      setIsShortlisted(!isShortlisted)
      const message = action === 'add' ? 'Đã thêm vào shortlist' : 'Đã bỏ khỏi shortlist'
      console.log(message)
    } catch (err) {
      alert(err?.message || 'Không thể cập nhật shortlist. Vui lòng thử lại.')
    }
  }

  if (loading) {
    return (
      <div className="section application-detail-page" role="status" aria-label="Đang tải thông tin ứng viên">
        <Card padding="large">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div aria-hidden="true">Đang tải...</div>
            <div className="loading-spinner" aria-hidden="true"></div>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="section application-detail-page">
        <Card padding="medium" style={{ background: '#fee', border: '1px solid #fcc' }}>
          <p style={{ color: '#c00', margin: 0 }}>{error}</p>
          <Button variant="outline" onClick={fetchApplication} style={{ marginTop: '12px' }}>
            Thử lại
          </Button>
        </Card>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="section application-detail-page">
        <Card padding="large">
          <div style={{ textAlign: 'center' }}>
            <p>Không tìm thấy thông tin ứng viên.</p>
            <Button variant="outline" onClick={() => navigate(-1)} style={{ marginTop: '12px' }}>
              Quay lại
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const profile = application.profiles || application.candidate?.profile || application.candidate || {}
  const name = profile.full_name || profile.display_name || profile.name || 'Chưa có tên'
  const job = application.jobs || {}
  const currentStatus = application.status || 'pending'
  
  console.log('Parsed profile:', profile)
  console.log('Profile years_of_experience:', profile.years_of_experience)
  console.log('Profile location_text:', profile.location_text)
  console.log('Profile desired_job_title:', profile.desired_job_title)

  return (
    <div className="section application-detail-page">
      <div className="application-header">
        <div className="breadcrumb">
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}>
            ← Quay lại
          </button>
        </div>
        <div className="candidate-header-info">
          <div className="candidate-avatar-large">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={name} />
            ) : (
              <span>{getInitials(name)}</span>
            )}
          </div>
          <div>
            <h1 className="candidate-name-large">{name}</h1>
            {profile.headline && (
              <p className="candidate-headline-large">{profile.headline}</p>
            )}
            <Badge
              variant={STATUS_COLORS[currentStatus] || 'default'}
              size="medium"
              style={{ marginTop: '8px' }}
            >
              {STATUS_LABELS[currentStatus] || currentStatus}
            </Badge>
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              <Button
                variant={isShortlisted ? "primary" : "outline"}
                size="small"
                onClick={handleShortlistToggle}
              >
                {isShortlisted ? '★ Đã shortlist' : '☆ Thêm vào shortlist'}
              </Button>
              <Button
                variant="outline"
                size="small"
                onClick={() => setShowContactModal(true)}
              >
                📧 Liên hệ
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="application-content">
        {/* Left Column - Candidate Info */}
        <div className="application-left">
          {/* Profile Card */}
          <Card padding="medium" className="profile-card">
            <h2 className="section-title">Thông tin ứng viên</h2>
            <div className="profile-info">
              {(profile.years_of_experience !== null && profile.years_of_experience !== undefined) && (
                <div className="info-item">
                  <span className="info-label">Kinh nghiệm:</span>
                  {Number(profile.years_of_experience) === 0 ? (
                    <span>Chưa có kinh nghiệm</span>
                  ) : (
                    <span>{profile.years_of_experience} năm</span>
                  )}
                </div>
              )}
              {profile.location_text && (
                <div className="info-item">
                  <span className="info-label">Địa điểm:</span>
                  <span>{profile.location_text}</span>
                </div>
              )}
              {profile.desired_job_title && (
                <div className="info-item">
                  <span className="info-label">Vị trí mong muốn:</span>
                  <span>{profile.desired_job_title}</span>
                </div>
              )}
              {(profile.years_of_experience === null || profile.years_of_experience === undefined) && 
               !profile.location_text && 
               !profile.desired_job_title && (
                <div className="info-item">
                  <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa có thông tin bổ sung</span>
                </div>
              )}
            </div>
            {profile.skills && profile.skills.length > 0 && (
              <div className="skills-section">
                <h3 className="subsection-title">Kỹ năng</h3>
                <div className="skills-list">
                  {profile.skills.slice(0, 10).map((skill, idx) => (
                    <Badge key={idx} variant="default" size="small">
                      {skill.skills?.name || skill.name || skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div style={{ marginTop: '16px' }}>
              <Button variant="outline" size="small" onClick={handleViewFullProfile}>
                Xem profile đầy đủ
              </Button>
            </div>
          </Card>

          {/* CV Section */}
          <Card padding="medium" className="cv-card">
            <h2 className="section-title">CV / Resume</h2>
            <div className="cv-info">
              <p style={{ color: '#64748b', margin: '0 0 12px 0' }}>
                {application.resume_id ? 'CV đã được đính kèm' : 'Chưa có CV'}
              </p>
              {application.resume_id && (
                <div className="cv-actions">
                  <Button 
                    variant="default" 
                    size="small" 
                    onClick={handleDownloadCV}
                    data-download-cv
                  >
                    Tải CV
                  </Button>
                  <Button variant="outline" size="small" onClick={handleViewCV}>
                    Xem CV
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Application Info */}
          <Card padding="medium" className="application-info-card">
            <h2 className="section-title">Thông tin đơn ứng tuyển</h2>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Ngày ứng tuyển:</span>
                <span>{formatDate(application.applied_at)}</span>
              </div>
              {job.title && (
                <div className="info-item">
                  <span className="info-label">Vị trí:</span>
                  <span>{job.title}</span>
                </div>
              )}
              <div className="info-item">
                <span className="info-label">Stage hiện tại:</span>
                <span>
                  {(() => {
                    // Try to get current_stage from application data
                    if (application.current_stage?.stage_name) {
                      return application.current_stage.stage_name
                    }
                    
                    // If not available, find from stages array
                    // Priority: in_progress > pending > scheduled > first stage
                    if (stages && stages.length > 0) {
                      const inProgressStage = stages.find(s => s.status === 'in_progress')
                      if (inProgressStage) return inProgressStage.stage_name
                      
                      const pendingStage = stages.find(s => s.status === 'pending')
                      if (pendingStage) return pendingStage.stage_name
                      
                      const scheduledStage = stages.find(s => s.status === 'scheduled')
                      if (scheduledStage) return scheduledStage.stage_name
                      
                      // Return first stage by order
                      const sortedStages = [...stages].sort((a, b) => (a.stage_order || 0) - (b.stage_order || 0))
                      if (sortedStages.length > 0) return sortedStages[0].stage_name
                    }
                    
                    return '--'
                  })()}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Management */}
        <div className="application-right">
          {/* Status Management */}
          <Card padding="medium" className="status-card">
            <h2 className="section-title">Quản lý trạng thái</h2>
            <div className="status-form">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={STATUS_OPTIONS}
                style={{ marginBottom: '12px' }}
              />
              {status === 'rejected' && (
                <Textarea
                  placeholder="Lý do từ chối (tùy chọn)"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  rows={3}
                  style={{ marginBottom: '12px' }}
                />
              )}
              <Button 
                variant="primary" 
                onClick={handleUpdateStatus}
                disabled={updatingStatus || status === currentStatus}
                style={{ width: '100%' }}
              >
                {updatingStatus ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}
              </Button>
            </div>
          </Card>

          {/* Stages Timeline */}
          <Card padding="medium" className="stages-card">
            <Timeline
              stages={stages}
              onUpdateStage={handleUpdateStage}
              onCreateStage={handleCreateStage}
              applicationId={id}
              candidateName={name}
              jobTitle={job?.title}
            />
          </Card>

          {/* Notes Section */}
          <Card padding="medium" className="notes-card">
            <h2 className="section-title">Ghi chú</h2>
            <div className="notes-list">
              {notes.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
                  Chưa có ghi chú nào
                </p>
              ) : (
                notes.map((note, idx) => (
                  <div key={note.id || idx} className="note-item">
                    <p className="note-content">{note.note || note.content}</p>
                    <p className="note-date">{formatDate(note.created_at || note.date)}</p>
                  </div>
                ))
              )}
            </div>
            <div className="note-form">
              <Textarea
                placeholder="Thêm ghi chú mới..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
                style={{ marginBottom: '12px' }}
              />
              <Button 
                variant="outline" 
                onClick={handleAddNote}
                disabled={addingNote || !newNote.trim()}
                style={{ width: '100%' }}
              >
                {addingNote ? 'Đang thêm...' : 'Thêm ghi chú'}
              </Button>
            </div>
          </Card>

        </div>
      </div>


      {/* Profile Modal */}
      <Modal 
        isOpen={showProfileModal} 
        onClose={() => {
          setShowProfileModal(false)
          setFullProfile(null)
        }}
        style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}
      >
        <div style={{ padding: '20px' }}>
          <h2 style={{ marginTop: 0, marginBottom: '24px' }}>Profile đầy đủ</h2>
          
          {loadingProfile ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Đang tải...</p>
            </div>
          ) : fullProfile ? (
            <div className="full-profile-content">
              {/* Header */}
              <div className="profile-modal-header">
                <div className="candidate-avatar-large">
                  {fullProfile.avatar_url ? (
                    <img src={fullProfile.avatar_url} alt={fullProfile.full_name} />
                  ) : (
                    <span>{getInitials(fullProfile.full_name)}</span>
                  )}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '24px' }}>{fullProfile.full_name || 'Chưa có tên'}</h3>
                  {fullProfile.headline && (
                    <p style={{ margin: '8px 0 0 0', color: '#64748b' }}>{fullProfile.headline}</p>
                  )}
                  {fullProfile.bio && (
                    <p style={{ margin: '12px 0 0 0', color: '#475569' }}>{fullProfile.bio}</p>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="profile-section">
                <h4 className="profile-section-title">Thông tin cơ bản</h4>
                <div className="profile-info-grid">
                  {fullProfile.years_of_experience !== null && fullProfile.years_of_experience !== undefined && (
                    <div className="info-item">
                      <span className="info-label">Kinh nghiệm:</span>
                      {Number(fullProfile.years_of_experience) === 0 ? (
                        <span>Chưa có kinh nghiệm</span>
                      ) : (
                        <span>{fullProfile.years_of_experience} năm</span>
                      )}
                    </div>
                  )}
                  {fullProfile.location_text && (
                    <div className="info-item">
                      <span className="info-label">Địa điểm:</span>
                      <span>{fullProfile.location_text}</span>
                    </div>
                  )}
                  {fullProfile.desired_job_title && (
                    <div className="info-item">
                      <span className="info-label">Vị trí mong muốn:</span>
                      <span>{fullProfile.desired_job_title}</span>
                    </div>
                  )}
                  {fullProfile.desired_salary_min !== null && fullProfile.desired_salary_min !== undefined && (
                    <div className="info-item">
                      <span className="info-label">Mức lương mong muốn:</span>
                      <span>
                        {Number(fullProfile.desired_salary_min).toLocaleString('vi-VN')} {fullProfile.desired_currency || 'VND'}
                      </span>
                    </div>
                  )}
                  {Array.isArray(fullProfile.desired_job_type) && fullProfile.desired_job_type.length > 0 && (
                    <div className="info-item">
                      <span className="info-label">Loại công việc:</span>
                      <span>{fullProfile.desired_job_type.join(', ')}</span>
                    </div>
                  )}
                  {fullProfile.personal_website && (
                    <div className="info-item">
                      <span className="info-label">Website:</span>
                      <a href={fullProfile.personal_website} target="_blank" rel="noopener noreferrer">
                        {fullProfile.personal_website}
                      </a>
                    </div>
                  )}
                  {fullProfile.linkedin_url && (
                    <div className="info-item">
                      <span className="info-label">LinkedIn:</span>
                      <a href={fullProfile.linkedin_url} target="_blank" rel="noopener noreferrer">
                        {fullProfile.linkedin_url}
                      </a>
                    </div>
                  )}
                  {fullProfile.github_url && (
                    <div className="info-item">
                      <span className="info-label">GitHub:</span>
                      <a href={fullProfile.github_url} target="_blank" rel="noopener noreferrer">
                        {fullProfile.github_url}
                      </a>
                    </div>
                  )}
                  {(fullProfile.years_of_experience === null || fullProfile.years_of_experience === undefined) &&
                   !fullProfile.location_text &&
                   !fullProfile.desired_job_title &&
                   (fullProfile.desired_salary_min === null || fullProfile.desired_salary_min === undefined) &&
                   (!Array.isArray(fullProfile.desired_job_type) || fullProfile.desired_job_type.length === 0) &&
                   !fullProfile.personal_website &&
                   !fullProfile.linkedin_url &&
                   !fullProfile.github_url && (
                    <div className="info-item">
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa có thông tin cơ bản</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills */}
              {Array.isArray(fullProfile.skills) && fullProfile.skills.length > 0 && (
                <div className="profile-section">
                  <h4 className="profile-section-title">Kỹ năng</h4>
                  <div className="skills-list">
                    {fullProfile.skills.map((skill, idx) => (
                      <Badge key={idx} variant="default" size="small">
                        {skill.skills?.name || skill.name || skill}
                        {skill.proficiency && ` (${skill.proficiency}/5)`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {(!Array.isArray(fullProfile.skills) || fullProfile.skills.length === 0) && (
                <div className="profile-section">
                  <h4 className="profile-section-title">Kỹ năng</h4>
                  <p style={{ color: '#94a3b8' }}>Chưa cập nhật kỹ năng</p>
                </div>
              )}

              {/* Experiences */}
              {Array.isArray(fullProfile.experiences) && fullProfile.experiences.length > 0 && (
                <div className="profile-section">
                  <h4 className="profile-section-title">Kinh nghiệm làm việc</h4>
                  <div className="experiences-list">
                    {fullProfile.experiences.map((exp, idx) => (
                      <div key={idx} className="experience-item">
                        <h5 style={{ margin: '0 0 8px 0' }}>{exp.position} tại {exp.company_name}</h5>
                        <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '14px' }}>
                          {formatDate(exp.start_date)} - {exp.is_current ? 'Hiện tại' : formatDate(exp.end_date)}
                        </p>
                        {exp.description && (
                          <p style={{ margin: '8px 0 0 0', color: '#475569' }}>{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(!Array.isArray(fullProfile.experiences) || fullProfile.experiences.length === 0) && (
                <div className="profile-section">
                  <h4 className="profile-section-title">Kinh nghiệm làm việc</h4>
                  <p style={{ color: '#94a3b8' }}>Chưa có kinh nghiệm được thêm</p>
                </div>
              )}

              {/* Educations */}
              {Array.isArray(fullProfile.educations) && fullProfile.educations.length > 0 && (
                <div className="profile-section">
                  <h4 className="profile-section-title">Học vấn</h4>
                  <div className="educations-list">
                    {fullProfile.educations.map((edu, idx) => (
                      <div key={idx} className="education-item">
                        <h5 style={{ margin: '0 0 8px 0' }}>{edu.school_name}</h5>
                        {edu.degree && (
                          <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '14px' }}>
                            {edu.degree} {edu.field_of_study && `- ${edu.field_of_study}`}
                          </p>
                        )}
                        <p style={{ margin: '0', color: '#64748b', fontSize: '14px' }}>
                          {formatDate(edu.start_date)} - {edu.end_date ? formatDate(edu.end_date) : 'Hiện tại'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(!Array.isArray(fullProfile.educations) || fullProfile.educations.length === 0) && (
                <div className="profile-section">
                  <h4 className="profile-section-title">Học vấn</h4>
                  <p style={{ color: '#94a3b8' }}>Chưa có thông tin học vấn</p>
                </div>
              )}

              {/* Certifications */}
              {Array.isArray(fullProfile.certifications) && fullProfile.certifications.length > 0 && (
                <div className="profile-section">
                  <h4 className="profile-section-title">Chứng chỉ</h4>
                  <div className="certifications-list">
                    {fullProfile.certifications.map((cert, idx) => (
                      <div key={idx} className="certification-item">
                        <h5 style={{ margin: '0 0 8px 0' }}>{cert.name}</h5>
                        <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '14px' }}>
                          {cert.issuing_org} - {formatDate(cert.issue_date)}
                        </p>
                        {cert.description && (
                          <p style={{ margin: '8px 0 0 0', color: '#475569' }}>{cert.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(!Array.isArray(fullProfile.certifications) || fullProfile.certifications.length === 0) && (
                <div className="profile-section">
                  <h4 className="profile-section-title">Chứng chỉ</h4>
                  <p style={{ color: '#94a3b8' }}>Chưa có chứng chỉ</p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Không tìm thấy thông tin profile.</p>
            </div>
          )}

          <div className="modal-actions" style={{ marginTop: '24px' }}>
              <Button variant="outline" onClick={() => {
                setShowProfileModal(false)
                setFullProfile(null)
              }}>
              Đóng
            </Button>
          </div>
        </div>
      </Modal>

      {/* CV Modal */}
      <Modal 
        isOpen={showCVModal} 
        onClose={() => {
          setShowCVModal(false)
          setCvData(null)
        }}
        style={{ maxWidth: '900px', maxHeight: '90vh' }}
      >
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>
              CV / Resume
              {cvData?.resume?.title && (
                <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#64748b', marginLeft: '8px' }}>
                  - {cvData.resume.title}
                </span>
              )}
            </h2>
            {(() => {
              const resume = cvData?.resume || cvData
              const fileUrl = resume?.file_url || cvData?.file_url
              if (fileUrl) {
                const filename = resume?.title 
                  ? `${resume.title}.pdf`
                  : `CV_${application?.profiles?.full_name || 'candidate'}_${new Date().getTime()}.pdf`
                return (
              <Button 
                variant="primary" 
                size="small"
                    onClick={async () => {
                      try {
                        await downloadFile(fileUrl, filename)
                      } catch (err) {
                        console.error('Download error:', err)
                        alert('Không thể tải CV. Vui lòng thử lại.')
                      }
                    }}
              >
                Tải xuống
              </Button>
                )
              }
              return null
            })()}
          </div>
          
          {loadingCV ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Đang tải CV...</p>
            </div>
          ) : cvData ? (
            <div className="cv-preview-content">
              {(() => {
                const resume = cvData?.resume || cvData
                const fileUrl = resume?.file_url || cvData?.file_url
                
                if (fileUrl) {
                  // Determine file type from URL extension
                  const fileExtension = fileUrl.split('.').pop()?.toLowerCase()
                  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')
                  const isPDF = fileExtension === 'pdf' || fileUrl.includes('pdf')
                  
                  if (isImage) {
                    // Display image
                    return (
                      <div style={{ textAlign: 'center' }}>
                        <img
                          src={fileUrl}
                          alt="CV Preview"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '70vh',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            objectFit: 'contain'
                          }}
                          onError={(e) => {
                            console.error('Image load error:', e)
                            e.target.style.display = 'none'
                            e.target.parentElement.innerHTML = '<p style="color: #ef4444; padding: 20px;">Không thể tải hình ảnh CV. Vui lòng thử tải xuống.</p>'
                          }}
                        />
                      </div>
                    )
                  } else if (isPDF) {
                    // Display PDF in iframe
                    return (
                <iframe
                        src={fileUrl}
                  style={{
                    width: '100%',
                    height: '70vh',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                  title="CV Preview"
                        onError={(e) => {
                          console.error('Iframe load error:', e)
                        }}
                />
                    )
                  } else {
                    // Try iframe for other document types
                    return (
                      <iframe
                        src={fileUrl}
                        style={{
                          width: '100%',
                          height: '70vh',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                        title="CV Preview"
                        onError={(e) => {
                          console.error('Iframe load error:', e)
                        }}
                      />
                    )
                  }
                } else if (cvData.content || resume?.content) {
                  // Display text content
                  return (
                    <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '8px', maxHeight: '70vh', overflow: 'auto' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
                        {cvData.content || resume?.content}
                  </pre>
                </div>
                  )
                } else {
                  // No CV available
                  return (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                      <p style={{ color: '#64748b' }}>CV không có sẵn để xem.</p>
                      <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>
                        Ứng viên chưa đính kèm CV hoặc CV không khả dụng.
                      </p>
                </div>
                  )
                }
              })()}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Không tìm thấy CV.</p>
            </div>
          )}

          <div className="modal-actions" style={{ marginTop: '24px' }}>
            <Button variant="outline" onClick={() => {
              setShowCVModal(false)
              setCvData(null)
            }}>
              Đóng
            </Button>
          </div>
        </div>
      </Modal>

      {/* Contact Candidate Modal */}
      <ContactCandidateModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        applicationId={id}
        candidateName={name}
        jobTitle={job?.title}
        companyName={job?.companies?.name || job?.company?.name}
      />
    </div>
  )
}

