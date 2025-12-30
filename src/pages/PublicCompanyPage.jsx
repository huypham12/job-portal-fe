import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { companyApi } from '../services/companyApi'
import './PublicCompany.css'

const normalizeBenefits = (list) => {
  if (Array.isArray(list)) return list
  if (Array.isArray(list?.data)) return list.data
  if (Array.isArray(list?.items)) return list.items
  return []
}

const SAMPLE_COMPANIES = {
  'sample-1': {
    id: 'sample-1',
    name: 'ACME Software',
    description: 'Cong ty phan mem phuc vu khach hang toan cau.',
    logo_url: '',
    size: 180,
    contact_address: 'Ha Noi, Viet Nam',
    contact_email: 'hello@acme.com',
    contact_phone: '+84 24 0000 000',
    tax_code: '0101234567',
    business_license: 'ACME-2025',
    company_details: {
      industry: 'Software',
      founded_year: 2015,
      employee_count_min: 100,
      employee_count_max: 250,
      website_url: 'https://example.com',
      company_type: 'Product',
      revenue_range: '1M-5M USD',
      culture_description: 'Moi truong mo, hoc hoi va khuyen khich sang tao.',
      headquarters_location: { id: 'loc-hn', name: 'Ha Noi, Viet Nam' },
    },
    company_benefits: [
      { id: 'b1', title: 'Luong canh tranh', description: 'Review hang nam', benefit_type: 'salary', is_featured: true },
      { id: 'b2', title: 'Bao hiem suc khoe', description: 'Goi premium cho nhan vien', benefit_type: 'health' },
      { id: 'b3', title: 'Dao tao', description: 'Ngan sach khoa hoc 1000$/nam', benefit_type: 'learning' },
    ],
  },
  'sample-2': {
    id: 'sample-2',
    name: 'Bright Labs',
    description: 'Studio thiet ke va phat trien san pham so.',
    logo_url: '',
    size: 80,
    contact_address: 'TP. Ho Chi Minh, Viet Nam',
    contact_email: 'contact@brightlabs.vn',
    company_details: {
      industry: 'Design & Tech',
      employee_count_min: 50,
      employee_count_max: 100,
      website_url: 'https://brightlabs.vn',
      company_type: 'Agency',
      culture_description: 'Sang tao va hop tac la cot loi.',
      headquarters_location: { id: 'loc-hcm', name: 'TP. Ho Chi Minh, Viet Nam' },
    },
    company_benefits: [
      { id: 'b1', title: 'Hybrid working', description: '3 ngay van phong / 2 ngay remote', benefit_type: 'working_style' },
      { id: 'b2', title: 'Team building', description: '2 lan/nam', benefit_type: 'culture' },
    ],
  },
  'sample-3': {
    id: 'sample-3',
    name: 'CloudOps Asia',
    description: 'Cung cap dich vu ha tang va tu van DevOps.',
    logo_url: '',
    size: 40,
    contact_address: 'Da Nang, Viet Nam',
    company_details: {
      industry: 'Cloud & DevOps',
      employee_count_min: 20,
      employee_count_max: 60,
      website_url: 'https://cloudops.asia',
      company_type: 'Outsourcing',
      culture_description: 'Chia se kien thuc va van hanh tinh gon.',
      headquarters_location: { id: 'loc-dn', name: 'Da Nang, Viet Nam' },
    },
    company_benefits: [
      { id: 'b1', title: 'Lam viec remote', description: 'Remote hoan toan', benefit_type: 'working_style' },
      { id: 'b2', title: 'Ho tro hoc AWS', description: 'Tai tro 50% chi phi thi', benefit_type: 'learning' },
    ],
  },
}

