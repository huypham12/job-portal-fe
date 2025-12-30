import React, { useCallback, useEffect, useMemo, useState } from 'react'
import CompanyFilters from './CompanyFilters.jsx'
import CompanyList from './CompanyList.jsx'
import { CompanyService } from '../lib/api.js'
import './Companies.css'

const DEFAULT_LIMIT = 12

const sizeOptions = [
  { value: '', label: 'Tất cả quy mô' },
  { value: '1-10', label: '1-10', min: 1, max: 10 },
  { value: '11-50', label: '11-50', min: 11, max: 50 },
  { value: '51-200', label: '51-200', min: 51, max: 200 },
  { value: '201-500', label: '201-500', min: 201, max: 500 },
  { value: '500+', label: '500+', min: 500, max: null }
]

const companyTypeOptions = [
  { value: '', label: 'Tất cả loại hình' },
  { value: 'Product', label: 'Product' },
  { value: 'Outsourcing', label: 'Outsourcing' },
  { value: 'Agency', label: 'Agency' },
  { value: 'Hybrid', label: 'Hybrid' }
]

const sortOptions = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'open_jobs', label: 'Nhiều tin tuyển' },
  { value: 'name_az', label: 'Tên A-Z' }
]

const sortMapping = {
  newest: { by: 'created_at', order: 'desc' },
  oldest: { by: 'created_at', order: 'asc' },
  open_jobs: { by: 'open_jobs_count', order: 'desc' },
  name_az: { by: 'name', order: 'asc' }
}

const INITIAL_FILTERS = {
  search: '',
  industry: '',
  location_id: '',
  company_type: '',
  size_range: '',
  has_open_jobs: false,
  page: 1,
  limit: DEFAULT_LIMIT,
  sort: 'newest'
}

const SAMPLE_COMPANIES = [
  {
    id: 'sample-1',
    name: 'ACME Software',
    description: 'SaaS company serving global clients.',
    logo_url: '',
    size: 180,
    contact_address: 'Ha Noi, Viet Nam',
    is_verified: true,
    company_details: {
      industry: 'Software',
      founded_year: 2015,
      employee_count_min: 100,
      employee_count_max: 250,
      website_url: 'https://example.com',
      company_type: 'Product',
      culture_description: 'Open and learning culture.',
      headquarters_location: { id: 'loc-hn', name: 'Ha Noi, Viet Nam' }
    },
    stats: { open_jobs_count: 12 }
  },
  {
    id: 'sample-2',
    name: 'Bright Labs',
    description: 'Design and product studio.',
    logo_url: '',
    size: 80,
    contact_address: 'Ho Chi Minh City, Viet Nam',
    is_verified: false,
    company_details: {
      industry: 'Design & Tech',
      employee_count_min: 50,
      employee_count_max: 100,
      website_url: 'https://brightlabs.vn',
      company_type: 'Agency',
      culture_description: 'Creative and collaborative.',
      headquarters_location: { id: 'loc-hcm', name: 'Ho Chi Minh City, Viet Nam' }
    },
    stats: { open_jobs_count: 5 }
  },
  {
    id: 'sample-3',
    name: 'CloudOps Asia',
    description: 'Cloud infrastructure and DevOps services.',
    logo_url: '',
    size: 40,
    contact_address: 'Da Nang, Viet Nam',
    is_verified: true,
    company_details: {
      industry: 'Cloud & DevOps',
      employee_count_min: 20,
      employee_count_max: 60,
      website_url: 'https://cloudops.asia',
      company_type: 'Outsourcing',
      culture_description: 'Lean operations and knowledge sharing.',
      headquarters_location: { id: 'loc-dn', name: 'Da Nang, Viet Nam' }
    },
    stats: { open_jobs_count: 3 }
  }
]

const buildQuery = (filters) => {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search.trim())
  if (filters.industry) params.set('industry', filters.industry)
  if (filters.location_id) params.set('location_id', filters.location_id)
  if (filters.company_type) params.set('company_type', filters.company_type)
  if (filters.size_range) params.set('size_range', filters.size_range)
  if (filters.has_open_jobs) params.set('has_open_jobs', 'true')
  const sortRule = sortMapping[filters.sort] || sortMapping.newest
  params.set('sort_by', sortRule.by)
  params.set('order', sortRule.order)
  params.set('page', String(filters.page || 1))
  params.set('limit', String(filters.limit || DEFAULT_LIMIT))
  return params.toString()
}

