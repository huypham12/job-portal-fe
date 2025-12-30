import React, { useState, useEffect } from 'react'
import { ApplicationService } from '../lib/api.js'
import { Modal, Button, Badge } from './shared'
import './CompareModal.css'

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name[0].toUpperCase()
}

function formatDate(dateString) {
  if (!dateString) return '--'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
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

export default function CompareModal({ isOpen, onClose, candidateIds }) {
  const [comparisonData, setComparisonData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen && candidateIds && candidateIds.length >= 2 && candidateIds.length <= 4) {
      fetchComparisonData()
    }
  }, [isOpen, candidateIds])

  const fetchComparisonData = async () => {
    if (!candidateIds || candidateIds.length < 2 || candidateIds.length > 4) return

    setLoading(true)
    setError(null)

    try {
      const response = await ApplicationService.compareCandidates({
        application_ids: candidateIds
      })

      setComparisonData(response?.data || response)
    } catch (err) {
      console.error('Failed to compare candidates:', err)
      setError(err?.message || 'Không thể so sánh ứng viên. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setComparisonData(null)
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} style={{ maxWidth: '1200px', maxHeight: '90vh' }}>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0 }}>So sánh ứng viên ({candidateIds?.length || 0})</h2>
          <Button variant="outline" size="small" onClick={handleClose}>
            Đóng
          </Button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Đang tải dữ liệu so sánh...</p>
          </div>
        )}

        {error && (
          <div style={{ background: '#fee', border: '1px solid #fcc', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
            <p style={{ color: '#c00', margin: 0 }}>{error}</p>
            <Button variant="outline" size="small" onClick={fetchComparisonData} style={{ marginTop: '12px' }}>
              Thử lại
            </Button>
          </div>
        )}

        {!loading && !error && comparisonData && (
          <div className="comparison-container">
            {/* Header Row with candidate names */}
            <div className="comparison-header">
              <div className="comparison-cell comparison-label-cell">
                <strong>Thông tin</strong>
              </div>
              {comparisonData.map((candidate, index) => {
                const profile = candidate.profiles || candidate.candidate || {}
                const name = profile.full_name || profile.display_name || profile.name || 'Chưa có tên'

                return (
                  <div key={candidate.id || index} className="comparison-cell comparison-candidate-cell">
                    <div className="candidate-avatar-large">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={name} />
                      ) : (
                        <span>{getInitials(name)}</span>
                      )}
                    </div>
                    <h4 style={{ margin: '8px 0 4px 0', fontSize: '16px' }}>{name}</h4>
                    {profile.headline && (
                      <p style={{ margin: '0', color: '#64748b', fontSize: '14px' }}>{profile.headline}</p>
                    )}
                    <Badge variant="default" size="small" style={{ marginTop: '8px' }}>
                      {candidate.status || 'pending'}
                    </Badge>
                  </div>
                )
              })}
            </div>

            {/* Basic Information */}
            <div className="comparison-section">
              <h3 className="section-title">Thông tin cơ bản</h3>

              <div className="comparison-row">
                <div className="comparison-cell comparison-label-cell">
                  <strong>Kinh nghiệm</strong>
                </div>
                {comparisonData.map((candidate, index) => {
                  const profile = candidate.profiles || candidate.candidate || {}
                  const experience = profile.years_of_experience

                  return (
                    <div key={candidate.id || index} className="comparison-cell">
                      {experience !== null && experience !== undefined
                        ? (Number(experience) === 0 ? 'Chưa có kinh nghiệm' : `${experience} năm`)
                        : '--'
                      }
                    </div>
                  )
                })}
              </div>

              <div className="comparison-row">
                <div className="comparison-cell comparison-label-cell">
                  <strong>Địa điểm</strong>
                </div>
                {comparisonData.map((candidate, index) => {
                  const profile = candidate.profiles || candidate.candidate || {}

                  return (
                    <div key={candidate.id || index} className="comparison-cell">
                      {profile.location_text || '--'}
                    </div>
                  )
                })}
              </div>

              <div className="comparison-row">
                <div className="comparison-cell comparison-label-cell">
                  <strong>Vị trí mong muốn</strong>
                </div>
                {comparisonData.map((candidate, index) => {
                  const profile = candidate.profiles || candidate.candidate || {}

                  return (
                    <div key={candidate.id || index} className="comparison-cell">
                      {profile.desired_job_title || '--'}
                    </div>
                  )
                })}
              </div>

              <div className="comparison-row">
                <div className="comparison-cell comparison-label-cell">
                  <strong>Mức lương mong muốn</strong>
                </div>
                {comparisonData.map((candidate, index) => {
                  const profile = candidate.profiles || candidate.candidate || {}
                  const salary = profile.desired_salary_min
                  const currency = profile.desired_currency || 'VND'

                  return (
                    <div key={candidate.id || index} className="comparison-cell">
                      {salary ? `${Number(salary).toLocaleString('vi-VN')} ${currency}` : '--'}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Application Information */}
            <div className="comparison-section">
              <h3 className="section-title">Thông tin ứng tuyển</h3>

              <div className="comparison-row">
                <div className="comparison-cell comparison-label-cell">
                  <strong>Vị trí ứng tuyển</strong>
                </div>
                {comparisonData.map((candidate, index) => {
                  const job = candidate.jobs || candidate.job || {}

                  return (
                    <div key={candidate.id || index} className="comparison-cell">
                      {job.title || '--'}
                    </div>
                  )
                })}
              </div>

              <div className="comparison-row">
                <div className="comparison-cell comparison-label-cell">
                  <strong>Ngày ứng tuyển</strong>
                </div>
                {comparisonData.map((candidate, index) => (
                  <div key={candidate.id || index} className="comparison-cell">
                    {formatDate(candidate.applied_at)}
                  </div>
                ))}
              </div>

              <div className="comparison-row">
                <div className="comparison-cell comparison-label-cell">
                  <strong>Stage hiện tại</strong>
                </div>
                {comparisonData.map((candidate, index) => (
                  <div key={candidate.id || index} className="comparison-cell">
                    {candidate.current_stage?.stage_name || '--'}
                  </div>
                ))}
              </div>

              <div className="comparison-row">
                <div className="comparison-cell comparison-label-cell">
                  <strong>Rating</strong>
                </div>
                {comparisonData.map((candidate, index) => (
                  <div key={candidate.id || index} className="comparison-cell">
                    {candidate.current_stage?.rating
                      ? renderRating(candidate.current_stage.rating)
                      : '--'
                    }
                  </div>
                ))}
              </div>
            </div>

            {/* Skills Comparison */}
            <div className="comparison-section">
              <h3 className="section-title">Kỹ năng</h3>
              <div className="skills-comparison">
                {comparisonData.map((candidate, index) => {
                  const profile = candidate.profiles || candidate.candidate || {}
                  const skills = Array.isArray(profile.skills) ? profile.skills : []

                  return (
                    <div key={candidate.id || index} className="skills-column">
                      <h4>Kỹ năng của ứng viên {index + 1}</h4>
                      <div className="skills-list">
                        {skills.length === 0 ? (
                          <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa cập nhật kỹ năng</p>
                        ) : (
                          skills.slice(0, 8).map((skill, skillIndex) => (
                            <Badge key={skillIndex} variant="default" size="small" style={{ margin: '2px' }}>
                              {skill.skills?.name || skill.name || skill}
                              {skill.proficiency && ` (${skill.proficiency}/5)`}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button variant="outline" onClick={handleClose}>
                Đóng
              </Button>
              <Button variant="primary" onClick={handleClose}>
                Xem chi tiết từng ứng viên
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
