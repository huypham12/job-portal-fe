// Normalize search hit from backend to a stable job shape for frontend components
export function normalizeSearchHit(hit = {}) {
  const src = hit._source || {}

  const title = hit.title || src.title || src.name || ''

  // company may be provided at top-level (hit.company) or inside _source
  const companyObj = hit.company || src.company || src.company_name || src.companyName
  const companyName =
    typeof companyObj === 'string'
      ? companyObj
      : companyObj?.name || src.company_name || src.companyName || ''

  const rawSkills = src.skills || src.tags || src.metadata?.skills || []
  const skills = Array.isArray(rawSkills)
    ? rawSkills
        .map((s) => {
          if (s == null) return ''
          if (typeof s === 'string') return s
          if (typeof s === 'object') return s.name || s.label || s.id || JSON.stringify(s)
          return String(s)
        })
        .filter(Boolean)
    : []

  const highlight = hit.highlight || hit._highlight || src._highlight

  return {
    id: hit.id || src.id,
    title,
    companyName,
    company: typeof companyObj === 'object' ? companyObj : undefined,
    skills,
    description: src.description || src.descriptionShort || '',
    salary_range: src.salary_range || {},
    posted_at: src.posted_at || src.createdAt || src.postedAt,
    location: src.location_name || src.location || src.city,
    job_type: src.job_type || src.type || src.jobType,
    experience_level: src.experience_level || src.experience || src.experienceLevel,
    highlight,
    raw: hit
  }
}


