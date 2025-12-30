import { useEffect, useRef, useState } from 'react'
import { companyApi } from '../services/companyApi'
import './RecruiterCompany.css'

const normalizeBenefits = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  return []
}

const profileFieldsCompany = ['name', 'description', 'size', 'contact_email', 'contact_phone', 'contact_address', 'linkedin_url', 'facebook_url', 'twitter_url', 'tax_code', 'business_license']
const profileFieldsDetails = ['industry', 'company_type', 'founded_year', 'employee_count_min', 'employee_count_max', 'website_url', 'revenue_range', 'stock_symbol', 'culture_description', 'headquarters_location_id']
const computeProfileCompletion = (company, details) => {
  let filled = 0
  let total = profileFieldsCompany.length + profileFieldsDetails.length
  profileFieldsCompany.forEach((key) => {
    const val = company?.[key]
    if (val !== undefined && val !== null && String(val).trim() !== '') filled += 1
  })
  const det = details || company?.company_details || {}
  profileFieldsDetails.forEach((key) => {
    const val = det?.[key]
    if (val !== undefined && val !== null && String(val).trim() !== '') filled += 1
  })
  const percent = Math.round((filled / total) * 100)
  return { filled, total, percent }
}

const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value)
const isValidUrl = (value) => {
  if (!value) return false
  try {
    // ensure at least protocol + host
    const url = new URL(value)
    return !!url
  } catch {
    return false
  }
}