const applyClientSort = (items, sortKey) => {
  if (!Array.isArray(items)) return []
  const list = [...items]
  switch (sortKey) {
    case 'oldest':
      return list.sort(
        (a, b) =>
          new Date(a.created_at || a.posted_at || a.verification_date || 0) -
          new Date(b.created_at || b.posted_at || b.verification_date || 0)
      )
    case 'open_jobs':
      return list.sort((a, b) => (b?.stats?.open_jobs_count || 0) - (a?.stats?.open_jobs_count || 0))
    case 'name_az':
      return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    case 'newest':
    default:
      return list.sort(
        (a, b) =>
          new Date(b.created_at || b.posted_at || b.verification_date || 0) -
          new Date(a.created_at || a.posted_at || a.verification_date || 0)
      )
  }
}

const normalizeCompany = (raw) => {
  if (!raw) return null
  const details = raw.company_details || {}
  const location =
    details.headquarters_location ||
    (details.headquarters_location_id ? { id: details.headquarters_location_id, name: details.headquarters_location_id } : null) ||
    (raw.contact_address ? { name: raw.contact_address } : null)
  const sizeMin = details.employee_count_min
  const sizeMax = details.employee_count_max
  const computedSize = sizeMin && sizeMax ? `${sizeMin}-${sizeMax}` : raw.size ? `${raw.size}` : null
  return {
    ...raw,
    company_details: details,
    location,
    display_size: computedSize,
    description_short: raw.description || details.culture_description || '',
    stats: raw.stats || { open_jobs_count: raw.open_jobs_count ?? 0 }
  }
}

