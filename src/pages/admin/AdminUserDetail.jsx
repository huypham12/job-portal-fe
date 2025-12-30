import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminApi } from '../../services/adminApi'
import './styles/admin-users.css'

const ROLE_OPTIONS = [
  { value: 'candidate', label: 'Ứng viên' },
  { value: 'recruiter', label: 'Nhà tuyển dụng' },
  { value: 'admin', label: 'Quản trị viên' },
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
      minute: '2-digit',
    })
  } catch {
    return '--'
  }
}

export default function AdminUserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({
    role: '',
    verified: false,
    deleted: false,
  })

  useEffect(() => {
    loadUser()
  }, [id])

  const loadUser = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await adminApi.getUserDetails(id)
      const userData = response?.data || response
      setUser(userData)
      setForm({
        role: userData.role || '',
        verified: userData.verified || false,
        deleted: userData.deleted || false,
      })
    } catch (err) {
      console.error('Failed to load user:', err)
      setError(err?.message || 'Không thể tải thông tin người dùng.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updateData = {}
      if (form.role !== user.role) updateData.role = form.role
      if (form.verified !== user.verified) updateData.verified = form.verified
      if (form.deleted !== user.deleted) updateData.deleted = form.deleted

      if (Object.keys(updateData).length === 0) {
        alert('Không có thay đổi nào để cập nhật')
        return
      }

      await adminApi.updateUser(id, updateData)
      alert('Cập nhật thành công!')
      loadUser()
    } catch (err) {
      console.error('Failed to update user:', err)
      alert(err?.message || 'Không thể cập nhật người dùng.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await adminApi.deleteUser(id)
      alert('Xóa người dùng thành công!')
      navigate('/admin/users')
    } catch (err) {
      console.error('Failed to delete user:', err)
      alert(err?.message || 'Không thể xóa người dùng.')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-user-detail">
        <div className="admin-card admin-loading-state">
          <p>Đang tải...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="admin-user-detail">
        <div className="admin-card admin-error-state">
          <p>{error || 'Không tìm thấy người dùng'}</p>
          <button className="admin-btn admin-btn-secondary" onClick={() => navigate('/admin/users')}>
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  // profiles là relation một-một (không phải array)
  const profile = Array.isArray(user.profiles) ? user.profiles[0] : (user.profiles || {})

  return (
    <div className="admin-user-detail">
      <div className="admin-page-header">
        <button className="admin-btn admin-btn-link" onClick={() => navigate('/admin/users')}>
          ← Quay lại danh sách
        </button>
        <h1>Chi tiết người dùng</h1>
        <p className="admin-muted">Quản lý thông tin và quyền của người dùng</p>
      </div>

      <div className="admin-card">
        <h2>Thông tin cơ bản</h2>
        <div className="admin-info-grid">
          <div className="admin-info-item">
            <label>Email</label>
            <div>{user.email}</div>
          </div>
          <div className="admin-info-item">
            <label>Tên</label>
            <div>{profile.full_name || '--'}</div>
          </div>
          <div className="admin-info-item">
            <label>Số điện thoại</label>
            <div>{profile.phone_number || '--'}</div>
          </div>
          <div className="admin-info-item">
            <label>Ngày tạo</label>
            <div>{formatDate(user.created_at)}</div>
          </div>
          <div className="admin-info-item">
            <label>Cập nhật lần cuối</label>
            <div>{formatDate(user.updated_at)}</div>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h2>Cập nhật thông tin</h2>
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-form-group">
            <label>Vai trò</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="admin-form-input"
              required
            >
              {ROLE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="admin-form-group">
            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={form.verified}
                onChange={(e) => setForm({ ...form, verified: e.target.checked })}
              />
              <span>Đã xác thực email</span>
            </label>
          </div>

          <div className="admin-form-group">
            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={form.deleted}
                onChange={(e) => setForm({ ...form, deleted: e.target.checked })}
              />
              <span>Khóa tài khoản (Soft delete)</span>
            </label>
          </div>

          <div className="admin-form-actions">
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => navigate('/admin/users')}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              disabled={saving}
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>

      <div className="admin-card admin-card-danger">
        <h2>Xóa vĩnh viễn</h2>
        <p className="admin-muted">
          Hành động này sẽ xóa vĩnh viễn người dùng khỏi hệ thống và không thể hoàn tác.
        </p>
        <button
          className="admin-btn admin-btn-danger"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={deleting}
        >
          {deleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="admin-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Xác nhận xóa</h3>
            <p>Bạn có chắc chắn muốn xóa vĩnh viễn người dùng <strong>{user.email}</strong>?</p>
            <p className="admin-muted">Hành động này không thể hoàn tác.</p>
            <div className="admin-modal-actions">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Hủy
              </button>
              <button
                className="admin-btn admin-btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
