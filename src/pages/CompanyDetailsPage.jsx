import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { companyApi } from '../services/companyApi'
import CompanyHeader from './CompanyHeader.jsx'
import CompanyInfoSection from './CompanyInfoSection.jsx'
import CompanyContactSection from './CompanyContactSection.jsx'
import CompanyBenefitsSection from './CompanyBenefitsSection.jsx'
import CompanyCultureSection from './CompanyCultureSection.jsx'
import CompanyJobsSection from './CompanyJobsSection.jsx'
import CompanySidebarSummary from './CompanySidebarSummary.jsx'
import './CompanyDetails.css'

const formatSalaryRange = (range) => {
  if (!range) return ''
  const min = range.min || range.salaryMin || range.salary_min
  const max = range.max || range.salaryMax || range.salary_max
  const currency = range.currency || 'USD'
  if (min && max) return `${min} - ${max} ${currency}`
  if (min) return `Từ ${min} ${currency}`
  if (max) return `Đến ${max} ${currency}`
  return ''
}

const formatDate = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('vi-VN')
}

const formatEmployeeRange = (company) => {
  const details = company?.company_details || {}
  if (details.employee_count_min && details.employee_count_max) {
    return `${details.employee_count_min}-${details.employee_count_max} nhân sự`
  }
  if (company?.size) return `${company.size} nhân sự`
  return 'Chưa rõ'
}

const SAMPLE_COMPANY = {
  id: 'sample-company',
  name: 'ACME Software',
  logo_url: '',
  is_verified: true,
  contact_email: 'hr@acme.com',
  contact_phone: '+84 24 0000 000',
  contact_address: 'Hà Nội, Việt Nam',
  tax_code: '0101234567',
  status: 'active',
  company_details: {
    industry: 'Software',
    company_type: 'Product',
    founded_year: 2015,
    employee_count_min: 100,
    employee_count_max: 250,
    website_url: 'https://example.com',
    revenue_range: '1M-5M USD',
    stock_symbol: 'ACME',
    culture_description: 'Môi trường mở, tập trung học hỏi, khuyến khích sáng tạo.',
    headquarters_location: { name: 'Hà Nội, Việt Nam' },
  },
  company_benefits: [
    { id: 'b1', title: 'Lương cạnh tranh', description: 'Review hằng năm', benefit_type: 'salary', is_featured: true },
    { id: 'b2', title: 'Bảo hiểm sức khỏe', description: 'Gói premium cho nhân viên và gia đình', benefit_type: 'health', is_featured: false },
    { id: 'b3', title: 'Đào tạo', description: 'Ngân sách 1000$/năm cho khóa học', benefit_type: 'learning', is_featured: false },
  ],
  open_jobs: [
    {
      id: 'job-1',
      title: 'Frontend Engineer',
      location: { name: 'Hà Nội' },
      salary_range: { min: 1800, max: 2500, currency: 'USD' },
      job_type: 'full_time',
      experience_level: '3+ năm kinh nghiệm',
      posted_at: '2025-01-10',
    },
    {
      id: 'job-2',
      title: 'Backend Developer',
      location: { name: 'Remote' },
      salary_range: { min: 1700, max: 2300, currency: 'USD' },
      job_type: 'full_time',
      experience_level: '2+ năm kinh nghiệm',
      posted_at: '2025-01-05',
    },
  ],
  stats: {
    open_jobs_count: 2,
  },
}

const SAMPLE_COMPANIES = {
  'sample-1': {
    ...SAMPLE_COMPANY,
    id: 'sample-1',
  },
  'sample-2': {
    ...SAMPLE_COMPANY,
    id: 'sample-2',
    name: 'Bright Labs',
    contact_address: 'TP. Hồ Chí Minh, Việt Nam',
    company_details: {
      ...SAMPLE_COMPANY.company_details,
      industry: 'Design & Tech',
      company_type: 'Agency',
      headquarters_location: { name: 'TP. Hồ Chí Minh, Việt Nam' },
    },
  },
  'sample-3': {
    ...SAMPLE_COMPANY,
    id: 'sample-3',
    name: 'CloudOps Asia',
    contact_address: 'Đà Nẵng, Việt Nam',
    company_details: {
      ...SAMPLE_COMPANY.company_details,
      industry: 'Cloud & DevOps',
      company_type: 'Outsourcing',
      headquarters_location: { name: 'Đà Nẵng, Việt Nam' },
    },
  },
  'sample-company': SAMPLE_COMPANY,
}

