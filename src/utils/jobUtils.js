/**
 * Map backend job data to frontend format
 */
export function mapJobData(backendJob) {
  return {
    id: backendJob.id,
    title: backendJob.title,
    // Hỗ trợ cả companies (số nhiều) và company (số ít) để tương thích với cả hai format
    companyName: backendJob.companies?.name || backendJob.company?.name || 'Chưa có tên công ty',
    companyLogoUrl: backendJob.companies?.logo_url || backendJob.company?.logo_url || '',
    location: backendJob.locations?.name || backendJob.location?.name || backendJob.location_text || 'Bất kỳ',
    salaryMin: backendJob.salary_range?.min,
    salaryMax: backendJob.salary_range?.max,
    currency: backendJob.salary_range?.currency || 'VND',
    jobType: backendJob.job_type,
    experienceLevel: backendJob.experience_level,
    skills: backendJob.job_skills?.map(js => js.skills?.name).filter(Boolean) || [],
    createdAt: backendJob.posted_at || backendJob.created_at,
    descriptionShort: backendJob.description?.substring(0, 150) || '',
    description: backendJob.description,
    posted_at: backendJob.posted_at,
    salary_range: backendJob.salary_range
  }
}
