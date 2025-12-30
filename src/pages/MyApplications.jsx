import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApplicationService } from '../lib/api'
import './ApplicationsList.css'
import './MyApplications.css'

const STATUS_LABELS = {
  pending: 'Đang chờ',
  reviewed: 'Đã xem',
  accepted: 'Chấp nhận',
  rejected: 'Từ chối',
  withdrawn: 'Đã rút'
}

const STATUS_CLASS = {
  pending: 'status-pill',
  reviewed: 'status-pill info',
  accepted: 'status-pill success',
  rejected: 'status-pill danger',
  withdrawn: 'status-pill'
}

const SORT_OPTIONS = [
  { value: 'applied_at_desc', label: 'Mới nhất', sort_by: 'applied_at', order: 'desc' },
  { value: 'applied_at_asc', label: 'Cũ nhất', sort_by: 'applied_at', order: 'asc' },
  { value: 'status', label: 'Trạng thái', sort_by: 'status', order: 'asc' }
]

function formatDate(dateString) {
  if (!dateString) return '--'
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return '--'
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function MyApplications() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('applied_at_desc')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 1 })

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const sortOption = SORT_OPTIONS.find((opt) => opt.value === sort) || SORT_OPTIONS[0]
      const res = await ApplicationService.listMine({
        page,
        limit: 20,
        status: status || undefined,
        sort_by: sortOption.sort_by,
        order: sortOption.order
      })
      const data = Array.isArray(res?.data) ? res.data : res?.data?.data || res || []
      const pag = res?.pagination || res?.data?.pagination || { page: 1, limit: 20, total: data.length, total_pages: 1 }
      setItems(data)
      setPagination(pag)
    } catch (err) {
      setError(err?.message || 'Không thể tải danh sách đơn ứng tuyển.')
      setItems([])
      setPagination({ page: 1, limit: 20, total: 0, total_pages: 1 })
    } finally {
      setLoading(false)
    }
  }, [page, sort, status])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleView = (id) => {
    navigate(`/applications/${id}`)
  }

  return (
    <div className="applications-page">
      <div className="applications-header simple">
        <div>
          <h1>Đơn ứng tuyển</h1>
          <p className="muted">Theo dõi trạng thái các đơn bạn đã nộp</p>
        </div>
        <div className="applications-controls">
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }}>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="state-card">Đang tải...</div>
      )}

      {error && (
        <div className="state-card error">
          <p>{error}</p>
          <button className="btn" onClick={fetchData}>Thử lại</button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="state-card empty">
          <h3>Chưa có đơn ứng tuyển</h3>
          <p>Hãy ứng tuyển một công việc để bắt đầu theo dõi.</p>
          <button className="btn primary" onClick={() => navigate('/jobs')}>Tìm việc ngay</button>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="applications-grid">
          {items.map((app) => (
            <div key={app.id} className="application-card">
              <div className="application-card__top">
                <div>
                  <div className="application-job">{app.jobs?.title || app.job?.title || 'Tin tuyển dụng'}</div>
                  <div className="muted small">{app.jobs?.companies?.name || app.jobs?.company?.name || app.company_name || 'Nhà tuyển dụng'}</div>
                </div>
                <span className={STATUS_CLASS[app.status] || 'status-pill'}>
                  {STATUS_LABELS[app.status] || app.status || 'N/A'}
                </span>
              </div>
              <div className="application-card__meta">
                <div>
                  <span className="muted small">Ngày nộp</span>
                  <div>{formatDate(app.applied_at)}</div>
                </div>
                <div>
                  <span className="muted small">Stage hiện tại</span>
                  <div>{app.current_stage?.stage_name || '--'}</div>
                </div>
                <div>
                  <span className="muted small">CV</span>
                  <div>{app.resume_id ? 'Đã đính kèm' : 'Chưa có'}</div>
                </div>
              </div>
              <div className="application-card__actions">
                <button className="btn ghost" onClick={() => handleView(app.id)}>Xem chi tiết</button>
                {app.status === 'pending' && (
                  <span className="status-message pending">
                    🔄 Đang chờ nhà tuyển dụng xem hồ sơ của bạn
                  </span>
                )}
                {app.status === 'reviewed' && (
                  <span className="status-message reviewed">
                    👀 Hồ sơ đã được xem, chờ phản hồi tiếp theo
                  </span>
                )}
                {app.status === 'interviewing' && (
                  <span className="status-message interviewing">
                    🎯 Bạn đang trong quá trình phỏng vấn
                  </span>
                )}
                {app.status === 'offered' && (
                  <span className="status-message offered">
                    🎉 Bạn đã nhận được offer! Hãy kiểm tra chi tiết.
                  </span>
                )}
                {app.status === 'accepted' && (
                  <span className="status-message accepted">
                    ✅ Chúc mừng! Bạn đã chấp nhận offer này.
                  </span>
                )}
                {app.status === 'rejected' && (
                  <span className="status-message rejected">
                    😔 Rất tiếc, hồ sơ của bạn chưa phù hợp. Đừng nản lòng!
                  </span>
                )}
                {app.status === 'withdrawn' && (
                  <span className="status-message withdrawn">
                    📝 Bạn đã rút đơn ứng tuyển này.
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && pagination.total_pages > 1 && (
        <div className="pagination">
          <button className="btn" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Trước</button>
          <span className="muted">Trang {page} / {pagination.total_pages}</span>
          <button className="btn" disabled={page >= pagination.total_pages} onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}>Sau</button>
        </div>
      )}
    </div>
  )
}