export default function RecruiterCompanyPage() {
  const [company, setCompany] = useState(null)
  const [details, setDetails] = useState(null)
  const [benefits, setBenefits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const companyData = await companyApi.getMyCompany()
        let detailData = null
        try {
          detailData = await companyApi.getMyCompanyDetails()
        } catch (err) {
          if (err?.status !== 404) throw err
        }
        let benefitData = []
        try {
          benefitData = await companyApi.listMyBenefits()
        } catch (err) {
          if (err?.status !== 404) throw err
        }

        if (!active) return
        setCompany(companyData)
        setDetails(detailData && Object.keys(detailData || {}).length > 0 ? detailData : null)
        setBenefits(normalizeBenefits(benefitData))
      } catch (err) {
        if (!active) return
        setError(err?.message || 'Không thể tải dữ liệu công ty.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const headerCompanyName = company?.name || 'Công ty của bạn'
  const completion = computeProfileCompletion(company, details)
  const showCompletionBanner = completion.percent < 100

  if (loading) {
    return (
      <div className="recruiter-company-page">
        <div className="loading-block">
          <div className="spinner" aria-hidden />
          <div>Đang tải hồ sơ công ty...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="recruiter-company-page">
        <div className="error-block">
          <h3>Có lỗi xảy ra</h3>
          <p className="error-text">{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Thử lại</button>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo(company)

  return (
    <div className="recruiter-company-page">
      {showCompletionBanner && (
        <div className="rd-banner warning" style={{ marginBottom: 12, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
          <div>
            <strong>Hồ sơ hoàn thành {completion.percent}%</strong>
            <p className="muted" style={{ margin: '4px 0 0' }}>Hoàn thành đủ thông tin để được duyệt và đăng tin.</p>
          </div>
          <div style={{ flex: '0 0 220px', background: '#e2e8f0', height: 10, borderRadius: 999 }}>
            <div style={{ width: `${completion.percent}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#4f8bff,#2f64f2)' }} />
          </div>
        </div>
      )}
      <div className="page-header">
        <div>
          <p className="eyebrow-text">Hồ sơ công ty</p>
          <h1>{headerCompanyName}</h1>
          <p className="muted">Quản lý thông tin doanh nghiệp, chi tiết và các phúc lợi nổi bật.</p>
        </div>
        <div className={`status-pill status-pill--compact status-pill--${statusInfo.kind}`}>
          <span className="dot" />
          <span>{statusInfo.label}</span>
        </div>
      </div>

      <div className="recruiter-company-layout">
        <div className="recruiter-company-layout__main">
          <CompanyInfoCard company={company} onUpdated={(data) => setCompany((prev) => ({ ...(prev || {}), ...(data || {}) }))} />
          <CompanyDetailsCard
            details={details}
            onSaved={(data) => setDetails(data)}
            onDeleted={() => setDetails(null)}
          />
        </div>
        <aside className="recruiter-company-layout__side">
          <CompanyStatusCard company={company} />
          <CompanyBenefitsSection
            benefits={benefits}
            onChange={(list) => setBenefits(list)}
          />
        </aside>
      </div>
    </div>
  )
}

function CompanyStatusCard({ company }) {
  const info = getStatusInfo(company)

  return (
    <div className="company-card status-card">
      <div className="card-header">
        <div>
          <h3>Trạng thái hồ sơ</h3>
          <p className="muted">Theo dõi tiến trình xét duyệt doanh nghiệp.</p>
        </div>
      </div>
      <div className="status-row single">
        <span className={`status-chip ${info.kind}`}>
          <span className="dot" />
          {info.label}
        </span>
      </div>
      <p className="muted small" style={{ marginTop: 6 }}>{info.subText}</p>
      <p className="muted small" style={{ marginTop: 10, fontWeight: 600 }}>{info.conclusion}</p>
      {info.publicLink && (
        <button className="btn link-btn" type="button" onClick={() => window.open(info.publicLink, '_blank')}>
          Xem trang công ty
        </button>
      )}
    </div>
  )
}

function CompanyInfoCard({ company, onUpdated }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(buildCompanyForm(company))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    setForm(buildCompanyForm(company))
    setUploadError('')
    setError('')
  }, [company])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleLogoSelect = async (file) => {
    if (!file) return
    setUploadError('')
    if (!file.type.startsWith('image/')) {
      setUploadError('Vui lòng chọn tệp ảnh.')
      return
    }
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      setUploadError('Ảnh tối đa 2MB.')
      return
    }
    if (!company?.id) {
      setUploadError('Chưa có ID công ty để tải logo.')
      return
    }
    setUploadingLogo(true)
    try {
      const res = await companyApi.uploadCompanyLogo(company.id, file)
      const newUrl = res?.url || res?.logo_url || res?.logoUrl || res?.path || ''
      if (newUrl) {
        onUpdated?.((prev) => ({ ...(prev || {}), logo_url: newUrl }))
      }
      setUploadError('')
    } catch (err) {
      setUploadError(err?.message || 'Không thể tải logo.')
    } finally {
      setUploadingLogo(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = []
    if (!form.name || form.name.trim().length < 3) {
      validationErrors.push('Tên công ty tối thiểu 3 ký tự.')
    }
    if (form.contact_email && !isValidEmail(form.contact_email.trim())) {
      validationErrors.push('Email không hợp lệ.')
    }
    if (form.contact_phone) {
      const digits = form.contact_phone.replace(/\D/g, '')
      if (digits.length < 8 || digits.length > 15) {
        validationErrors.push('Số điện thoại không hợp lệ.')
      }
    }
    if (form.size) {
      const sizeNumber = parseInt(form.size, 10)
      if (Number.isNaN(sizeNumber) || sizeNumber <= 0) {
        validationErrors.push('Quy mô phải là số nguyên dương.')
      }
    }
    if (form.linkedin_url && !isValidUrl(form.linkedin_url.trim())) {
      validationErrors.push('LinkedIn URL không hợp lệ.')
    }
    if (form.facebook_url && !isValidUrl(form.facebook_url.trim())) {
      validationErrors.push('Facebook URL không hợp lệ.')
    }
    if (form.twitter_url && !isValidUrl(form.twitter_url.trim())) {
      validationErrors.push('Twitter URL không hợp lệ.')
    }
    if (validationErrors.length) {
      setError(validationErrors.join(' '))
      return
    }

    const payload = {}
    Object.entries(form).forEach(([key, val]) => {
      const trimmed = typeof val === 'string' ? val.trim() : val
      if (trimmed === '' || trimmed === null || trimmed === undefined) return
      if (key === 'size') {
        const parsed = parseInt(trimmed, 10)
        if (!Number.isNaN(parsed)) payload[key] = parsed
      } else {
        payload[key] = trimmed
      }
    })
    if (Object.keys(payload).length === 0) {
      setError('Nhập ít nhất một trường để cập nhật.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const updated = await companyApi.updateMyCompany(payload)
      onUpdated?.(updated)
      setEditing(false)
    } catch (err) {
      setError(err?.message || 'Không thể cập nhật thông tin công ty.')
    } finally {
      setSaving(false)
    }
  }

  const logoSrc = company?.logo_url

  return (
    <div className="company-card">
      <div className="card-header">
        <div className="card-title">
          <div className="avatar-lg">
            {logoSrc ? <img src={logoSrc} alt={company?.name || 'Logo công ty'} /> : (company?.name || 'C')}
          </div>
          <div>
            <h3>{company?.name || 'Công ty chưa đặt tên'}</h3>
            <p className="muted">{company?.description || 'Chưa có mô tả'}</p>
            <div className="logo-upload">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={(e) => handleLogoSelect(e.target.files?.[0])}
              />
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo || !company?.id}
              >
                {uploadingLogo ? 'Đang tải logo...' : 'Tải logo'}
              </button>
              {uploadError && <div className="error-text">{uploadError}</div>}
            </div>
          </div>
        </div>
        {!editing && (
          <button className="btn btn-secondary" onClick={() => setEditing(true)}>Chỉnh sửa</button>
        )}
      </div>

      {editing ? (
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field">
            <label>Tên công ty</label>
            <input name="name" value={form.name} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Mô tả</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
          </div>
          <div className="field">
            <label>Quy mô</label>
            <input name="size" value={form.size} onChange={handleChange} inputMode="numeric" />
          </div>
          <div className="field">
            <label>Email liên hệ</label>
            <input name="contact_email" value={form.contact_email} onChange={handleChange} type="email" />
          </div>
          <div className="field">
            <label>Số điện thoại</label>
            <input name="contact_phone" value={form.contact_phone} onChange={handleChange} />
          </div>
          <div className="field field-span">
            <label>Địa chỉ</label>
            <input name="contact_address" value={form.contact_address} onChange={handleChange} />
          </div>
          <div className="field">
            <label>LinkedIn</label>
            <input name="linkedin_url" value={form.linkedin_url} onChange={handleChange} placeholder="https://..." />
          </div>
          <div className="field">
            <label>Facebook</label>
            <input name="facebook_url" value={form.facebook_url} onChange={handleChange} placeholder="https://..." />
          </div>
          <div className="field">
            <label>Twitter</label>
            <input name="twitter_url" value={form.twitter_url} onChange={handleChange} placeholder="https://..." />
          </div>
          <div className="field">
            <label>Mã số thuế</label>
            <input name="tax_code" value={form.tax_code} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Giấy phép kinh doanh</label>
            <input name="business_license" value={form.business_license} onChange={handleChange} />
          </div>
          {error && <div className="field field-span error-text">{error}</div>}
          <div className="form-actions split">
            <button className="btn" type="button" onClick={() => setEditing(false)}>Hủy</button>
            <div className="action-gap" />
            <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
          </div>
        </form>
      ) : (
        <div className="info-grid">
          <InfoRow label="Quy mô" value={company?.size ? `${company.size} nhân sự` : 'Chưa cập nhật'} />
          <InfoRow label="Email" value={company?.contact_email || 'Chưa cập nhật'} />
          <InfoRow label="Điện thoại" value={company?.contact_phone || 'Chưa cập nhật'} />
          <InfoRow label="Địa chỉ" value={company?.contact_address || 'Chưa cập nhật'} />
          <InfoRow
            label="Liên kết"
            value={
              <div className="link-row">
                {company?.linkedin_url && <a href={company.linkedin_url} target="_blank" rel="noreferrer">LinkedIn</a>}
                {company?.facebook_url && <a href={company.facebook_url} target="_blank" rel="noreferrer">Facebook</a>}
                {company?.twitter_url && <a href={company.twitter_url} target="_blank" rel="noreferrer">Twitter</a>}
                {!company?.linkedin_url && !company?.facebook_url && !company?.twitter_url && 'Chưa cập nhật'}
              </div>
            }
          />
          <InfoRow label="Mã số thuế" value={company?.tax_code || 'Chưa cập nhật'} />
          <InfoRow label="Giấy phép kinh doanh" value={company?.business_license || 'Chưa cập nhật'} />
        </div>
      )}
    </div>
  )
}

function CompanyDetailsCard({ details, onSaved, onDeleted }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(buildDetailsForm(details))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [cultureExpanded, setCultureExpanded] = useState(false)

  useEffect(() => {
    setForm(buildDetailsForm(details))
  }, [details])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const validationErrors = []
    const fy = form.founded_year ? parseInt(form.founded_year, 10) : null
    const minEmp = form.employee_count_min ? parseInt(form.employee_count_min, 10) : null
    const maxEmp = form.employee_count_max ? parseInt(form.employee_count_max, 10) : null
    const currentYear = new Date().getFullYear()

    if (fy !== null) {
      if (Number.isNaN(fy) || fy < 1800 || fy > currentYear) {
        validationErrors.push(`Năm thành lập phải trong khoảng 1800-${currentYear}.`)
      }
    }
    if (minEmp !== null && (Number.isNaN(minEmp) || minEmp <= 0)) {
      validationErrors.push('Số nhân sự tối thiểu phải > 0.')
    }
    if (maxEmp !== null && (Number.isNaN(maxEmp) || maxEmp <= 0)) {
      validationErrors.push('Số nhân sự tối đa phải > 0.')
    }
    if (minEmp !== null && maxEmp !== null && minEmp > maxEmp) {
      validationErrors.push('Số nhân sự tối thiểu không được lớn hơn tối đa.')
    }
    if (form.website_url && !isValidUrl(form.website_url.trim())) {
      validationErrors.push('Website URL không hợp lệ.')
    }
    if (form.linkedin_url && !isValidUrl(form.linkedin_url.trim())) {
      validationErrors.push('LinkedIn URL không hợp lệ.')
    }
    if (form.facebook_url && !isValidUrl(form.facebook_url.trim())) {
      validationErrors.push('Facebook URL không hợp lệ.')
    }
    if (form.twitter_url && !isValidUrl(form.twitter_url.trim())) {
      validationErrors.push('Twitter URL không hợp lệ.')
    }

    if (validationErrors.length) {
      setError(validationErrors.join(' '))
      return
    }

    const payload = {}
    Object.entries(form).forEach(([key, val]) => {
      const trimmed = typeof val === 'string' ? val.trim() : val
      if (trimmed === '') return
      if (['founded_year', 'employee_count_min', 'employee_count_max'].includes(key)) {
        const parsed = parseInt(trimmed, 10)
        if (!Number.isNaN(parsed)) payload[key] = parsed
      } else {
        payload[key] = trimmed
      }
    })
    if (Object.keys(payload).length === 0) {
      setError('Nhập ít nhất một trường chi tiết.')
      return
    }
    setSaving(true)
    setError('')
    try {
      let saved
      if (details) {
        saved = await companyApi.updateMyCompanyDetails(payload)
      } else {
        saved = await companyApi.createMyCompanyDetails(payload)
      }
      onSaved?.(saved)
      setEditing(false)
    } catch (err) {
      setError(err?.message || 'Không thể lưu chi tiết.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Bạn chắc chắn muốn xóa chi tiết công ty?')) return
    try {
      await companyApi.deleteMyCompanyDetails()
      onDeleted?.()
      setForm(buildDetailsForm(null))
      setEditing(false)
    } catch (err) {
      setError(err?.message || 'Không thể xóa chi tiết.')
    }
  }

  return (
    <div className="company-card company-details-card">
      <div className="card-header">
        <div>
          <h3>Thông tin chi tiết</h3>
          <p className="muted">Thông tin về lĩnh vực, quy mô và cập nhật hồ sơ.</p>
        </div>
        {!editing && (
          <div className="button-row">
            {details && <button className="btn" onClick={handleDelete}>Xóa chi tiết</button>}
            <button className="btn btn-secondary" onClick={() => setEditing(true)}>
              {details ? 'Chỉnh sửa' : 'Thêm chi tiết'}
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <form className="form-grid" onSubmit={handleSave}>
          <div className="field">
            <label>Ngành nghề</label>
            <input name="industry" value={form.industry} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Năm thành lập</label>
            <input name="founded_year" value={form.founded_year} onChange={handleChange} inputMode="numeric" />
          </div>
          <div className="field">
            <label>Nhân sự tối thiểu</label>
            <input name="employee_count_min" value={form.employee_count_min} onChange={handleChange} inputMode="numeric" />
          </div>
          <div className="field">
            <label>Nhân sự tối đa</label>
            <input name="employee_count_max" value={form.employee_count_max} onChange={handleChange} inputMode="numeric" />
          </div>
          <div className="field">
            <label>Website</label>
            <input name="website_url" value={form.website_url} onChange={handleChange} placeholder="https://..." />
          </div>
          <div className="field">
            <label>Trụ sở (UUID)</label>
            <input name="headquarters_location_id" value={form.headquarters_location_id} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Loại hình công ty</label>
            <input name="company_type" value={form.company_type} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Doanh thu</label>
            <input name="revenue_range" value={form.revenue_range} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Mã chứng khoán</label>
            <input name="stock_symbol" value={form.stock_symbol} onChange={handleChange} />
          </div>
          <div className="field field-span">
            <label>Mô tả văn hóa</label>
            <textarea name="culture_description" value={form.culture_description} onChange={handleChange} rows={3} />
          </div>
          {error && <div className="field field-span error-text">{error}</div>}
          <div className="form-actions split">
            <button className="btn" type="button" onClick={() => { setEditing(false); setError('') }}>
              Hủy
            </button>
            <div className="action-gap" />
            <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
          </div>
        </form>
      ) : details ? (
        <div className="company-details-grid">
          <DetailItem label="Ngành nghề" value={details?.industry || 'Chưa cập nhật'} />
          <DetailItem label="Loại hình" value={details?.company_type || 'Chưa cập nhật'} />

          <DetailItem label="Năm thành lập" value={details?.founded_year || 'Chưa cập nhật'} />
          <DetailItem
            label="Nhân sự"
            value={renderEmployeeRange(details?.employee_count_min, details?.employee_count_max)}
          />

          <DetailItem label="Doanh thu" value={details?.revenue_range || 'Chưa cập nhật'} />
          <DetailItem label="Mã CK" value={details?.stock_symbol || 'Chưa cập nhật'} />

          <DetailItem label="Trụ sở" value={resolveHeadquarters(details)} />
          <DetailItem
            label="Website"
            value={
              details?.website_url ? (
                <a href={details.website_url} target="_blank" rel="noreferrer">
                  {details.website_url}
                </a>
              ) : 'Chưa cập nhật'
            }
          />

          <div className="detail-item detail-item--culture">
            <span className="detail-label">Văn hóa</span>
            <p className={`detail-value detail-value--multiline${cultureExpanded ? ' is-expanded' : ''}`}>
              {details?.culture_description || 'Chưa cập nhật'}
            </p>
            {details?.culture_description && details.culture_description.length > 200 && (
              <button className="link-btn small" type="button" onClick={() => setCultureExpanded((v) => !v)}>
                {cultureExpanded ? 'Thu gọn' : 'Xem thêm'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <p>Chưa có thông tin chi tiết công ty.</p>
          <button className="btn btn-primary" onClick={() => setEditing(true)}>Thêm chi tiết</button>
        </div>
      )}
    </div>
  )
}

function CompanyBenefitsSection({ benefits, onChange }) {
  const [newBenefit, setNewBenefit] = useState({
    benefit_type: '',
    title: '',
    description: '',
    is_featured: false,
  })
  const [savingNew, setSavingNew] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState('')
  const [editForm, setEditForm] = useState(newBenefit)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newBenefit.benefit_type.trim() || !newBenefit.title.trim()) {
      setError('Nhập loại phúc lợi và tiêu đề.')
      return
    }
    setSavingNew(true)
    setError('')
    try {
      const created = await companyApi.createBenefit({
        benefit_type: newBenefit.benefit_type.trim(),
        title: newBenefit.title.trim(),
        description: newBenefit.description.trim() || undefined,
        is_featured: !!newBenefit.is_featured,
      })
      onChange?.([created, ...benefits])
      setNewBenefit({ benefit_type: '', title: '', description: '', is_featured: false })
    } catch (err) {
      setError(err?.message || 'Không thể thêm phúc lợi.')
    } finally {
      setSavingNew(false)
    }
  }

  const startEdit = (item) => {
    setEditingId(item.id || item._id)
    setEditForm({
      benefit_type: item.benefit_type || '',
      title: item.title || '',
      description: item.description || '',
      is_featured: !!item.is_featured,
    })
  }

  const handleUpdate = async (id) => {
    if (!editForm.benefit_type.trim() || !editForm.title.trim()) {
      setError('Nhập loại phúc lợi và tiêu đề.')
      return
    }
    setSavingNew(true)
    setError('')
    try {
      const updated = await companyApi.updateBenefit(id, {
        benefit_type: editForm.benefit_type.trim(),
        title: editForm.title.trim(),
        description: editForm.description.trim() || undefined,
        is_featured: !!editForm.is_featured,
      })
      const mapped = benefits.map((b) => (String(b.id || b._id) === String(id) ? { ...b, ...updated } : b))
      onChange?.(mapped)
      setEditingId('')
    } catch (err) {
      setError(err?.message || 'Không thể cập nhật phúc lợi.')
    } finally {
      setSavingNew(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa phúc lợi này?')) return
    try {
      await companyApi.deleteBenefit(id)
      onChange?.(benefits.filter((b) => String(b.id || b._id) !== String(id)))
    } catch (err) {
      setError(err?.message || 'Không thể xóa phúc lợi.')
    }
  }

  return (
    <div className="company-card">
      <div className="card-header">
        <div>
          <h3>Phúc lợi công ty</h3>
          <p className="muted">Thêm những điểm nổi bật về phúc lợi cho ứng viên.</p>
        </div>
      </div>

      <form className="benefit-form" onSubmit={handleCreate}>
        <div className="field">
          <label>Loại phúc lợi</label>
          <input
            name="benefit_type"
            value={newBenefit.benefit_type}
            onChange={(e) => setNewBenefit((prev) => ({ ...prev, benefit_type: e.target.value }))}
            placeholder="Bảo hiểm, Nghỉ phép, ..."
          />
        </div>
        <div className="field">
          <label>Tiêu đề</label>
          <input
            name="title"
            value={newBenefit.title}
            onChange={(e) => setNewBenefit((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Bảo hiểm sức khỏe toàn diện"
          />
        </div>
        <div className="field field-span">
          <label>Mô tả</label>
          <textarea
            name="description"
            value={newBenefit.description}
            onChange={(e) => setNewBenefit((prev) => ({ ...prev, description: e.target.value }))}
            rows={3}
            placeholder="Mô tả ngắn về phúc lợi"
          />
        </div>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={newBenefit.is_featured}
            onChange={(e) => setNewBenefit((prev) => ({ ...prev, is_featured: e.target.checked }))}
          />
          <span>Đánh dấu nổi bật</span>
        </label>
        {error && <div className="field field-span error-text">{error}</div>}
        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={savingNew}>
            {savingNew ? 'Đang lưu...' : 'Thêm phúc lợi'}
          </button>
        </div>
      </form>

      <div className="benefit-list">
        {benefits.length === 0 && <div className="empty-state">Chưa có phúc lợi nào.</div>}
        {benefits.map((item) => {
          const id = item.id || item._id
          const isEditing = String(editingId) === String(id)
          return (
            <div key={id} className="benefit-card">
              {isEditing ? (
                <>
                  <div className="field">
                    <label>Loại phúc lợi</label>
                    <input
                      name="benefit_type"
                      value={editForm.benefit_type}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, benefit_type: e.target.value }))}
                    />
                  </div>
                  <div className="field">
                    <label>Tiêu đề</label>
                    <input
                      name="title"
                      value={editForm.title}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="field field-span">
                    <label>Mô tả</label>
                    <textarea
                      name="description"
                      value={editForm.description}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={editForm.is_featured}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, is_featured: e.target.checked }))}
                    />
                    <span>Đánh dấu nổi bật</span>
                  </label>
                  <div className="button-row">
                    <button
                      className="btn"
                      type="button"
                      onClick={() => {
                        setEditingId('')
                        setEditForm({ benefit_type: '', title: '', description: '', is_featured: false })
                      }}
                    >
                      Hủy
                    </button>
                    <button className="btn btn-primary" type="button" onClick={() => handleUpdate(id)} disabled={savingNew}>
                      {savingNew ? 'Đang lưu...' : 'Lưu'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="benefit-head">
                    <div>
                      <div className="benefit-type">{item.benefit_type}</div>
                      <h4>{item.title}</h4>
                    </div>
                    <div className="button-row">
                      <button className="btn" onClick={() => handleDelete(id)}>Xóa</button>
                      <button className="btn btn-secondary" onClick={() => startEdit(item)}>Sửa</button>
                    </div>
                  </div>
                  {item.description && <p className="muted">{item.description}</p>}
                  {item.is_featured && <span className="badge badge-featured">Nổi bật</span>}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value">{value || 'Chưa cập nhật'}</span>
    </div>
  )
}

function DetailItem({ label, value }) {
  return (
    <div className="detail-item">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value || 'Chưa cập nhật'}</span>
    </div>
  )
}

function renderEmployeeRange(min, max) {
  if (min && max) return `${min} - ${max} nhân sự`
  if (min) return `Từ ${min} nhân sự`
  if (max) return `Đến ${max} nhân sự`
  return 'Chưa cập nhật'
}

function resolveHeadquarters(details) {
  if (!details) return 'Chưa cập nhật'
  const name = details.headquarters_location?.name || details.headquarters || details.headquarters_location_name
  if (name) return name
  return 'Chưa cập nhật'
}

function getStatusInfo(company) {
  const isVerified = Boolean(company?.is_verified)
  const status = (company?.status || '').toLowerCase()
  const baseLink = company?.id ? `/companies/${company.id}` : null
  const isActive =
    isVerified ||
    ['active', 'verified', 'approved', 'accept', 'confirm'].some((s) => status.includes(s))
  const isPending = ['pending', 'review', 'wait'].some((s) => status.includes(s))
  const isRejected = ['reject', 'deny', 'blocked'].some((s) => status.includes(s))

  if (isActive) {
    return {
      kind: 'verified',
      label: 'Đã xác minh',
      subText: 'Hồ sơ doanh nghiệp của bạn đã được phê duyệt.',
      conclusion: 'Bạn có thể đăng job và hiển thị công khai.',
      publicLink: baseLink,
    }
  }

  if (isPending) {
    return {
      kind: 'pending',
      label: 'Đang chờ xác minh',
      subText: 'Chúng tôi đang xem xét hồ sơ của bạn.',
      conclusion: 'Tạm thời bạn chỉ có thể lưu job dưới dạng nháp.',
      publicLink: null,
    }
  }

  if (isRejected) {
    return {
      kind: 'rejected',
      label: 'Chưa xác minh',
      subText: 'Vui lòng hoàn thiện hồ sơ để được duyệt.',
      conclusion: 'Tạm thời bạn chỉ có thể lưu job dưới dạng nháp.',
      publicLink: null,
    }
  }

  return {
    kind: 'default',
    label: 'Chưa xác minh',
    subText: 'Vui lòng hoàn thiện hồ sơ để được duyệt.',
    conclusion: 'Tạm thời bạn chỉ có thể lưu job dưới dạng nháp.',
    publicLink: null,
  }
}

function buildCompanyForm(company) {
  return {
    name: company?.name || '',
    description: company?.description || '',
    size: company?.size ? String(company.size) : '',
    contact_email: company?.contact_email || '',
    contact_phone: company?.contact_phone || '',
    contact_address: company?.contact_address || '',
    linkedin_url: company?.linkedin_url || '',
    facebook_url: company?.facebook_url || '',
    twitter_url: company?.twitter_url || '',
    tax_code: company?.tax_code || '',
    business_license: company?.business_license || '',
  }
}

function buildDetailsForm(details) {
  return {
    industry: details?.industry || '',
    founded_year: details?.founded_year ? String(details.founded_year) : '',
    employee_count_min: details?.employee_count_min ? String(details.employee_count_min) : '',
    employee_count_max: details?.employee_count_max ? String(details.employee_count_max) : '',
    website_url: details?.website_url || '',
    headquarters_location_id: details?.headquarters_location_id || '',
    company_type: details?.company_type || '',
    revenue_range: details?.revenue_range || '',
    stock_symbol: details?.stock_symbol || '',
    culture_description: details?.culture_description || '',
  }
}
