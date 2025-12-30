import { useEffect, useState } from 'react'
import { companyApi } from '../services/companyApi'
import './CompanyOnboarding.css'

const detailKeys = [
  'industry',
  'founded_year',
  'employee_count_min',
  'employee_count_max',
  'website_url',
  'headquarters_location_id',
  'company_type',
  'revenue_range',
  'stock_symbol',
  'culture_description',
]

const extraKeys = ['tax_code', 'business_license', 'linkedin_url', 'facebook_url', 'twitter_url']

const buildInitialValues = () =>
  [...detailKeys, ...extraKeys].reduce((acc, key) => {
    acc[key] = ''
    return acc
  }, {})

const isValidUrl = (value) => {
  try {
    const url = new URL(value)
    return !!url
  } catch {
    return false
  }
}

const currentYear = new Date().getFullYear()

const mapToString = (obj = {}) => {
  const result = {}
  Object.entries(obj).forEach(([key, val]) => {
    if (val === null || val === undefined) return
    result[key] = typeof val === 'number' ? String(val) : String(val)
  })
  return result
}

export default function CompanyOnboardingStepDetails({ company, onBack, onSuccess }) {
  const [values, setValues] = useState(buildInitialValues)
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(true)
  const [detailsExists, setDetailsExists] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    const loadDetails = async () => {
      setLoading(true)
      try {
        const res = await companyApi.getMyCompanyDetails()
        if (!active) return
        const data = res || {}
        setValues((prev) => ({ ...prev, ...mapToString(data) }))
        setDetailsExists(true)
      } catch (err) {
        if (!active) return
        if (err?.status === 404) {
          setDetailsExists(false)
        } else {
          setApiError(err?.message || 'Không thể tải chi tiết công ty.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    loadDetails()
    return () => {
      active = false
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    const nextErrors = {}
    const fy = values.founded_year ? parseInt(values.founded_year, 10) : null
    const minEmp = values.employee_count_min ? parseInt(values.employee_count_min, 10) : null
    const maxEmp = values.employee_count_max ? parseInt(values.employee_count_max, 10) : null

    if (fy !== null) {
      if (Number.isNaN(fy) || fy < 1800 || fy > currentYear) {
        nextErrors.founded_year = `Năm thành lập phải trong khoảng 1800-${currentYear}.`
      }
    }
    if (minEmp !== null && (Number.isNaN(minEmp) || minEmp <= 0)) {
      nextErrors.employee_count_min = 'Số nhân sự tối thiểu phải > 0.'
    }
    if (maxEmp !== null && (Number.isNaN(maxEmp) || maxEmp <= 0)) {
      nextErrors.employee_count_max = 'Số nhân sự tối đa phải > 0.'
    }
    if (minEmp !== null && maxEmp !== null && minEmp > maxEmp) {
      nextErrors.employee_count_max = 'Số nhân sự tối thiểu không được lớn hơn tối đa.'
    }
    if (values.website_url && !isValidUrl(values.website_url.trim())) {
      nextErrors.website_url = 'Website URL không hợp lệ.'
    }
    if (values.linkedin_url && !isValidUrl(values.linkedin_url.trim())) {
      nextErrors.linkedin_url = 'LinkedIn URL không hợp lệ.'
    }
    if (values.facebook_url && !isValidUrl(values.facebook_url.trim())) {
      nextErrors.facebook_url = 'Facebook URL không hợp lệ.'
    }
    if (values.twitter_url && !isValidUrl(values.twitter_url.trim())) {
      nextErrors.twitter_url = 'Twitter URL không hợp lệ.'
    }
    return nextErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const detailPayload = {}
    detailKeys.forEach((key) => {
      const raw = values[key]
      if (raw === '' || raw === null || raw === undefined) return
      const trimmed = typeof raw === 'string' ? raw.trim() : raw
      if (trimmed === '') return
      if (['founded_year', 'employee_count_min', 'employee_count_max'].includes(key)) {
        detailPayload[key] = parseInt(trimmed, 10)
      } else {
        detailPayload[key] = trimmed
      }
    })

    const extraPayload = {}
    extraKeys.forEach((key) => {
      const raw = values[key]
      if (raw === '' || raw === null || raw === undefined) return
      const trimmed = typeof raw === 'string' ? raw.trim() : raw
      if (trimmed !== '') extraPayload[key] = trimmed
    })

    if (Object.keys(detailPayload).length === 0 && Object.keys(extraPayload).length === 0) {
      setApiError('Vui lòng nhập ít nhất một trường.')
      return
    }

    setSaving(true)
    setApiError('')
    try {
      if (Object.keys(detailPayload).length > 0) {
        if (detailsExists) {
          await companyApi.updateMyCompanyDetails(detailPayload)
        } else {
          await companyApi.createMyCompanyDetails(detailPayload)
          setDetailsExists(true)
        }
      }
      if (Object.keys(extraPayload).length > 0) {
        await companyApi.updateMyCompany(extraPayload)
      }
      onSuccess?.({ details: detailPayload, extras: extraPayload })
    } catch (err) {
      setApiError(err?.message || 'Không thể lưu chi tiết công ty.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="onboarding-card">
      <div className="card-head">
        <div>
          <p className="eyebrow-text">Bước 2/2</p>
          <h2>Thông tin chi tiết và pháp lý</h2>
          <p className="muted">
            Bổ sung các trường chi tiết để hồ sơ công ty được xác minh nhanh hơn.
          </p>
        </div>
        {company?.name && (
          <div className="chip">Đang thiết lập: {company.name}</div>
        )}
      </div>

      {loading ? (
        <div className="loading-block">
          <div className="spinner" aria-hidden />
          <div>Đang tải dữ liệu...</div>
        </div>
      ) : (
        <form className="form-grid" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label>Ngành nghề</label>
            <input name="industry" value={values.industry} onChange={handleChange} placeholder="Công nghệ thông tin" />
          </div>
          <div className="field">
            <label>Năm thành lập</label>
            <input
              name="founded_year"
              value={values.founded_year}
              onChange={handleChange}
              placeholder="2015"
              inputMode="numeric"
            />
          </div>
          <div className="field">
            <label>Số nhân sự tối thiểu</label>
            <input
              name="employee_count_min"
              value={values.employee_count_min}
              onChange={handleChange}
              placeholder="100"
              inputMode="numeric"
            />
            {errors.employee_count_min && <div className="error-text">{errors.employee_count_min}</div>}
          </div>
          <div className="field">
            <label>Số nhân sự tối đa</label>
            <input
              name="employee_count_max"
              value={values.employee_count_max}
              onChange={handleChange}
              placeholder="250"
              inputMode="numeric"
            />
            {errors.employee_count_max && <div className="error-text">{errors.employee_count_max}</div>}
          </div>
          <div className="field">
            <label>Website</label>
            <input name="website_url" value={values.website_url} onChange={handleChange} placeholder="https://..." />
            {errors.website_url && <div className="error-text">{errors.website_url}</div>}
          </div>
          <div className="field">
            <label>Trụ sở (UUID)</label>
            <input
              name="headquarters_location_id"
              value={values.headquarters_location_id}
              onChange={handleChange}
              placeholder="Mã địa điểm"
            />
          </div>
          <div className="field">
            <label>Loại hình công ty</label>
            <input name="company_type" value={values.company_type} onChange={handleChange} placeholder="Product / Outsourcing" />
          </div>
          <div className="field">
            <label>Doanh thu</label>
            <input name="revenue_range" value={values.revenue_range} onChange={handleChange} placeholder="1M-5M USD" />
          </div>
          <div className="field">
            <label>Mã chứng khoán</label>
            <input name="stock_symbol" value={values.stock_symbol} onChange={handleChange} placeholder="ACME" />
          </div>
          <div className="field field-span">
            <label>Mô tả văn hóa</label>
            <textarea
              name="culture_description"
              value={values.culture_description}
              onChange={handleChange}
              placeholder="Môi trường làm việc, giá trị cốt lõi..."
              rows={3}
            />
          </div>

          <div className="field">
            <label>Mã số thuế</label>
            <input name="tax_code" value={values.tax_code} onChange={handleChange} placeholder="0101xxxxxx" />
          </div>
          <div className="field">
            <label>Giấy phép KD</label>
            <input name="business_license" value={values.business_license} onChange={handleChange} placeholder="Số giấy phép" />
          </div>
          <div className="field">
            <label>LinkedIn URL</label>
            <input
              name="linkedin_url"
              value={values.linkedin_url}
              onChange={handleChange}
              placeholder="https://linkedin.com/company/..."
            />
            {errors.linkedin_url && <div className="error-text">{errors.linkedin_url}</div>}
          </div>
          <div className="field">
            <label>Facebook URL</label>
            <input
              name="facebook_url"
              value={values.facebook_url}
              onChange={handleChange}
              placeholder="https://facebook.com/..."
            />
            {errors.facebook_url && <div className="error-text">{errors.facebook_url}</div>}
          </div>
          <div className="field">
            <label>Twitter URL</label>
            <input
              name="twitter_url"
              value={values.twitter_url}
              onChange={handleChange}
              placeholder="https://twitter.com/..."
            />
            {errors.twitter_url && <div className="error-text">{errors.twitter_url}</div>}
          </div>

          {apiError && <div className="field field-span error-text">{apiError}</div>}

          <div className="form-actions split">
            <button className="btn" type="button" onClick={onBack}>
              Quay lại
            </button>
            <div className="action-gap" />
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu và tiếp tục'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
