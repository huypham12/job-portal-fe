import { useState } from 'react'
import SimpleModal from '../Modal'

export default function ReferencesSection({ references = [], onChange }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [form, setForm] = useState({
    name: '',
    position: '',
    company: '',
    email: '',
    phone: '',
    relationship: ''
  })

  const openModal = (index = null) => {
    if (index !== null) {
      const ref = references[index]
      setForm({
        name: ref.name || '',
        position: ref.position || '',
        company: ref.company || '',
        email: ref.email || '',
        phone: ref.phone || '',
        relationship: ref.relationship || ''
      })
      setEditingIndex(index)
    } else {
      setForm({
        name: '',
        position: '',
        company: '',
        email: '',
        phone: '',
        relationship: ''
      })
      setEditingIndex(null)
    }
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingIndex(null)
    setForm({
      name: '',
      position: '',
      company: '',
      email: '',
      phone: '',
      relationship: ''
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newReferences = [...references]
    if (editingIndex !== null) {
      newReferences[editingIndex] = { ...form }
    } else {
      newReferences.push({ ...form })
    }
    onChange(newReferences)
    closeModal()
  }

  const handleDelete = (index) => {
    if (window.confirm('Bạn chắc chắn muốn xóa người tham khảo này?')) {
      const newReferences = references.filter((_, i) => i !== index)
      onChange(newReferences)
    }
  }

  return (
    <div className="resume-section">
      <div className="resume-section__header">
        <h3 className="resume-section__title">Người tham khảo</h3>
        <button
          type="button"
          className="btn btn--sm btn--primary"
          onClick={() => openModal()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Thêm người tham khảo
        </button>
      </div>

      {references.length === 0 ? (
        <div className="resume-section__empty">
          <p className="muted">Chưa có người tham khảo nào. Nhấn "Thêm người tham khảo" để bắt đầu.</p>
        </div>
      ) : (
        <div className="resume-section__list">
          {references.map((ref, index) => (
            <div key={index} className="resume-section__item">
              <div className="resume-section__item-content">
                <div className="resume-section__item-header">
                  <h4>{ref.name}</h4>
                  {ref.position && (
                    <p className="resume-section__item-meta muted">
                      {ref.position}
                      {ref.company && ` tại ${ref.company}`}
                    </p>
                  )}
                </div>
                <div className="resume-section__item-details" style={{ marginTop: '8px' }}>
                  {ref.email && (
                    <p className="small muted">
                      <strong>Email:</strong> {ref.email}
                    </p>
                  )}
                  {ref.phone && (
                    <p className="small muted">
                      <strong>SĐT:</strong> {ref.phone}
                    </p>
                  )}
                  {ref.relationship && (
                    <p className="small muted">
                      <strong>Mối quan hệ:</strong> {ref.relationship}
                    </p>
                  )}
                </div>
              </div>
              <div className="resume-section__item-actions">
                <button
                  type="button"
                  className="btn btn--icon btn--sm"
                  onClick={() => openModal(index)}
                  title="Chỉnh sửa"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="btn btn--icon btn--sm btn--danger"
                  onClick={() => handleDelete(index)}
                  title="Xóa"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <SimpleModal open={modalOpen} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="resume-form">
          <h3>
            {editingIndex !== null ? 'Chỉnh sửa người tham khảo' : 'Thêm người tham khảo'}
          </h3>

          <div className="form-group">
            <label className="form-label">Họ tên *</label>
            <input
              type="text"
              className="form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Họ và tên"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Chức vụ</label>
            <input
              type="text"
              className="form-input"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              placeholder="Ví dụ: Giám đốc, Trưởng phòng..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Công ty</label>
            <input
              type="text"
              className="form-input"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="Tên công ty"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Số điện thoại</label>
            <input
              type="tel"
              className="form-input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="0123456789"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mối quan hệ</label>
            <input
              type="text"
              className="form-input"
              value={form.relationship}
              onChange={(e) => setForm({ ...form, relationship: e.target.value })}
              placeholder="Ví dụ: Cựu sếp, Giảng viên, Đồng nghiệp..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn--secondary" onClick={closeModal}>
              Hủy
            </button>
            <button type="submit" className="btn btn--primary">
              {editingIndex !== null ? 'Cập nhật' : 'Thêm'}
            </button>
          </div>
        </form>
      </SimpleModal>
    </div>
  )
}

