import { useState } from 'react'
import { companyApi } from '../services/companyApi'
import './CompanyOnboarding.css'

const initialValues = {
  name: '',
  description: '',
  size: '',
  contact_email: '',
  contact_phone: '',
  contact_address: '',
}

const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value)

export default function CompanyOnboardingStepBasic({ onSuccess }) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    const nextErrors = {}
    if (!values.name || values.name.trim().length < 3) {
      nextErrors.name = 'Tên công ty tối thiểu 3 ký tự.'
    }
    if (values.contact_email && !isValidEmail(values.contact_email.trim())) {
      nextErrors.contact_email = 'Email không hợp lệ.'
    }
    if (values.size) {
      const sizeNumber = parseInt(values.size, 10)
      if (Number.isNaN(sizeNumber) || sizeNumber <= 0) {
          nextErrors.size = 'Quy mô phải là số nguyên dương.'
      }
    }
    return nextErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const payload = {}
    Object.entries(values).forEach(([key, val]) => {
      const trimmed = typeof val === 'string' ? val.trim() : val
      if (trimmed !== '' && trimmed !== null && trimmed !== undefined) {
        payload[key] = key === 'size' ? parseInt(trimmed, 10) : trimmed
      }
    })

    if (!payload.name) {
      setErrors({ name: 'Tên công ty bắt buộc' })
      return
    }

    setSubmitting(true)
    setApiError('')
    try {
      const data = await companyApi.createCompany(payload)
      onSuccess?.(data)
    } catch (err) {
      setApiError(err?.message || 'Không thể tạo công ty. Thử lại sau.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="onboarding-card">
      <div className="card-head">
        <div>
          <p className="eyebrow-text">Bước 1/2</p>
          <h2>Thông tin cơ bản</h2>
          <p className="muted">Nhập thông tin doanh nghiệp của bạn để tạo hồ sơ tuyển dụng.</p>
        </div>
      </div>

      <form className="form-grid" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label>Tên công ty *</label>
          <input name="name" value={values.name} onChange={handleChange} placeholder="Ví dụ: Công ty ABC" />
          {errors.name && <div className="error-text">{errors.name}</div>}
        </div>
        <div className="field">
          <label>Mô tả</label>
          <textarea
            name="description"
            value={values.description}
            onChange={handleChange}
            placeholder="Giới thiệu ngắn về công ty, sản phẩm, văn hóa..."
            rows={4}
          />
        </div>
        <div className="field">
          <label>Quy mô nhân sự</label>
          <input
            name="size"
            value={values.size}
            onChange={handleChange}
            placeholder="Ví dụ: 120"
            inputMode="numeric"
          />
          {errors.size && <div className="error-text">{errors.size}</div>}
        </div>
        <div className="field">
          <label>Email liên hệ</label>
          <input
            name="contact_email"
            value={values.contact_email}
            onChange={handleChange}
            placeholder="hr@company.com"
            type="email"
          />
          {errors.contact_email && <div className="error-text">{errors.contact_email}</div>}
        </div>
        <div className="field">
          <label>Số điện thoại</label>
          <input name="contact_phone" value={values.contact_phone} onChange={handleChange} placeholder="090xxxxxxx" />
        </div>
        <div className="field field-span">
          <label>Địa chỉ</label>
          <input
            name="contact_address"
            value={values.contact_address}
            onChange={handleChange}
            placeholder="Số nhà, đường, quận/huyện, tỉnh/thành"
          />
        </div>

        {apiError && <div className="field field-span error-text">{apiError}</div>}

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Đang tạo...' : 'Tiếp tục'}
          </button>
        </div>
      </form>
    </div>
  )
}
