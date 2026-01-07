import { useState } from "react"
import { Button, Card, CardBody, Badge } from '../../components/shared'

function TalentPoolResults({ candidates, loading, onSaveCandidate, onBulkSaveCandidates, selectedJobId }) {
  const [selectedCandidates, setSelectedCandidates] = useState(new Set())
  const [bulkSaving, setBulkSaving] = useState(false)

  const handleSelectCandidate = (candidateId) => {
    const newSelected = new Set(selectedCandidates)
    if (newSelected.has(candidateId)) {
      newSelected.delete(candidateId)
    } else {
      newSelected.add(candidateId)
    }
    setSelectedCandidates(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedCandidates.size === candidates.length) {
      setSelectedCandidates(new Set())
    } else {
      setSelectedCandidates(new Set(candidates.map(c => c.id)))
    }
  }

  const handleBulkSave = async () => {
    setBulkSaving(true)
    try {
      await onBulkSaveCandidates(Array.from(selectedCandidates))
      setSelectedCandidates(new Set())
    } catch (error) {
      console.error('Bulk save failed:', error)
      // Error handling is done in the parent component
    } finally {
      setBulkSaving(false)
    }
  }

  const handleExport = () => {
    // Basic CSV export functionality
    if (candidates.length === 0) return

    const headers = ['Tên', 'Vị trí', 'Địa điểm', 'Kinh nghiệm', 'Điểm phù hợp']
    const csvContent = [
      headers.join(','),
      ...candidates.map(candidate => {
        const data = candidate._source || candidate
        return [
          `"${data.full_name || data.display_name || 'N/A'}"`,
          `"${data.headline || data.current_position || 'N/A'}"`,
          `"${data.location_text || 'N/A'}"`,
          data.years_of_experience || 0,
          candidate.score_percent || 0
        ].join(',')
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `matching-results-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="loading-skeleton">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="candidate-skeleton">
            <CardBody>
              <div className="skeleton-avatar"></div>
              <div className="skeleton-text"></div>
              <div className="skeleton-text short"></div>
            </CardBody>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="talent-pool-results">
      {/* Bulk Actions */}
      {selectedCandidates.size > 0 && (
        <Card className="bulk-actions">
          <CardBody>
            <div className="bulk-info">
              <span>Đã chọn {selectedCandidates.size} ứng viên</span>
            </div>
            <div className="bulk-buttons">
              <Button variant="outline" onClick={() => setSelectedCandidates(new Set())}>
                Bỏ chọn
              </Button>
              <Button
                variant="primary"
                onClick={handleBulkSave}
                loading={bulkSaving}
                disabled={bulkSaving}
              >
                Lưu vào Talent Pool
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Results Header */}
      <div className="results-header">
        <div className="results-info">
          <h3>Kết quả tìm kiếm ({candidates.length} ứng viên)</h3>
          {candidates.length > 0 && (
            <div className="select-all">
              <label>
                <input
                  type="checkbox"
                  checked={selectedCandidates.size === candidates.length && candidates.length > 0}
                  onChange={handleSelectAll}
                  className="rd-checkbox"
                />
                Chọn tất cả
              </label>
            </div>
          )}
        </div>
        {candidates.length > 0 && (
          <div className="results-actions">
            <Button variant="outline" size="sm" onClick={handleExport}>Xuất danh sách</Button>
          </div>
        )}
      </div>

      {/* Candidates Grid */}
      {candidates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3 className="empty-title">Không tìm thấy ứng viên phù hợp</h3>
          <p className="empty-description">Thử điều chỉnh bộ lọc hoặc chọn vị trí khác</p>
        </div>
      ) : (
        <div className="candidates-grid">
          {candidates.map((candidate) => (
            <MatchingCandidateCard
              key={candidate.id}
              candidate={candidate}
              isSelected={selectedCandidates.has(candidate.id)}
              onSelect={() => handleSelectCandidate(candidate.id)}
              onSave={() => onSaveCandidate(candidate.id)}
              selectedJobId={selectedJobId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MatchingCandidateCard({ candidate, isSelected, onSelect, onSave, selectedJobId }) {
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(candidate.id)
    } catch (error) {
      console.error('Save candidate failed:', error)
    } finally {
      setSaving(false)
    }
  }

  // Extract data from candidate response
  const candidateData = candidate._source || candidate
  const scorePercent = candidate.score_percent || 0
  const explanation = candidate.explanation || {}

  return (
    <Card className={`candidate-card ${isSelected ? 'selected' : ''}`}>
      <CardBody>
        {/* Selection Checkbox */}
        <div className="candidate-selection">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="candidate-checkbox"
          />
        </div>

        {/* Header */}
        <div className="candidate-header">
          <div className="candidate-avatar">
            {candidateData.avatar_url ? (
              <img src={candidateData.avatar_url} alt={candidateData.full_name} />
            ) : (
              <div className="avatar-placeholder">
                {(candidateData.full_name || candidateData.display_name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="candidate-info">
            <h4>{candidateData.full_name || candidateData.display_name || 'Chưa có tên'}</h4>
            <p className="candidate-headline">
              {candidateData.headline || candidateData.current_position || 'Ứng viên'}
            </p>
            <div className="candidate-meta">
              <span>{candidateData.location_text || 'Chưa cập nhật địa điểm'}</span>
              <span>•</span>
              <span>{candidateData.years_of_experience || 0} năm kinh nghiệm</span>
            </div>
          </div>

          {/* Match Score */}
          <div className="match-score">
            <div
              className="score-ring"
              style={{
                background: `conic-gradient(#10b981 ${scorePercent}%, #f1f5f9 0%)`
              }}
            >
              <div className="score-inner">
                <span className="score-value">{scorePercent}%</span>
                <span className="score-label">Phù hợp</span>
              </div>
            </div>
          </div>
        </div>

        {/* Matching Explanation */}
        <div className="matching-explanation">
          {/* Confidence & Quality Badges */}
          <div className="explanation-badges">
            <Badge
              variant={getConfidenceVariant(explanation.confidence)}
              size="sm"
            >
              Độ tin cậy: {getConfidenceLabel(explanation.confidence)}
            </Badge>
            <Badge
              variant={getQualityVariant(explanation.quality?.overall)}
              size="sm"
            >
              Chất lượng: {getQualityLabel(explanation.quality?.overall)}
            </Badge>
          </div>

          {/* Human-readable Reasons */}
          {explanation.reasons?.length > 0 && (
            <div className="match-reasons">
              <h6>Lý do phù hợp:</h6>
              <ul className="reasons-list">
                {explanation.reasons.slice(0, 3).map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
                {explanation.reasons.length > 3 && (
                  <li className="more-reasons">+{explanation.reasons.length - 3} lý do khác</li>
                )}
              </ul>
            </div>
          )}

          {/* Dimensions Breakdown */}
          {explanation.dimensions && (
            <div className="dimensions-breakdown">
              <h6>Chi tiết điểm số:</h6>
              <div className="dimensions-grid">
                {Object.entries(explanation.dimensions).map(([dimension, score]) => (
                  <div key={dimension} className="dimension-item">
                    <div className="dimension-label">
                      <span className="dimension-name">{getDimensionLabel(dimension)}</span>
                      <span className="dimension-score">{Math.round(score * 100)}%</span>
                    </div>
                    <div className="dimension-bar">
                      <div
                        className="dimension-fill"
                        style={{
                          width: `${score * 100}%`,
                          backgroundColor: getDimensionColor(score)
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths & Concerns */}
          {(explanation.quality?.strengths?.length > 0 || explanation.quality?.concerns?.length > 0) && (
            <div className="quality-details">
              {explanation.quality.strengths?.length > 0 && (
                <div className="strengths">
                  <h6>Điểm mạnh:</h6>
                  <ul>
                    {explanation.quality.strengths.slice(0, 2).map((strength, index) => (
                      <li key={index} className="strength">{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {explanation.quality.concerns?.length > 0 && (
                <div className="concerns">
                  <h6>Cần lưu ý:</h6>
                  <ul>
                    {explanation.quality.concerns.slice(0, 2).map((concern, index) => (
                      <li key={index} className="concern">{concern}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          {explanation.quality?.recommendations?.length > 0 && (
            <div className="recommendations">
              <h6>Khuyến nghị:</h6>
              <ul>
                {explanation.quality.recommendations.slice(0, 2).map((rec, index) => (
                  <li key={index} className="recommendation">{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Data Completeness */}
          {explanation.data_completeness !== undefined && (
            <div className="data-completeness">
              <span>Độ đầy đủ hồ sơ: {Math.round(explanation.data_completeness * 100)}%</span>
              <div className="completeness-bar">
                <div
                  className="completeness-fill"
                  style={{ width: `${explanation.data_completeness * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Skills Preview */}
        <div className="candidate-skills">
          {candidateData.skills?.slice(0, 4).map((skill, index) => (
            <Badge key={index} variant="secondary" size="sm">
              {typeof skill === 'string' ? skill : skill.name || skill}
            </Badge>
          ))}
          {candidateData.skills?.length > 4 && (
            <Badge variant="outline" size="sm">
              +{candidateData.skills.length - 4}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="candidate-actions">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Thu gọn' : 'Xem thêm'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            loading={saving}
            disabled={saving}
          >
            Lưu vào Talent Pool
          </Button>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="candidate-details">
            <div className="detail-section">
              <h6>Kinh nghiệm làm việc:</h6>
              <div className="experience-list">
                {candidateData.experiences?.slice(0, 2).map((exp, index) => (
                  <div key={index} className="experience-item">
                    <strong>{exp.position || exp.title}</strong> tại {exp.company_name || exp.company}
                    {exp.duration && <div className="experience-duration">{exp.duration}</div>}
                  </div>
                ))}
                {!candidateData.experiences?.length && (
                  <p className="no-data">Chưa cập nhật kinh nghiệm</p>
                )}
              </div>
            </div>

            <div className="detail-section">
              <h6>Học vấn:</h6>
              <div className="education-list">
                {candidateData.educations?.slice(0, 2).map((edu, index) => (
                  <div key={index} className="education-item">
                    <strong>{edu.degree}</strong> - {edu.school_name || edu.institution}
                  </div>
                ))}
                {!candidateData.educations?.length && (
                  <p className="no-data">Chưa cập nhật học vấn</p>
                )}
              </div>
            </div>

            {candidateData.bio && (
              <div className="detail-section">
                <h6>Giới thiệu:</h6>
                <p className="candidate-bio">{candidateData.bio}</p>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  )
}

// Helper functions for explanation display
const getConfidenceVariant = (confidence) => {
  switch (confidence) {
    case 'high': return 'success'
    case 'medium': return 'warning'
    case 'low': return 'danger'
    default: return 'info'
  }
}

const getConfidenceLabel = (confidence) => {
  switch (confidence) {
    case 'high': return 'Cao'
    case 'medium': return 'Trung bình'
    case 'low': return 'Thấp'
    default: return 'Không xác định'
  }
}

const getQualityVariant = (quality) => {
  switch (quality) {
    case 'excellent': return 'success'
    case 'good': return 'primary'
    case 'fair': return 'warning'
    case 'poor': return 'danger'
    default: return 'info'
  }
}

const getQualityLabel = (quality) => {
  switch (quality) {
    case 'excellent': return 'Xuất sắc'
    case 'good': return 'Tốt'
    case 'fair': return 'Khá'
    case 'poor': return 'Yếu'
    default: return 'Không xác định'
  }
}

const getDimensionLabel = (dimension) => {
  const labels = {
    experience: 'Kinh nghiệm',
    location: 'Địa điểm',
    skills: 'Kỹ năng',
    preferences: 'Sở thích',
    activity: 'Hoạt động',
    completeness: 'Đầy đủ hồ sơ'
  }
  return labels[dimension] || dimension
}

const getDimensionColor = (score) => {
  if (score >= 0.8) return '#10b981' // green
  if (score >= 0.6) return '#3b82f6' // blue
  if (score >= 0.4) return '#f59e0b' // yellow
  if (score >= 0.2) return '#f97316' // orange
  return '#ef4444' // red
}

export default TalentPoolResults