const applyClientFilters = (items, filters) => {
  const sizeBucket = sizeOptions.find((opt) => opt.value === filters.size_range)
  return items.filter((c) => {
    const searchText = (filters.search || '').trim().toLowerCase()
    const industryOk = !filters.industry || (c.company_details?.industry || '').toLowerCase() === filters.industry.toLowerCase()
    const typeOk = !filters.company_type || (c.company_details?.company_type || '').toLowerCase() === filters.company_type.toLowerCase()
    const loc = c.location || {}
    const locationOk =
      !filters.location_id ||
      String(loc.id || '').toLowerCase() === filters.location_id.toLowerCase() ||
      (loc.name || '').toLowerCase() === filters.location_id.toLowerCase()
    const openJobsOk = !filters.has_open_jobs || (c.stats?.open_jobs_count || 0) > 0

    let sizeOk = true
    if (sizeBucket && sizeBucket.value) {
      const minCount = c.company_details?.employee_count_min ?? c.size ?? 0
      const maxCount = c.company_details?.employee_count_max ?? c.size ?? minCount
      const lower = sizeBucket.min ?? 0
      const upper = sizeBucket.max
      sizeOk = upper === null ? minCount >= lower : maxCount >= lower && minCount <= upper
    }

    const searchOk =
      !searchText ||
      (c.name || '').toLowerCase().includes(searchText) ||
      (c.description || '').toLowerCase().includes(searchText) ||
      (c.company_details?.industry || '').toLowerCase().includes(searchText) ||
      (c.location?.name || '').toLowerCase().includes(searchText)

    return industryOk && typeOk && locationOk && openJobsOk && sizeOk && searchOk
  })
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [formState, setFormState] = useState(INITIAL_FILTERS)
  const [pagination, setPagination] = useState({ page: 1, limit: DEFAULT_LIMIT, total: 0 })
  const [industryOptions, setIndustryOptions] = useState([{ value: '', label: 'Tất cả ngành' }])
  const [locationOptions, setLocationOptions] = useState([{ value: '', label: 'Tất cả địa điểm' }])

  const loadCompanies = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const query = buildQuery(filters)
      const payload = await CompanyService.list(query ? `?${query}` : '')
      const rawData = payload?.data ?? payload
      const items = Array.isArray(rawData) ? rawData.map(normalizeCompany).filter(Boolean) : []
      const sorted = applyClientSort(items, filters.sort)
      setCompanies(sorted)
      const pag = payload?.meta || payload?.pagination || {}
      setPagination({
        page: pag.page || filters.page || 1,
        limit: pag.limit || filters.limit || DEFAULT_LIMIT,
        total: pag.total ?? items.length
      })

      const industries = new Set(items.map((c) => c?.company_details?.industry).filter(Boolean))
      setIndustryOptions([{ value: '', label: 'Tất cả ngành' }, ...Array.from(industries).map((i) => ({ value: i, label: i }))])

      const locationsMap = new Map()
      items.forEach((c) => {
        if (c.location?.id || c.location?.name) {
          const key = c.location.id || c.location.name
          locationsMap.set(key, {
            value: c.location.id || c.location.name,
            label: c.location.name || c.location.id
          })
        }
      })
      setLocationOptions([{ value: '', label: 'Tất cả địa điểm' }, ...Array.from(locationsMap.values())])
    } catch (err) {
      const sampleNormalized = SAMPLE_COMPANIES.map(normalizeCompany).filter(Boolean)
      const filteredSample = applyClientFilters(sampleNormalized, filters)
      const sortedSample = applyClientSort(filteredSample, filters.sort)
      setCompanies(sortedSample)
      setPagination({ page: 1, limit: DEFAULT_LIMIT, total: filteredSample.length })

      const industries = new Set(sampleNormalized.map((c) => c?.company_details?.industry).filter(Boolean))
      setIndustryOptions([{ value: '', label: 'Tất cả ngành' }, ...Array.from(industries).map((i) => ({ value: i, label: i }))])
      const locationsMap = new Map()
      sampleNormalized.forEach((c) => {
        if (c.location?.id || c.location?.name) {
          const key = c.location.id || c.location.name
          locationsMap.set(key, {
            value: c.location.id || c.location.name,
            label: c.location.name || c.location.id
          })
        }
      })
      setLocationOptions([{ value: '', label: 'Tất cả địa điểm' }, ...Array.from(locationsMap.values())])
      setError(err?.message || 'Không tải được danh sách công ty (đang hiển thị dữ liệu mẫu).')
    } finally {
      setLoading(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [filters])

  useEffect(() => {
    loadCompanies()
  }, [loadCompanies])

  const handleFilterChange = (partial) => {
    setFormState((prev) => ({
      ...prev,
      ...partial,
      page: 1
    }))
  }

  const handleApplyFilters = () => {
    setFilters((prev) => ({
      ...prev,
      ...formState,
      page: 1
    }))
  }

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }))
    setFormState((prev) => ({ ...prev, page }))
  }

  const handleSortChange = (sort) => {
    setFilters((prev) => ({ ...prev, sort, page: 1 }))
    setFormState((prev) => ({ ...prev, sort }))
  }

  const handleClearFilters = () => {
    setFormState(INITIAL_FILTERS)
    setFilters(INITIAL_FILTERS)
  }

  const totalFound = pagination.total || companies.length
  const sortedCompanies = useMemo(() => applyClientSort(companies, filters.sort), [companies, filters.sort])

  return (
    <div className="companies-page">
      <div className="companies-container">
        <div className="sidebar-column">
          <CompanyFilters
            filters={formState}
            onChange={handleFilterChange}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
            sizeOptions={sizeOptions}
            industryOptions={industryOptions}
            locationOptions={locationOptions}
            companyTypeOptions={companyTypeOptions}
          />
        </div>
        <div className="list-column">
          <CompanyList
            items={sortedCompanies}
            loading={loading}
            error={error}
            onRetry={loadCompanies}
            total={totalFound}
            page={filters.page}
            limit={filters.limit}
            onPageChange={handlePageChange}
            sort={filters.sort}
            onSortChange={handleSortChange}
            clearFilters={handleClearFilters}
            sortOptions={sortOptions}
          />
        </div>
      </div>
    </div>
  )
}
