import { useState, useRef } from 'react'
import SimpleModal from '../Modal'
import { ResumeApi } from '../../services/resumeApi'

export default function UploadResumeModal({ open, onClose, onSuccess }) {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [autoParse, setAutoParse] = useState(false)
  const [isDefault, setIsDefault] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = (selectedFile) => {
    if (selectedFile) {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Chỉ chấp nhận file PDF hoặc DOCX.')
        setFile(null)
        return
      }
      setFile(selectedFile)
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''))
      }
      setError('')
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = (e) => {
    if (e.target.files?.[0]) {
      handleFileChange(e.target.files[0])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Vui lòng chọn file CV.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const result = await ResumeApi.uploadResume(file, {
        title: title.trim() || file.name,
        auto_parse: autoParse,
        is_default: isDefault,
      })
      onSuccess?.(result)
      handleClose()
    } catch (err) {
      setError(err?.message || 'Không thể tải CV lên. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setTitle('')
    setAutoParse(false)
    setIsDefault(false)
    setError('')
    setDragActive(false)
    onClose()
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <SimpleModal open={open} onClose={handleClose}>
      <form onSubmit={handleSubmit} className="upload-resume-form">
        <div className="upload-resume-form__header">
          <h3 style={{ marginTop: 0 }}>Tải CV lên</h3>
          <p className="muted small">
            Tải lên file CV của bạn (PDF hoặc DOCX). Hệ thống có thể tự động phân tích nội dung.
          </p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {/* Drag & Drop Zone */}
        <div
          className={`upload-zone ${dragActive ? 'upload-zone--active' : ''} ${file ? 'upload-zone--has-file' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />
          {file ? (
            <div className="upload-zone__file">
              <div className="upload-zone__file-info">
                <div className="upload-zone__file-name">{file.name}</div>
                <div className="upload-zone__file-size muted small">{formatFileSize(file.size)}</div>
              </div>
              <button
                type="button"
                className="upload-zone__file-remove"
                onClick={(e) => {
                  e.stopPropagation()
                  setFile(null)
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="upload-zone__empty">
              <div className="upload-zone__text">
                <div className="upload-zone__title">Kéo thả file vào đây</div>
                <div className="upload-zone__subtitle muted small">hoặc click để chọn file</div>
              </div>
              <div className="upload-zone__hint muted small">
                PDF hoặc DOCX, tối đa 10MB
              </div>
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="upload-resume-form__fields">
          <div className="resume-create-field">
            <label className="resume-create-field__label">
              Tên CV
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="CV của tôi"
              className="resume-create-field__input"
            />
            <p className="resume-create-field__hint muted small">
              Để trống sẽ dùng tên file.
            </p>
          </div>

          <div className="upload-resume-checkboxes">
            <label className="upload-resume-checkbox">
              <input
                type="checkbox"
                checked={autoParse}
                onChange={(e) => setAutoParse(e.target.checked)}
              />
              <div className="upload-resume-checkbox__content">
                <div className="upload-resume-checkbox__title">Tự động phân tích nội dung</div>
                <div className="upload-resume-checkbox__description muted small">
                  Chỉ áp dụng cho file PDF
                </div>
              </div>
            </label>

            <label className="upload-resume-checkbox">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
              <div className="upload-resume-checkbox__content">
                <div className="upload-resume-checkbox__title">Đặt làm CV mặc định</div>
                <div className="upload-resume-checkbox__description muted small">
                  CV này sẽ được sử dụng mặc định khi ứng tuyển
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={handleClose} disabled={loading}>
            Hủy
          </button>
          <button type="submit" className="btn primary" disabled={loading || !file}>
            {loading ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px' }} />
                Đang tải...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Tải lên
              </>
            )}
          </button>
        </div>
      </form>
    </SimpleModal>
  )
}
