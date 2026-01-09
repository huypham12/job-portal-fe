import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApplicationService } from '../lib/api.js'
import { Button, Card, Badge, Input, Select } from '../components/shared'
import BulkActionsToolbar from '../components/common/BulkActionsToolbar'
import '../styles/shared.css'
import './ApplicationsList.css'

const PAGE_SIZE = 20

const SORT_OPTIONS = [
  { value: 'applied_at', label: 'Mới nhất' },
  { value: 'name', label: 'Theo tên' }
]

function formatDate(dateString) {
  if (!dateString) return '--'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
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


export default function ShortlistedList() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('applied_at')
  const [order, setOrder] = useState('desc')
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, total_pages: 1 })

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkLoading, setBulkLoading] = useState(false)

  const fetchShortlisted = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const filters = {
        page: currentPage,
        limit: PAGE_SIZE,
        sort_by: sortBy,
        order: order
        // Note: search functionality not implemented in backend for shortlisted endpoint
      }
      const response = await ApplicationService.getShortlistedCandidates(filters)
      const data = response?.data || response || []
      const pag = response?.pagination || { page: currentPage, limit: PAGE_SIZE, total: data.length, total_pages: 1 }

      setApplications(data)
      setPagination(pag)
    } catch (err) {
      console.error('Failed to fetch shortlisted applications:', err)
      const errorMessage = err?.data?.message || err?.message || 'Không thể tải danh sách ứng viên đã shortlist. Vui lòng thử lại.'
      setError(errorMessage)
      if (err?.status === 401) {
        navigate('/login?role=recruiter&redirect=' + encodeURIComponent(window.location.pathname))
      }
    } finally {
      setLoading(false)
    }
  }, [currentPage, sortBy, order, navigate])

  useEffect(() => {
    fetchShortlisted()
  }, [fetchShortlisted])

  const handleShortlistToggle = async (appId) => {
    try {
      await ApplicationService.shortlistCandidate({
        application_id: appId,
        action: 'remove'
      })

      // Remove from local state
      setApplications(prev => prev.filter(app => app.id !== appId))

      // Update pagination if needed
      if (applications.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1)
      } else {
        fetchShortlisted() // Refresh to get updated pagination
      }
    } catch (err) {
      alert(err?.message || 'Không thể bỏ khỏi shortlist. Vui lòng thử lại.')
    }
  }

  const handleViewDetail = (appId) => {
    navigate(`/recruiter/applications/${appId}`)
  }

  // Bulk selection handlers
  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      setSelectedIds(applications.map(app => app.id))
    } else {
      setSelectedIds([])
    }
  }, [applications])

  const handleSelectItem = useCallback((appId, checked) => {
    if (checked) {
      setSelectedIds(prev => [...prev, appId])
    } else {
      setSelectedIds(prev => prev.filter(id => id !== appId))
    }
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedIds([])
  }, [])

  // Bulk action handlers
  const handleBulkUpdate = useCallback(async (applicationIds, payload) => {
    setBulkLoading(true)
    try {
      await ApplicationService.bulkUpdate({
        application_ids: applicationIds,
        action: 'update_status',
        status: payload.status
      })
      // Refresh the list
      await fetchShortlisted()
    } catch (error) {
      throw error // Let BulkActionsToolbar handle error display
    } finally {
      setBulkLoading(false)
    }
  }, [fetchShortlisted])

  const handleBulkShortlist = useCallback(async (applicationIds, action) => {
    setBulkLoading(true)
    try {
      // Process each application individually since shortlist is per application
      const promises = applicationIds.map(appId =>
        ApplicationService.shortlistCandidate({
          application_id: appId,
          action: action
        })
      )
      await Promise.all(promises)

      // Refresh the list
      await fetchShortlisted()
    } catch (error) {
      throw error
    } finally {
      setBulkLoading(false)
    }
  }, [fetchShortlisted])

  const handleBulkExport = useCallback((applicationIds) => {
    // Simple export - create CSV content
    const selectedApps = applications.filter(app => applicationIds.includes(app.id))

    const csvContent = [
      ['Tên ứng viên', 'Email', 'Vị trí', 'Trạng thái', 'Ngày ứng tuyển'].join(','),
      ...selectedApps.map(app => {
        const profile = app.profiles || app.candidate || app.candidate?.profile || {}
        const name = profile.full_name || profile.display_name || profile.name || 'Chưa có tên'
        const email = profile.email || ''
        const job = app.jobs || app.job || {}
        const jobTitle = job.title || 'Vị trí không rõ'
        const status = app.status || 'pending'
        const appliedAt = app.applied_at ? new Date(app.applied_at).toLocaleDateString('vi-VN') : ''

        return [name, email, jobTitle, status, appliedAt].map(field => `"${field}"`).join(',')
      })
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `shortlisted-candidates-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [applications])

  return (
    <div className="section applications-list-page">
      <div className="applications-header">
        <div>
          <div className="breadcrumb">
            <span>Shortlisted Candidates</span>
          </div>
          <h1 className="applications-title">Ứng viên đã shortlist</h1>
          <p className="applications-subtitle">Danh sách các ứng viên tiềm năng bạn đã đánh dấu</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/recruiter/dashboard')}
        >
          Quay lại Dashboard
        </Button>
      </div>

      {/* Stats Section */}
      <Card padding="medium" className="stats-card">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{pagination.total || 0}</div>
            <div className="stat-label">Tổng số</div>
          </div>
          <div className="stat-item stat-reviewed">
            <div className="stat-value">{applications.filter(app => app.status === 'reviewed').length}</div>
            <div className="stat-label">Đã xem</div>
          </div>
          <div className="stat-item stat-accepted">
            <div className="stat-value">{applications.filter(app => app.status === 'accepted').length}</div>
            <div className="stat-label">Chấp nhận</div>
          </div>
          <div className="stat-item stat-interviewing">
            <div className="stat-value">{applications.filter(app => app.status === 'interviewing').length}</div>
            <div className="stat-label">Phỏng vấn</div>
          </div>
        </div>
      </Card>

      {/* Filters Section */}
      <Card padding="medium" className="filters-card">
        <div className="filters-row">
          <div className="search-wrapper">
            <Input
              placeholder="Tìm kiếm theo tên ứng viên..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              disabled
            />
            <small style={{ color: '#64748b', marginTop: '4px' }}>
              * Tính năng tìm kiếm sẽ được cập nhật trong phiên bản sau
            </small>
          </div>
          <div className="filter-controls">
              {/* Master checkbox for select all */}
              {applications.length > 0 && (
                <label className="select-all-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === applications.length && applications.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    disabled={bulkLoading}
                    aria-label={`Chọn tất cả ${applications.length} ứng viên`}
                    aria-describedby="bulk-actions-info"
                  />
                  <span>Chọn tất cả ({applications.length})</span>
                </label>
              )}
            <Select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value)
                setCurrentPage(1)
              }}
              style={{ minWidth: '150px' }}
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            <button
              className={`sort-order-btn ${order === 'desc' ? 'desc' : 'asc'}`}
              onClick={() => setOrder(order === 'desc' ? 'asc' : 'desc')}
              title={order === 'desc' ? 'Giảm dần' : 'Tăng dần'}
            >
              {order === 'desc' ? '↓' : '↑'}
            </button>
          </div>
        </div>
        </Card>

        {/* Hidden info for screen readers */}
        <div id="bulk-actions-info" className="sr-only">
          Chọn ứng viên để thực hiện các hành động hàng loạt như cập nhật trạng thái, thêm/bỏ khỏi shortlist, hoặc xuất danh sách.
        </div>

        {loading && (
        <Card padding="large">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Đang tải...</p>
          </div>
        </Card>
      )}

      {error && (
        <Card padding="medium" style={{ background: '#fee', border: '1px solid #fcc' }}>
          <p style={{ color: '#c00', margin: 0 }}>{error}</p>
          <Button variant="outline" onClick={fetchShortlisted} style={{ marginTop: '12px' }}>
            Thử lại
          </Button>
        </Card>
      )}

      {!loading && !error && applications.length === 0 && (
        <Card padding="large" className="empty-state-card">
          <div className="empty-state">
            <h3 className="empty-state-title">Chưa có ứng viên nào</h3>
            <p className="empty-state-description">
              Bạn chưa shortlist ứng viên nào. Hãy quay lại danh sách ứng tuyển để đánh dấu các ứng viên tiềm năng.
            </p>
            <Button variant="primary" onClick={() => navigate('/recruiter/jobs')}>
              Xem danh sách ứng tuyển
            </Button>
          </div>
        </Card>
      )}

      {!loading && !error && applications.length > 0 && (
        <>
          {/* Bulk Actions Toolbar */}
          <BulkActionsToolbar
            selectedIds={selectedIds}
            onClearSelection={handleClearSelection}
            onBulkUpdate={handleBulkUpdate}
            onBulkShortlist={handleBulkShortlist}
            onBulkExport={handleBulkExport}
            loading={bulkLoading}
          />

          <div className="applications-card-grid">
            {applications.map((app) => {
              const profile = app.profiles || app.candidate || app.candidate?.profile || {}
              const name = profile.full_name || profile.display_name || profile.name || 'Chưa có tên'
              const status = app.status || 'pending'
              const job = app.jobs || app.job || {}

              return (
                <Card
                  key={app.id}
                  variant="elevated"
                  padding="medium"
                  className="application-card"
                  hover
                >
                    <div className="application-card-header">
                      {/* Individual checkbox */}
                      <label className="card-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(app.id)}
                          onChange={(e) => handleSelectItem(app.id, e.target.checked)}
                          disabled={bulkLoading}
                          aria-label={`Chọn ứng viên ${name}`}
                        />
                      </label>
                    <Badge
                      variant="success"
                      size="small"
                    >
                      ★ Shortlisted
                    </Badge>
                    <Badge
                      variant="default"
                      size="small"
                    >
                      {status}
                    </Badge>
                  </div>
                  <div className="application-card-body">
                    <div className="candidate-info">
                      <div className="candidate-avatar">
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} alt={name} />
                        ) : (
                          <span>{getInitials(name)}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="candidate-name">{name}</h3>
                        {profile.headline && (
                          <p className="candidate-headline">{profile.headline}</p>
                        )}
                        <p className="candidate-job">{job.title || 'Vị trí không rõ'}</p>
                      </div>
                    </div>
                    <div className="application-card-meta">
                      <div className="meta-item">
                        <span className="meta-label">Stage:</span>
                        <span>{app.current_stage?.stage_name || '--'}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Ngày ứng tuyển:</span>
                        <span>{formatDate(app.applied_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="application-card-actions">
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => handleShortlistToggle(app.id)}
                      title="Bỏ khỏi shortlist"
                    >
                      ☆ Bỏ shortlist
                    </Button>
                    <Button
                      variant="default"
                      size="small"
                      onClick={() => handleViewDetail(app.id)}
                    >
                      Xem chi tiết
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>

          {pagination.total_pages > 1 && (
            <div className="pagination">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                Trước
              </Button>
              <div className="pagination-info">
                Trang {currentPage} / {pagination.total_pages}
              </div>
              <Button
                variant="outline"
                disabled={currentPage >= pagination.total_pages}
                onClick={() => setCurrentPage(p => Math.min(pagination.total_pages, p + 1))}
              >
                Sau
              </Button>
            </div>
          )}
        </>
      )}
      )}

      <style jsx>{`
        .select-all-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #374151;
          cursor: pointer;
          user-select: none;
        }

        .select-all-checkbox input[type="checkbox"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .card-checkbox {
          display: flex;
          align-items: center;
          margin-right: 8px;
        }

        .card-checkbox input[type="checkbox"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .application-card.selected {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
      `}</style>
    </div>
  )
}
