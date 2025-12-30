import { useState } from 'react'
import SimpleModal from '../Modal'

export default function LanguagesSection({ languages = [], onChange }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [form, setForm] = useState({
    name: '',
    proficiency_level: 'intermediate', // basic, intermediate, advanced, native
    certificate: '',
    certificate_url: ''
  })

  const openModal = (index = null) => {
    if (index !== null) {
      const lang = languages[index]
      setForm({
        name: lang.name || '',
        proficiency_level: lang.proficiency_level || 'intermediate',
        certificate: lang.certificate || '',
        certificate_url: lang.certificate_url || ''
      })
      setEditingIndex(index)
    } else {
      setForm({
        name: '',
        proficiency_level: 'intermediate',
        certificate: '',
        certificate_url: ''
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
      proficiency_level: 'intermediate',
      certificate: '',
      certificate_url: ''
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newLanguages = [...languages]
    if (editingIndex !== null) {
      newLanguages[editingIndex] = { ...form }
    } else {
      newLanguages.push({ ...form })
    }
    onChange(newLanguages)
    closeModal()
  }

  const handleDelete = (index) => {
    if (window.confirm('Bạn chắc chắn muốn xóa ngôn ngữ này?')) {
      const newLanguages = languages.filter((_, i) => i !== index)
      onChange(newLanguages)
    }
  }

  const getProficiencyLabel = (level) => {
    const labels = {
      basic: 'Cơ bản',
      intermediate: 'Trung bình',
      advanced: 'Nâng cao',
      native: 'Bản ngữ'
    }
    return labels[level] || level
  }

  return (
    <div className="resume-section">
      <div className="resume-section__header">
        <h3 className="resume-section__title">Ngôn ngữ</h3>
        <button
          type="button"
          className="btn btn--sm btn--primary"
          onClick={() => openModal()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Thêm ngôn ngữ
        </button>
      </div>

      {languages.length === 0 ? (
        <div className="resume-section__empty">
          <p className="muted">Chưa có ngôn ngữ nào. Nhấn "Thêm ngôn ngữ" để bắt đầu.</p>
        </div>
      ) : (
        <div className="resume-section__list">
          {languages.map((lang, index) => (
            <div key={index} className="resume-section__item">
              <div className="resume-section__item-content">
                <div className="resume-section__item-header">
                  <h4>{lang.name}</h4>
                  <span className="resume-section__badge">
                    {getProficiencyLabel(lang.proficiency_level)}
                  </span>
                </div>
                {lang.certificate && (
                  <p className="resume-section__item-meta muted small">
                    {lang.certificate}
                    {lang.certificate_url && (
                      <a href={lang.certificate_url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '8px' }}>
                        (Xem chứng chỉ)
                      </a>
                    )}
                  </p>
                )}
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
            {editingIndex !== null ? 'Chỉnh sửa ngôn ngữ' : 'Thêm ngôn ngữ'}
          </h3>

          <div className="form-group">
            <label className="form-label">Tên ngôn ngữ *</label>
            <input
              type="text"
              className="form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ví dụ: Tiếng Anh, Tiếng Nhật..."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mức độ thành thạo *</label>
            <select
              className="form-input"
              value={form.proficiency_level}
              onChange={(e) => setForm({ ...form, proficiency_level: e.target.value })}
              required
            >
              <option value="basic">Cơ bản</option>
              <option value="intermediate">Trung bình</option>
              <option value="advanced">Nâng cao</option>
              <option value="native">Bản ngữ</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Chứng chỉ (tùy chọn)</label>
            <input
              type="text"
              className="form-input"
              value={form.certificate}
              onChange={(e) => setForm({ ...form, certificate: e.target.value })}
              placeholder="Ví dụ: TOEIC 850, IELTS 7.5..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Link chứng chỉ (tùy chọn)</label>
            <input
              type="url"
              className="form-input"
              value={form.certificate_url}
              onChange={(e) => setForm({ ...form, certificate_url: e.target.value })}
              placeholder="https://..."
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