const normalizeCompany = (raw) => {
  if (!raw) return null
  
  // Handle response format: { message, data } or direct data
  const companyData = raw?.data ?? raw
  if (!companyData) return null
  
  // Map company_details - backend returns as object
  const details = companyData.company_details || {}
  
  // Map location - can be from company_details.headquarters_location or contact_address
  const location = 
    details.headquarters_location?.name || 
    companyData.contact_address || 
    ''
  
  // Backend returns 'jobs' array, map to 'open_jobs' for consistency
  // Also ensure jobs have proper structure
  const openJobs = (companyData.open_jobs || companyData.jobs || []).map((job) => {
    const withLocation =
      job.locations && typeof job.locations === 'object'
        ? {
            ...job,
            location: {
              id: job.locations.id,
              name: job.locations.name,
              type: job.locations.type
            }
          }
        : job

    // Get company logo - prioritize from company data, fallback to job's company object
    const companyLogoUrl = 
      companyData.logo_url || 
      companyData.logoUrl ||
      job.company?.logo_url ||
      job.company?.logoUrl ||
      null

    return {
      ...withLocation,
      company: {
        name: companyData.name,
        logo_url: companyLogoUrl
      },
      companyName: companyData.name,
      companyLogoUrl: companyLogoUrl
    }
  })
  
  // Map company_benefits - backend returns as array
  const benefits = companyData.company_benefits || []
  
  return {
    ...companyData,
    // Core company fields
    id: companyData.id,
    name: companyData.name,
    description: companyData.description,
    logo_url: companyData.logo_url,
    size: companyData.size,
    contact_email: companyData.contact_email,
    contact_phone: companyData.contact_phone,
    contact_address: companyData.contact_address,
    linkedin_url: companyData.linkedin_url,
    facebook_url: companyData.facebook_url,
    twitter_url: companyData.twitter_url,
    created_at: companyData.created_at,
    updated_at: companyData.updated_at,
    
    // Nested objects
    company_details: details,
    company_benefits: benefits,
    
    // Computed fields
    location,
    open_jobs: openJobs,
    stats: companyData.stats || { open_jobs_count: openJobs.length || 0 },
  }
}

export default function CompanyDetailsPage() {
  const { id } = useParams()
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const fetchCompany = async () => {
      setLoading(true)
      setError('')
      try {
        const sample = SAMPLE_COMPANIES[id]
        if (sample) {
          if (mounted) {
            setCompany(normalizeCompany(sample))
            setLoading(false)
          }
          return
        }

        const data = await companyApi.getPublicCompany(id)
        if (!mounted) return
        
        const normalized = normalizeCompany(data)
        if (!normalized) {
          throw new Error('Company data is null or invalid')
        }
        
        setCompany(normalized)
        setError('')
      } catch (err) {
        if (!mounted) return
        console.error('Error fetching company:', err)
        setCompany(null)
        setError(err?.message || 'Không tải được thông tin công ty.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchCompany()
    return () => {
      mounted = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="company-details-page">
        <div className="container">
          <div className="skeleton-card" />
          <div className="details-grid">
            <div className="skeleton-card tall" />
            <div className="skeleton-card" />
          </div>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="company-details-page">
        <div className="container">
          <div className="state-card error">
            <p>Không tải được thông tin công ty.</p>
            <button className="btn primary" onClick={() => window.location.reload()}>
              Thử lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="company-details-page">
      <div className="container">
        <CompanyHeader company={company} />

        <div className="details-grid">
          <main className="details-main">
            <CompanyInfoSection company={company} />
            <CompanyContactSection company={company} />
            <CompanyBenefitsSection benefits={company.company_benefits || company.benefits} />
            <CompanyCultureSection culture={company.company_details?.culture_description} />
            <CompanyJobsSection
              jobs={company.open_jobs || []}
              openCount={company.stats?.open_jobs_count || (company.open_jobs || []).length}
            />
          </main>
          <aside className="details-sidebar">
            <CompanySidebarSummary
              company={company}
              formatEmployeeRange={formatEmployeeRange}
              onQuickApply={() => {
                const el = document.getElementById('company-jobs-section')
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              }}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}
