import { useState, useEffect } from "react"
import { Button, Card, CardBody, Badge } from '../../components/shared'
import { TalentPoolService } from '../../lib/api.js'

function TalentPoolSaved({ selectedJobId }) {
  const [savedCandidates, setSavedCandidates] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [removing, setRemoving] = useState(null)

  const handleExport = () => {
    // Basic CSV export functionality for saved candidates
    if (savedCandidates.length === 0) return

    const headers = ['Tên', 'Vị trí', 'Địa điểm', 'Kinh nghiệm', 'Ngày lưu']
    const csvContent = [
      headers.join(','),
      ...savedCandidates.map(candidate => [
        `"${candidate.full_name || candidate.display_name || 'N/A'}"`,
        `"${candidate.headline || candidate.current_position || 'N/A'}"`,
        `"${candidate.location_text || 'N/A'}"`,
        candidate.years_of_experience || 0,
        candidate.savedAt ? new Date(candidate.savedAt).toLocaleDateString('vi-VN') : 'N/A'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `saved-candidates-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const pageSize = 12 // Show more candidates per page in saved view

  useEffect(() => {
    loadSavedCandidates()
  }, [currentPage, selectedJobId])

  const loadSavedCandidates = async () => {
    setLoading(true)
    try {
      const response = await TalentPoolService.getSavedCandidates({
        page: currentPage,
        limit: pageSize,
        jobId: selectedJobId || undefined
      })

      const data = response?.data || response || {}
      const candidates = data.data || data || []
      const pagination = data.pagination || {}

      setSavedCandidates(candidates)
      setTotalPages(pagination.total_pages || 0)
      setTotalCount(pagination.total_count || 0)
    } catch (error) {
      console.error('Failed to load saved candidates:', error)
      setSavedCandidates([])
      setTotalPages(0)
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveCandidate = async (candidateId, jobId) => {
    setRemoving(candidateId)
    try {
      await TalentPoolService.removeCandidate(candidateId, jobId)
      // Reload the list
      await loadSavedCandidates()
    } catch (error) {
      console.error('Failed to remove candidate:', error)
      alert('Không thể xóa ứng viên. Vui lòng thử lại.')
    } finally {
      setRemoving(null)
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  if (loading && savedCandidates.length === 0) {
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
    <div className="talent-pool-saved">
      {/* Header */}
      <div className="saved-header">
        <div className="saved-info">
          <h3>Ứng viên đã lưu ({totalCount})</h3>
          <p className="rd-muted">Quản lý những ứng viên đã lưu vào talent pool của bạn</p>
        </div>
        {savedCandidates.length > 0 && (
          <div className="saved-actions">
            <Button variant="outline" size="sm" onClick={handleExport}>Xuất danh sách</Button>
            <Button variant="outline" size="sm">Gửi email hàng loạt</Button>
          </div>
        )}
      </div>

      {/* Candidates List */}
      {savedCandidates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <h3 className="empty-title">Chưa có ứng viên nào được lưu</h3>
          <p className="empty-description">
            Sử dụng tab "Tìm ứng viên mới" để matching và lưu ứng viên vào talent pool
          </p>
        </div>
      ) : (
        <>
          <div className="saved-candidates-grid">
            {savedCandidates.map((item) => (
              <SavedCandidateCard
                key={item.id || `${item.candidateId}_${item.jobId}`}
                candidate={item}
                onRemove={handleRemoveCandidate}
                removing={removing === item.candidateId}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Trước
              </Button>

              <div className="page-numbers">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, currentPage - 2) + i
                  if (pageNum > totalPages) return null

                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "primary" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Sau
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SavedCandidateCard({ candidate, onRemove, removing }) {
  const handleRemove = () => {
    onRemove(candidate.candidateId, candidate.jobId)
  }

  return (
    <Card className="saved-candidate-card">
      <CardBody>
        <div className="candidate-header">
          <div className="candidate-avatar">
            {candidate.avatar_url ? (
              <img src={candidate.avatar_url} alt={candidate.full_name} />
            ) : (
              <div className="avatar-placeholder">
                {(candidate.full_name || candidate.display_name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="candidate-info">
            <h4>{candidate.full_name || candidate.display_name || 'Chưa có tên'}</h4>
            <p className="candidate-headline">
              {candidate.headline || candidate.current_position || 'Ứng viên'}
            </p>
            <div className="candidate-meta">
              <span>{candidate.location_text || 'Chưa cập nhật địa điểm'}</span>
              <span>•</span>
              <span>{candidate.years_of_experience || 0} năm kinh nghiệm</span>
            </div>
          </div>

          <div className="saved-info">
            <div className="saved-date">
              Lưu: {candidate.savedAt ? new Date(candidate.savedAt).toLocaleDateString('vi-VN') : 'N/A'}
            </div>
            {candidate.note && (
              <div className="saved-note">
                <small>Ghi chú: {candidate.note}</small>
              </div>
            )}
          </div>
        </div>

        {/* Skills Preview */}
        <div className="candidate-skills">
          {candidate.skills?.slice(0, 3).map((skill, index) => (
            <Badge key={index} variant="secondary" size="sm">
              {typeof skill === 'string' ? skill : skill.name || skill}
            </Badge>
          ))}
          {candidate.skills?.length > 3 && (
            <Badge variant="outline" size="sm">
              +{candidate.skills.length - 3}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="candidate-actions">
          <Button variant="outline" size="sm">
            Xem hồ sơ
          </Button>
          <Button variant="primary" size="sm">
            Liên hệ
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleRemove}
            loading={removing}
            disabled={removing}
          >
            Xóa
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

export default TalentPoolSaved