export default function PublicCompanyPage() {
  const { id } = useParams()
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
        const sample = SAMPLE_COMPANIES[id]
        if (sample) {
          if (!active) return
          setCompany(sample)
          setDetails(sample?.company_details || sample?.details || null)
          setBenefits(normalizeBenefits(sample?.company_benefits || sample?.benefits))
          setLoading(false)
          return
        }

        const res = await companyApi.getPublicCompany(id)
        if (!active) return
        const data = res?.data ?? res
        setCompany(data)
        setDetails(data?.details || data?.company_details || null)
        setBenefits(normalizeBenefits(data?.benefits || data?.company_benefits))
      } catch (err) {
        if (!active) return
        if (err?.status === 404) {
          setError('Khong tim thay doanh nghiep.')
        } else {
          setError(err?.message || 'Khong the tai thong tin cong ty.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="public-company-page">
        <div className="loading-block">
          <div className="spinner" aria-hidden />
          <div>Dang tai thong tin cong ty...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="public-company-page">
        <div className="error-block">
          <h3>Thong bao</h3>
          <p className="muted">{error}</p>
        </div>
      </div>
    )
  }

  const logo = company?.logo_url
  const name = company?.name || 'Cong ty'

  return (
    <div className="public-company-page">
      <div className="hero-card">
        <div className="hero-main">
          <div className="avatar-xl">
            {logo ? <img src={logo} alt={name} /> : name.charAt(0)}
          </div>
          <div>
            <p className="eyebrow-text">Ho so doanh nghiep</p>
            <h1>{name}</h1>
            <p className="muted">{company?.description || 'Chua co mo ta ve cong ty nay.'}</p>
            <div className="hero-tags">
              {details?.industry && <span className="badge badge-soft">{details.industry}</span>}
              {company?.size && <span className="badge badge-soft">{company.size} nhan su</span>}
              {details?.company_type && <span className="badge badge-soft">{details.company_type}</span>}
            </div>
          </div>
        </div>
        <div className="hero-side">
          <div className="info-row">
            <span className="info-label">Thanh lap</span>
            <span className="info-value">{details?.founded_year || 'Chua cap nhat'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Website</span>
            <span className="info-value">
              {details?.website_url ? (
                <a href={details.website_url} target="_blank" rel="noreferrer">
                  {details.website_url}
                </a>
              ) : (
                'Chua cap nhat'
              )}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Lien he</span>
            <span className="info-value">{company?.contact_email || company?.contact_phone || 'Chua cap nhat'}</span>
          </div>
          {company?.contact_address && (
            <div className="info-row">
              <span className="info-label">Dia chi</span>
              <span className="info-value">{company.contact_address}</span>
            </div>
          )}
          <div className="social-row">
            {company?.linkedin_url && <a href={company.linkedin_url} target="_blank" rel="noreferrer">LinkedIn</a>}
            {company?.facebook_url && <a href={company.facebook_url} target="_blank" rel="noreferrer">Facebook</a>}
            {company?.twitter_url && <a href={company.twitter_url} target="_blank" rel="noreferrer">Twitter</a>}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Ve cong ty</h3>
          <p className="muted">{company?.description || 'Chua co mo ta chi tiet.'}</p>
          <div className="info-stack">
            <InfoLine label="Ma so thue" value={company?.tax_code} />
            <InfoLine label="Giay phep KD" value={company?.business_license} />
            <InfoLine
              label="Nhan su"
              value={
                details?.employee_count_min || details?.employee_count_max
                  ? `${details?.employee_count_min || '?'} - ${details?.employee_count_max || '?'}`
                  : company?.size
              }
            />
            <InfoLine label="Tru so" value={details?.headquarters_location_id} />
            <InfoLine label="Doanh thu" value={details?.revenue_range} />
            <InfoLine label="Ma CK" value={details?.stock_symbol} />
          </div>
        </div>

        <div className="card">
          <h3>Van hoa & Gia tri</h3>
          <p className="muted">{details?.culture_description || 'Chua co thong tin van hoa.'}</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Phuc loi</h3>
          <p className="muted">Cac phuc loi danh cho nhan vien tai cong ty.</p>
        </div>
        <div className="benefit-grid">
          {benefits.length === 0 && <div className="empty-state">Chua cong bo phuc loi.</div>}
          {benefits.map((b) => (
            <div className="benefit-tile" key={b.id || b._id}>
              <div className="benefit-type">{b.benefit_type}</div>
              <h4>{b.title}</h4>
              {b.description && <p className="muted">{b.description}</p>}
              {b.is_featured && <span className="badge badge-featured">Noi bat</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function InfoLine({ label, value }) {
  return (
    <div className="info-line">
      <span className="info-label">{label}</span>
      <span className="info-value">{value || 'Chua cap nhat'}</span>
    </div>
  )
}
