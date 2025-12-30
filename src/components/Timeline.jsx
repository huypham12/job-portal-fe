import React, { useState } from 'react'
import { Button, Badge, Modal, Input, Textarea, Select } from './shared'
import OfferModal from './OfferModal'
import './Timeline.css'

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

function renderRating(rating) {
  if (!rating || rating <= 0) return '--'
  const validRating = Math.min(5, Math.max(1, Math.floor(rating)))
  const filled = '★'.repeat(validRating)
  const empty = '☆'.repeat(5 - validRating)
  return filled + empty
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

export default function Timeline({ stages, onUpdateStage, onCreateStage, applicationId, candidateName, jobTitle }) {
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleData, setScheduleData] = useState({
    stage_name: '',
    scheduled_at: '',
    interviewer_notes: ''
  })

  const [showEditModal, setShowEditModal] = useState(false)
  const [editingStage, setEditingStage] = useState(null)
  const [editData, setEditData] = useState({
    status: '',
    feedback: '',
    rating: '',
    interviewer_notes: '',
    completed_at: ''
  })

  const [showOfferModal, setShowOfferModal] = useState(false)

  const handleQuickAction = (stage, action) => {
    switch (action) {
      case 'schedule':
        setScheduleData({
          stage_name: stage.stage_name,
          scheduled_at: '',
          interviewer_notes: stage.interviewer_notes || ''
        })
        setShowScheduleModal(true)
        break
      case 'start':
        onUpdateStage(stage.id, { status: 'in_progress' })
        break
      case 'pass':
        onUpdateStage(stage.id, { status: 'passed', completed_at: new Date().toISOString() })
        break
      case 'fail':
        onUpdateStage(stage.id, { status: 'failed', completed_at: new Date().toISOString() })
        break
      case 'edit':
        setEditingStage(stage)
        setEditData({
          status: stage.status || '',
          feedback: stage.feedback || '',
          rating: stage.rating || '',
          interviewer_notes: stage.interviewer_notes || '',
          completed_at: stage.completed_at ? stage.completed_at.slice(0, 16) : ''
        })
        setShowEditModal(true)
        break
      default:
        break
    }
  }

  const handleScheduleInterview = () => {
    if (!scheduleData.stage_name || !scheduleData.scheduled_at) {
      alert('Vui lòng nhập tên stage và thời gian dự kiến.')
      return
    }

    // Find existing stage or create new one
    const existingStage = stages.find(s => s.stage_name === scheduleData.stage_name)
    if (existingStage) {
      onUpdateStage(existingStage.id, {
        scheduled_at: scheduleData.scheduled_at,
        interviewer_notes: scheduleData.interviewer_notes
      })
    } else {
      onCreateStage({
        stage_name: scheduleData.stage_name,
        scheduled_at: scheduleData.scheduled_at,
        interviewer_notes: scheduleData.interviewer_notes
      })
    }

    setShowScheduleModal(false)
    setScheduleData({ stage_name: '', scheduled_at: '', interviewer_notes: '' })
  }

  const handleEditStage = () => {
    if (!editData.status) {
      alert('Vui lòng chọn trạng thái.')
      return
    }

    const payload = {
      status: editData.status,
      feedback: editData.feedback || undefined,
      interviewer_notes: editData.interviewer_notes || undefined,
      completed_at: editData.completed_at || undefined
    }

    const ratingNumber = editData.rating === '' ? null : Number(editData.rating)
    if (!Number.isNaN(ratingNumber) && ratingNumber !== null) {
      payload.rating = ratingNumber
    }

    onUpdateStage(editingStage.id, payload)
    setShowEditModal(false)
    setEditingStage(null)
  }

  const getStageStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'passed':
        return 'success'
      case 'failed':
        return 'danger'
      case 'in_progress':
        return 'info'
      case 'scheduled':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getQuickActions = (stage) => {
    const actions = []

    if (stage.status === 'pending') {
      actions.push(
        <Button key="schedule" variant="outline" size="small" onClick={() => handleQuickAction(stage, 'schedule')}>
          📅 Lên lịch
        </Button>
      )
    }

    if (stage.status === 'scheduled') {
      actions.push(
        <Button key="start" variant="primary" size="small" onClick={() => handleQuickAction(stage, 'start')}>
          ▶️ Bắt đầu
        </Button>
      )
    }

    if (stage.status === 'in_progress') {
      actions.push(
        <Button key="pass" variant="success" size="small" onClick={() => handleQuickAction(stage, 'pass')}>
          ✅ Đạt
        </Button>
      )
      actions.push(
        <Button key="fail" variant="danger" size="small" onClick={() => handleQuickAction(stage, 'fail')}>
          ❌ Không đạt
        </Button>
      )
    }

    // Add "Create Offer" action for passed stages or final stages
    if (stage.status === 'passed' || stage.status === 'completed') {
      actions.push(
        <Button key="offer" variant="primary" size="small" onClick={() => setShowOfferModal(true)}>
          🎯 Tạo Offer
        </Button>
      )
    }

    actions.push(
      <Button key="edit" variant="ghost" size="small" onClick={() => handleQuickAction(stage, 'edit')}>
        ✏️ Chỉnh sửa
      </Button>
    )

    return actions
  }

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <h3>Quy trình tuyển dụng</h3>
        <Button variant="outline" size="small" onClick={() => setShowScheduleModal(true)}>
          ➕ Thêm stage
        </Button>
      </div>

      <div className="timeline">
        {stages.length === 0 ? (
          <div className="timeline-empty">
            <p>Chưa có stage nào. Nhấn "Thêm stage" để bắt đầu.</p>
          </div>
        ) : (
          stages
            .sort((a, b) => (a.stage_order || 0) - (b.stage_order || 0))
            .map((stage, index) => (
              <div key={stage.id || index} className="timeline-item">
                <div className="timeline-indicator">
                  <div className={`timeline-dot ${stage.status || 'pending'}`} />
                  {index < stages.length - 1 && <div className="timeline-line" />}
                </div>
                <div className="timeline-content">
                  <div className="timeline-stage-header">
                    <h4 className="stage-name">{stage.stage_name}</h4>
                    <Badge variant={getStageStatusColor(stage.status)} size="small">
                      {stage.status || 'pending'}
                    </Badge>
                  </div>

                  <div className="timeline-stage-meta">
                    {stage.scheduled_at && (
                      <div className="meta-item">
                        <span className="meta-label">📅 Dự kiến:</span>
                        <span>{formatDate(stage.scheduled_at)}</span>
                      </div>
                    )}
                    {stage.completed_at && (
                      <div className="meta-item">
                        <span className="meta-label">✅ Hoàn thành:</span>
                        <span>{formatDate(stage.completed_at)}</span>
                      </div>
                    )}
                    {stage.rating && (
                      <div className="meta-item">
                        <span className="meta-label">⭐ Rating:</span>
                        <span>{renderRating(stage.rating)}</span>
                      </div>
                    )}
                  </div>

                  {(stage.feedback || stage.interviewer_notes) && (
                    <div className="timeline-stage-details">
                      {stage.feedback && (
                        <p className="stage-feedback"><strong>Feedback:</strong> {stage.feedback}</p>
                      )}
                      {stage.interviewer_notes && (
                        <p className="stage-notes"><strong>Ghi chú:</strong> {stage.interviewer_notes}</p>
                      )}
                    </div>
                  )}

                  <div className="timeline-actions">
                    {getQuickActions(stage)}
                  </div>
                </div>
              </div>
            ))
        )}
      </div>

      {/* Schedule Interview Modal */}
      <Modal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)}>
        <h3 style={{ marginTop: 0 }}>Lên lịch phỏng vấn</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input
            placeholder="Tên stage (VD: Technical Interview)"
            value={scheduleData.stage_name}
            onChange={(e) => setScheduleData({ ...scheduleData, stage_name: e.target.value })}
          />
          <Input
            type="datetime-local"
            placeholder="Thời gian dự kiến"
            value={scheduleData.scheduled_at}
            onChange={(e) => setScheduleData({ ...scheduleData, scheduled_at: e.target.value })}
          />
          <Textarea
            placeholder="Ghi chú cho người phỏng vấn"
            value={scheduleData.interviewer_notes}
            onChange={(e) => setScheduleData({ ...scheduleData, interviewer_notes: e.target.value })}
            rows={3}
          />
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleScheduleInterview}>
              Lên lịch
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Stage Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        <h3 style={{ marginTop: 0 }}>Cập nhật stage</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Select
            value={editData.status}
            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
          >
            <option value="">Chọn trạng thái</option>
            {STAGE_STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </Select>
          <Input
            type="number"
            min={1}
            max={5}
            placeholder="Rating (1-5)"
            value={editData.rating}
            onChange={(e) => setEditData({ ...editData, rating: e.target.value })}
          />
          <Textarea
            placeholder="Feedback"
            value={editData.feedback}
            onChange={(e) => setEditData({ ...editData, feedback: e.target.value })}
            rows={3}
          />
          <Textarea
            placeholder="Ghi chú phỏng vấn"
            value={editData.interviewer_notes}
            onChange={(e) => setEditData({ ...editData, interviewer_notes: e.target.value })}
            rows={3}
          />
          <Input
            type="datetime-local"
            placeholder="Thời gian hoàn thành"
            value={editData.completed_at}
            onChange={(e) => setEditData({ ...editData, completed_at: e.target.value })}
          />
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleEditStage}>
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </Modal>

      {/* Offer Modal */}
      <OfferModal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        applicationId={applicationId}
        candidateName={candidateName}
        jobTitle={jobTitle}
      />
    </div>
  )
}
