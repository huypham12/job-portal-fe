import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../../services/adminApi'
import './styles/admin-users.css'

const PAGE_SIZE = 20
const ROLE_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'candidate', label: 'Ứng viên' },
  { value: 'recruiter', label: 'Nhà tuyển dụng' },
  { value: 'admin', label: 'Quản trị viên' },
]

const VERIFIED_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'true', label: 'Đã xác thực' },
  { value: 'false', label: 'Chưa xác thực' },
]

const DELETED_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'false', label: 'Hoạt động' },
  { value: 'true', label: 'Đã khóa' },
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

export default function AdminUsersList() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 })
  
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    verified: '',
    deleted: '',
  })

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        page: currentPage,
        limit: PAGE_SIZE,
        ...(filters.search && filters.search.trim() && { search: filters.search.trim() }),
        ...(filters.role && filters.role !== '' && { role: filters.role }),
        // Chỉ gửi verified nếu có giá trị (không phải empty string)
        ...(filters.verified && filters.verified !== '' && { verified: filters.verified }),
        // Chỉ gửi deleted nếu có giá trị (không phải empty string)
        ...(filters.deleted && filters.deleted !== '' && { deleted: filters.deleted }),
      }
      
      console.log('Fetching users with params:', params)
      console.log('Filters state:', filters)
      const response = await adminApi.getAllUsers(params)
      console.log('API Response:', response)
      console.log('API Response type:', typeof response)
      console.log('API Response keys:', Object.keys(response || {}))
      
      // Xử lý nhiều format response khác nhau
      let data = {}
      if (response?.data) {
        data = response.data
      } else if (response?.users) {
        // Nếu response trực tiếp có users
        data = response
      } else if (Array.isArray(response)) {
        // Nếu response là array trực tiếp
        data = { users: response, pagination: { total: response.length } }
      } else {
        data = response || {}
      }
      
      console.log('Processed data:', data)
      
      const usersList = data.users || data.data?.users || []
      const paginationData = data.pagination || data.data?.pagination || {}
      
      console.log('Users list:', usersList)
      console.log('Pagination:', paginationData)
      
      setUsers(usersList)
      setPagination({
        page: paginationData.page || currentPage,
        limit: paginationData.limit || PAGE_SIZE,
        total: paginationData.total || 0,
        totalPages: paginationData.totalPages || Math.ceil((paginationData.total || 0) / PAGE_SIZE) || 1,
      })
    } catch (err) {
      console.error('Failed to fetch users:', err)
      console.error('Error details:', {
        message: err?.message,
        status: err?.status,
        data: err?.data
      })
      setError(err?.data?.message || err?.message || 'Không thể tải danh sách người dùng. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [currentPage, filters])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchUsers()
  }

  const handleViewDetail = (userId) => {
    navigate(`/admin/users/${userId}`)
  }

  const getRoleLabel = (role) => {
    const labels = {
      candidate: 'Ứng viên',
      recruiter: 'Nhà tuyển dụng',
      admin: 'Quản trị viên',
    }
    return labels[role] || role
  }

  const getRoleColor = (role) => {
    const colors = {
      candidate: '#3b82f6',
      recruiter: '#10b981',
      admin: '#dc2626',
    }
    return colors[role] || '#64748b'
  }

  return (
    <div className="admin-users-list">
      <div className="admin-page-header">
        <h1>Quản lý người dùng</h1>
        <p className="admin-muted">Quản lý tất cả người dùng trong hệ thống</p>
      </div>

      <div className="admin-card">
        <div className="admin-filters">
          <form onSubmit={handleSearch} className="admin-search-form">
          <input
            type="text"
            placeholder="Tìm kiếm theo email hoặc tên..."
              value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
              className="admin-search-input"
          />
            <button type="submit" className="admin-search-btn">Tìm kiếm</button>
          </form>

          <div className="admin-filter-row">
          <select
              value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
              className="admin-filter-select"
          >
            {ROLE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
              value={filters.verified}
            onChange={(e) => handleFilterChange('verified', e.target.value)}
              className="admin-filter-select"
          >
              {VERIFIED_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
          </select>

          <select
              value={filters.deleted}
            onChange={(e) => handleFilterChange('deleted', e.target.value)}
              className="admin-filter-select"
          >
              {DELETED_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
          </select>
        </div>
      </div>
      </div>

      {loading && (
        <div className="admin-card admin-loading-state">
          <p>Đang tải...</p>
        </div>
      )}

      {error && (
        <div className="admin-card admin-error-state">
          <p>{error}</p>
          <button className="admin-btn admin-btn-secondary" onClick={fetchUsers}>
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {pagination.total > 0 && (
            <div className="admin-card" style={{ padding: '12px 24px', background: '#f8fafc' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                Tìm thấy <strong>{pagination.total}</strong> người dùng
                {pagination.totalPages > 1 && ` (Trang ${currentPage}/${pagination.totalPages})`}
              </p>
            </div>
          )}
          <div className="admin-card">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Tên</th>
                    <th>Vai trò</th>
                    <th>Xác thực</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="admin-empty-state">
                        {pagination.total === 0 ? (
                          <div style={{ textAlign: 'center', padding: '20px' }}>
                            <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
                              Chưa có người dùng nào trong hệ thống
                            </p>
                            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                              {filters.search || filters.role || filters.verified || filters.deleted
                                ? 'Không tìm thấy người dùng phù hợp với bộ lọc. Vui lòng thử lại với bộ lọc khác.'
                                : 'Database chưa có dữ liệu. Vui lòng chạy seed data để tạo dữ liệu mẫu.'}
                            </p>
        </div>
      ) : (
                          'Đang tải dữ liệu...'
                        )}
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                // profiles có thể là object (một-một) hoặc array (một-nhiều)
                const profile = Array.isArray(user.profiles) ? user.profiles[0] : (user.profiles || {})
                      const name = profile.full_name || '--'
                return (
                        <tr key={user.id}>
                          <td>{user.email}</td>
                          <td>{name}</td>
                          <td>
                            <span
                              className="admin-badge"
                              style={{
                                backgroundColor: `${getRoleColor(user.role)}15`,
                                color: getRoleColor(user.role),
                              }}
                            >
                              {getRoleLabel(user.role)}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`admin-badge ${user.verified ? 'admin-badge-success' : 'admin-badge-warning'}`}
                            >
                              {user.verified ? 'Đã xác thực' : 'Chưa xác thực'}
                      </span>
                          </td>
                          <td>
                            <span
                              className={`admin-badge ${user.deleted ? 'admin-badge-danger' : 'admin-badge-success'}`}
                            >
                              {user.deleted ? 'Đã khóa' : 'Hoạt động'}
                            </span>
                          </td>
                          <td>{formatDate(user.created_at)}</td>
                          <td>
                      <button
                              className="admin-btn admin-btn-link"
                              onClick={() => handleViewDetail(user.id)}
                      >
                              Xem chi tiết
                      </button>
                          </td>
                        </tr>
                )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {pagination.totalPages > 1 && (
            <div className="admin-pagination">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Trước
              </button>
              <span className="admin-pagination-info">
                Trang {currentPage} / {pagination.totalPages} ({pagination.total} người dùng)
              </span>
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
