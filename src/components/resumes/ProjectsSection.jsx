import { useState } from 'react'
import SimpleModal from '../Modal'

export default function ProjectsSection({ projects = [], onChange }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [form, setForm] = useState({
    name: '',
    role: '',
    client: '',
    tech_stack: [],
    description: '',
    start_date: '',
    end_date: '',
    is_current: false,
    highlights: [],
    links: [],
  })
  const [techInput, setTechInput] = useState('')
  const [highlightInput, setHighlightInput] = useState('')
  const [linkInput, setLinkInput] = useState({ url: '', label: '' })

  const openModal = (index = null) => {
    if (index !== null) {
      const project = projects[index]
      setForm({
        name: project.name || '',
        role: project.role || '',
        client: project.client || '',
        tech_stack: Array.isArray(project.tech_stack) ? project.tech_stack : [],
        description: project.description || '',
        start_date: project.start_date ? project.start_date.slice(0, 10) : '',
        end_date: project.end_date ? project.end_date.slice(0, 10) : '',
        is_current: Boolean(project.is_current),
        highlights: Array.isArray(project.highlights) ? project.highlights : [],
        links: Array.isArray(project.links) ? project.links : [],
      })
      setEditingIndex(index)
    } else {
      setForm({
        name: '',
        role: '',
        client: '',
        tech_stack: [],
        description: '',
        start_date: '',
        end_date: '',
        is_current: false,
        highlights: [],
        links: [],
      })
      setEditingIndex(null)
    }
    setTechInput('')
    setHighlightInput('')
    setLinkInput({ url: '', label: '' })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingIndex(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newProjects = [...projects]
    const projectData = {
      name: form.name.trim(),
      role: form.role.trim(),
      client: form.client.trim(),
      tech_stack: form.tech_stack,
      description: form.description.trim(),
      start_date: form.start_date || undefined,
      end_date: form.is_current ? undefined : (form.end_date || undefined),
      is_current: form.is_current,
      highlights: form.highlights,
      links: form.links,
    }

    if (editingIndex !== null) {
      newProjects[editingIndex] = projectData
    } else {
      newProjects.push(projectData)
    }

    onChange(newProjects)
    closeModal()
  }

  const handleDelete = (index) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa dự án này?')) return
    const newProjects = projects.filter((_, i) => i !== index)
    onChange(newProjects)
  }

  const addTech = () => {
    if (techInput.trim()) {
      setForm((prev) => ({
        ...prev,
        tech_stack: [...prev.tech_stack, techInput.trim()],
      }))
      setTechInput('')
    }
  }

  const removeTech = (index) => {
    setForm((prev) => ({
      ...prev,
      tech_stack: prev.tech_stack.filter((_, i) => i !== index),
    }))
  }

  const addHighlight = () => {
    if (highlightInput.trim()) {
      setForm((prev) => ({
        ...prev,
        highlights: [...prev.highlights, highlightInput.trim()],
      }))
      setHighlightInput('')
    }
  }

  const removeHighlight = (index) => {
    setForm((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index),
    }))
  }

  const addLink = () => {
    if (linkInput.url.trim()) {
      setForm((prev) => ({
        ...prev,
        links: [...prev.links, { url: linkInput.url.trim(), label: linkInput.label.trim() || linkInput.url.trim() }],
      }))
      setLinkInput({ url: '', label: '' })
    }
  }

  const removeLink = (index) => {
    setForm((prev) => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index),
    }))
  }

  return (
    <div className="projects-section">
      <div className="projects-section__header">
        <div>
          <h3>Dự án</h3>
          <p className="muted small">Thêm các dự án nổi bật của bạn.</p>
        </div>
        <button type="button" className="btn ghost" onClick={() => openModal()}>
          Thêm dự án
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-copy">Chưa có dự án nào. Hãy thêm dự án đầu tiên.</div>
      ) : (
        <div className="projects-section__list">
          {projects.map((project, index) => (
            <div key={index} className="project-item">
              <div>
                <div className="project-item__name">{project.name || 'Dự án không tên'}</div>
                {project.role && <div className="project-item__role">{project.role}</div>}
                {project.client && <div className="project-item__client muted small">{project.client}</div>}
                {project.tech_stack && project.tech_stack.length > 0 && (
                  <div className="project-item__tech">
                    {project.tech_stack.map((tech, i) => (
                      <span key={i} className="tech-chip">{tech}</span>
                    ))}
                  </div>
                )}
                {project.description && <p className="project-item__description muted">{project.description}</p>}
              </div>
              <div className="project-item__actions">
                <button type="button" className="btn ghost" onClick={() => openModal(index)}>
                  Chỉnh sửa
                </button>
                <button type="button" className="btn danger" onClick={() => handleDelete(index)}>
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <SimpleModal open={modalOpen} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="project-form">
          <h3>{editingIndex !== null ? 'Chỉnh sửa dự án' : 'Thêm dự án mới'}</h3>
          <div className="form-grid">
            <label className="field">
              <span>Tên dự án *</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
                placeholder="E-commerce Platform"
              />
            </label>
            <label className="field">
              <span>Vai trò</span>
              <input
                type="text"
                value={form.role}
                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                placeholder="Full-stack Developer"
              />
            </label>
            <label className="field">
              <span>Khách hàng / Công ty</span>
              <input
                type="text"
                value={form.client}
                onChange={(e) => setForm((prev) => ({ ...prev, client: e.target.value }))}
                placeholder="ABC Company"
              />
            </label>
            <label className="field">
              <span>Ngày bắt đầu</span>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
              />
            </label>
            <label className="field checkbox-field">
              <input
                type="checkbox"
                checked={form.is_current}
                onChange={(e) => setForm((prev) => ({ ...prev, is_current: e.target.checked }))}
              />
              <span>Đang thực hiện</span>
            </label>
            {!form.is_current && (
              <label className="field">
                <span>Ngày kết thúc</span>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
                />
              </label>
            )}
            <label className="field field-span">
              <span>Mô tả</span>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả về dự án..."
              />
            </label>
          </div>

          <div className="field-group">
            <label className="field">
              <span>Công nghệ sử dụng</span>
              <div className="input-with-button">
                <input
                  type="text"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTech())}
                  placeholder="React, Node.js..."
                />
                <button type="button" className="btn ghost" onClick={addTech}>
                  Thêm
                </button>
              </div>
              {form.tech_stack.length > 0 && (
                <div className="chips-list">
                  {form.tech_stack.map((tech, i) => (
                    <span key={i} className="chip">
                      {tech}
                      <button type="button" className="chip-remove" onClick={() => removeTech(i)}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </label>
          </div>

          <div className="field-group">
            <label className="field">
              <span>Điểm nổi bật</span>
              <div className="input-with-button">
                <input
                  type="text"
                  value={highlightInput}
                  onChange={(e) => setHighlightInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
                  placeholder="Tăng hiệu suất 50%..."
                />
                <button type="button" className="btn ghost" onClick={addHighlight}>
                  Thêm
                </button>
              </div>
              {form.highlights.length > 0 && (
                <ul className="highlights-list">
                  {form.highlights.map((highlight, i) => (
                    <li key={i}>
                      {highlight}
                      <button type="button" className="btn-link" onClick={() => removeHighlight(i)}>Xóa</button>
                    </li>
                  ))}
                </ul>
              )}
            </label>
          </div>

          <div className="field-group">
            <label className="field">
              <span>Liên kết</span>
              <div className="link-inputs">
                <input
                  type="url"
                  value={linkInput.url}
                  onChange={(e) => setLinkInput((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder="https://..."
                />
                <input
                  type="text"
                  value={linkInput.label}
                  onChange={(e) => setLinkInput((prev) => ({ ...prev, label: e.target.value }))}
                  placeholder="Nhãn (tùy chọn)"
                />
                <button type="button" className="btn ghost" onClick={addLink}>
                  Thêm
                </button>
              </div>
              {form.links.length > 0 && (
                <ul className="links-list">
                  {form.links.map((link, i) => (
                    <li key={i}>
                      <a href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a>
                      <button type="button" className="btn-link" onClick={() => removeLink(i)}>Xóa</button>
                    </li>
                  ))}
                </ul>
              )}
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={closeModal}>
              Hủy
            </button>
            <button type="submit" className="btn primary">
              {editingIndex !== null ? 'Cập nhật' : 'Thêm'}
            </button>
          </div>
        </form>
      </SimpleModal>
    </div>
  )
}

