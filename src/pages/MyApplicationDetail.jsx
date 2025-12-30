import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApplicationService } from '../lib/api'
import './MyApplicationDetail.css'

const STATUS_LABELS = {
  pending: 'Đang chờ',
  reviewed: 'Đã xem',
  accepted: 'Chấp nhận',
  rejected: 'Từ chối',
  withdrawn: 'Đã rút'
}

function formatDate(dateString) {
  if (!dateString) return '--'
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return '--'
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function MyApplicationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [application, setApplication] = useState(null)
  const [stages, setStages] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [withdrawing, setWithdrawing] = useState(false)
  const [docType, setDocType] = useState('')

  const loadData = async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const res = await ApplicationService.getDetail(id)
      const data = res?.data || res
      setApplication(data)
      const stageRes = await ApplicationService.getStages(id)
      setStages(stageRes?.data || stageRes || [])
      const docsRes = await ApplicationService.getDocuments(id)
      setDocuments(docsRes?.data || docsRes || [])
    } catch (err) {
      setError(err?.message || 'Không thể tải thông tin đơn ứng tuyển.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleWithdraw = async () => {
    if (!window.confirm('Bạn chắc chắn muốn rút đơn này?')) return
    setWithdrawing(true)
    try {
      await ApplicationService.withdraw(id)
      alert('Đã rút đơn thành công.')
      navigate('/applications')
    } catch (err) {
      alert(err?.message || 'Không thể rút đơn. Vui lòng thử lại.')
    } finally {
      setWithdrawing(false)
    }
  }

  const handleUploadDoc = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadProgress(0)

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      await ApplicationService.uploadDocument(id, file, docType || undefined)
      setUploadProgress(100)
      setTimeout(() => {
        setDocType('')
      }, 500)
      await loadData()
    } catch (err) {
      alert(err?.message || 'Tải tài liệu thất bại.')
    } finally {
      clearInterval(progressInterval)
      setTimeout(() => {
        setUploading(false)
        setUploadProgress(0)
        e.target.value = ''
      }, 1000)
    }
  }

  if (loading) {
    return <div className="state-card">Đang tải...</div>
  }

  if (error || !application) {
    return (
      <div className="state-card error">
        <p>{error || 'Không tìm thấy đơn ứng tuyển.'}</p>
        <button className="btn" onClick={() => navigate('/applications')}>Quay lại</button>
      </div>
    )
  }

  const job = application.jobs || application.job || {}

  return (
    <div className="my-application-detail">
      <div className="page-header">
        <div>
          <button className="btn ghost small" onClick={() => navigate(-1)}>← Quay lại</button>
          <h1>{job.title || 'Tin tuyển dụng'}</h1>
          <p className="muted">{job.companies?.name || job.company?.name || 'Nhà tuyển dụng'}</p>
        </div>
        <div className="header-actions">
          <span className="status-pill large">{STATUS_LABELS[application.status] || application.status}</span>
          {application.status !== 'withdrawn' && (
            <button className="btn danger" onClick={handleWithdraw} disabled={withdrawing}>
              {withdrawing ? 'Đang rút...' : 'Rút đơn'}
            </button>
          )}
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <h3>Thông tin đơn</h3>
          <div className="info-row">
            <span className="muted">Ngày nộp</span>
            <span>{formatDate(application.applied_at)}</span>
          </div>
          <div className="info-row">
            <span className="muted">Vị trí</span>
            <span>{job.title || '--'}</span>
          </div>
          <div className="info-row">
            <span className="muted">Stage hiện tại</span>
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
          <div className="info-row">
            <span className="muted">CV</span>
            <span>{application.resume_id ? 'Đã đính kèm' : 'Chưa có'}</span>
          </div>
        </div>

        <div className="detail-card">
          <h3>Quy trình tuyển dụng</h3>
          <div className="stages-list">
            {stages.length === 0 && <p className="muted">Chưa có stage nào.</p>}
            {stages.map((stage) => (
              <div key={stage.id} className={`stage-item ${stage.status === 'scheduled' ? 'scheduled' : ''}`}>
                <div>
                  <div className="stage-title">{stage.stage_name}</div>
                  <div className="muted small">{stage.status || 'pending'}</div>
                  {stage.scheduled_at && (
                    <div className="stage-scheduled">
                      <span className="calendar-icon">📅</span>
                      Dự kiến: {formatDate(stage.scheduled_at)}
                      {stage.status === 'scheduled' && (
                        <button
                          className="btn small outline"
                          onClick={() => {
                            // In a real app, this would add to calendar
                            alert('Tính năng thêm vào lịch sẽ được cập nhật trong phiên bản sau!')
                          }}
                        >
                          Thêm vào lịch
                        </button>
                      )}
                    </div>
                  )}
                  {stage.status === 'passed' && (
                    <div className="stage-success">
                      🎉 Chúc mừng! Bạn đã vượt qua stage này.
                    </div>
                  )}
                  {stage.status === 'failed' && (
                    <div className="stage-failed">
                      😔 Rất tiếc, bạn chưa vượt qua stage này. Nhà tuyển dụng sẽ liên hệ nếu có cơ hội khác.
                    </div>
                  )}
                </div>
                <div className="muted small">
                  {stage.completed_at ? `Hoàn thành: ${formatDate(stage.completed_at)}` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="detail-card">
          <h3>Tài liệu bổ sung</h3>
          <div className="upload-row">
            <input
              type="text"
              placeholder="Loại tài liệu (VD: Portfolio)"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              disabled={uploading}
            />
            <label className={`btn primary ${uploading ? 'uploading' : ''}`}>
              {uploading ? `Đang tải... ${uploadProgress}%` : 'Tải lên'}
              <input type="file" accept=".pdf,.doc,.docx" onChange={handleUploadDoc} hidden disabled={uploading} />
            </label>
          </div>
          {uploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          <div className="documents-list">
            {documents.length === 0 && <p className="muted">Chưa có tài liệu.</p>}
            {documents.map((doc) => (
              <div key={doc.id} className="document-item">
                <div>
                  <div className="doc-name">{doc.document_type || 'Tài liệu'}</div>
                  <div className="muted small">{formatDate(doc.created_at)}</div>
                </div>
                {doc.file_url && (
                  <a className="btn ghost small" href={doc.file_url} target="_blank" rel="noreferrer">Xem</a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

