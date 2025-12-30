import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { JobService } from '../lib/api.js'
import './JobDetailsPage.css'

const EXPERIENCE_LABELS = {
  any: 'Any',
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior'
}

const JOB_TYPE_LABELS = {
  full_time: 'Full time',
  part_time: 'Part time',
  intern: 'Intern',
  freelance: 'Freelance'
}

const formatSalary = (range) => {
  if (!range) return 'Negotiable'
  const { min, max, currency = 'USD', period = 'month' } = range
  const formatter = new Intl.NumberFormat('en-US')
  const suffix = period ? ` / ${period}` : ''
  if (min != null && max != null) return `${formatter.format(min)} - ${formatter.format(max)} ${currency}${suffix}`
  if (min != null) return `${formatter.format(min)} ${currency}${suffix}`
  if (max != null) return `${formatter.format(max)} ${currency}${suffix}`
  return 'Negotiable'
}

const formatDate = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const statusLabel = (status) => {
  const map = { open: 'Open', closed: 'Closed', draft: 'Draft', paused: 'Paused' }
  return map[status?.toLowerCase()] || (status ? status : 'Open')
}

const statusClass = (status) => {
  const normalized = status?.toLowerCase()
  if (normalized === 'open') return 'status-open'
  if (normalized === 'closed') return 'status-closed'
  if (normalized === 'paused') return 'status-paused'
  return 'status-default'
}

export default function JobDetailsPage() {
  const { id } = useParams()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const fetchJob = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await JobService.detail(id)
      setJob(data?.data || data)
    } catch (err) {
      setError(err?.message || 'Failed to load job')
      setJob(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchJob()
  }, [fetchJob])

  const isOpen = (job?.status || '').toLowerCase() === 'open'
  const mustHave = useMemo(() => (job?.requirements || []).filter((req) => req?.isRequired), [job])
  const niceToHave = useMemo(() => (job?.requirements || []).filter((req) => !req?.isRequired), [job])
  const salaryText = formatSalary(job?.salaryRange)
  const skills = job?.skills || []
  const tags = job?.tags || []

  const experienceLabel = EXPERIENCE_LABELS[job?.experienceLevel] || job?.experienceLevel || 'Any'
  const jobTypeLabel = JOB_TYPE_LABELS[job?.jobType] || job?.jobType || 'Job'

  const handleShare = async () => {
    const shareData = {
      title: job?.title || 'Job',
      text: job?.company?.name ? `${job.title} at ${job.company.name}` : job?.title,
      url: window.location.href
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url)
        alert('Link copied to clipboard')
      }
    } catch (_) {
      /* ignore */
    }
  }

  const handleApply = () => {
    if (!isOpen) return
    alert('Apply flow not wired yet.')
  }

  if (loading) {
    return (
      <div className="job-details-page">
        <div className="container">
          <div className="state-card">Loading job details...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="job-details-page">
        <div className="container">
          <div className="state-card error">
            <p>{error}</p>
            <button className="btn primary" onClick={fetchJob}>
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!job) return null

  return (
    <div className="job-details-page">
      <div className="container">
        <header className="job-header section-card">
          <div className="job-header__left">
            <div className="job-logo">
              {job?.company?.logoUrl ? (
                <img src={job.company.logoUrl} alt={job.company.name || 'Company logo'} />
              ) : (
                <span>{(job?.company?.name || 'C')?.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h1>{job.title}</h1>
              <p className="muted">
                {job?.company?.name || 'Unknown company'} · {job?.location?.name || 'Anywhere'}
              </p>
              <div className="meta-row">
                <span className="badge">{jobTypeLabel}</span>
                <span className="badge secondary">{experienceLabel}</span>
                <span className="badge ghost">{salaryText}</span>
                {job.postedAt && <span className="muted">Posted {formatDate(job.postedAt)}</span>}
              </div>
            </div>
          </div>
          <div className={`status-badge ${statusClass(job.status)}`}>{statusLabel(job.status)}</div>
        </header>

        <div className="action-bar section-card">
          <div className="action-buttons">
            <button className="btn primary" onClick={handleApply} disabled={!isOpen}>
              Apply now
            </button>
            <button className="btn ghost" onClick={() => setSaved((s) => !s)}>
              {saved ? 'Saved' : 'Save job'}
            </button>
            <button className="btn ghost" onClick={handleShare}>
              Share
            </button>
          </div>
          <div className="muted stats-text">
            {(job?.stats?.views ?? 0).toLocaleString()} views · {(job?.stats?.applicants ?? 0).toLocaleString()} applicants
          </div>
        </div>

        <div className="details-grid">
          <main className="details-main">
            <section className="section-card">
              <div className="section-head">
                <h3>Job description</h3>
              </div>
              <p className="description-text">{job.description || 'No description provided.'}</p>
            </section>

            <section className="section-card">
              <div className="section-head">
                <h3>Requirements</h3>
              </div>
              <div className="requirements-grid">
                <div>
                  <h4>Must have</h4>
                  {mustHave.length ? (
                    <ul className="bullet-list">
                      {mustHave.map((item, idx) => (
                        <li key={`must-${idx}`}>
                          <div className="req-title">{item.title}</div>
                          {item.description && <p className="muted">{item.description}</p>}
                          {item.yearsExperience ? (
                            <span className="pill-chip">{item.yearsExperience}+ yrs</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">No required items listed.</p>
                  )}
                </div>
                <div>
                  <h4>Nice to have</h4>
                  {niceToHave.length ? (
                    <ul className="bullet-list">
                      {niceToHave.map((item, idx) => (
                        <li key={`nice-${idx}`}>
                          <div className="req-title">{item.title}</div>
                          {item.description && <p className="muted">{item.description}</p>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">No optional items listed.</p>
                  )}
                </div>
              </div>
            </section>

            <section className="section-card">
              <div className="section-head">
                <h3>Skills & tags</h3>
              </div>
              <div className="chips-row">
                {[...skills, ...tags].map((item) => (
                  <span key={item} className="chip">
                    {item}
                  </span>
                ))}
                {!skills.length && !tags.length && <p className="muted">No skills listed.</p>}
              </div>
            </section>

            <section className="section-card">
              <div className="section-head">
                <h3>Benefits</h3>
              </div>
              {job?.benefits?.length ? (
                <ul className="benefits-list">
                  {job.benefits.map((benefit, idx) => (
                    <li key={`benefit-${idx}`}>
                      <div>
                        <div className="benefit-title">{benefit.title}</div>
                        {benefit.description && <p className="muted">{benefit.description}</p>}
                      </div>
                      {benefit.valueAmount != null && (
                        <span className="pill-chip">
                          {benefit.valueAmount} {benefit.valueCurrency || ''}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No benefits provided.</p>
              )}
            </section>

            <section className="section-card">
              <div className="section-head">
                <h3>Work arrangement</h3>
              </div>
              <div className="work-grid">
                <div className="work-item">
                  <span className="muted">Remote</span>
                  <strong>
                    {job?.workArrangement?.isRemoteAllowed ? 'Allowed' : 'On-site'}
                    {job?.workArrangement?.remotePercentage != null
                      ? ` · ${job.workArrangement.remotePercentage}%`
                      : ''}
                  </strong>
                </div>
                <div className="work-item">
                  <span className="muted">Flexible hours</span>
                  <strong>{job?.workArrangement?.flexibleHours ? 'Yes' : 'No'}</strong>
                </div>
                <div className="work-item">
                  <span className="muted">Overtime expected</span>
                  <strong>{job?.workArrangement?.overtimeExpected ? 'Yes' : 'No'}</strong>
                </div>
                <div className="work-item">
                  <span className="muted">Travel</span>
                  <strong>{job?.workArrangement?.travelRequirement || 'Not specified'}</strong>
                </div>
                <div className="work-item">
                  <span className="muted">Shift</span>
                  <strong>{job?.workArrangement?.shiftType || 'Not specified'}</strong>
                </div>
              </div>
            </section>
          </main>

          <aside className="details-sidebar">
            <section className="section-card">
              <div className="section-head">
                <h3>Quick info</h3>
              </div>
              <div className="quick-info">
                <div>
                  <span className="muted">Salary</span>
                  <strong>{salaryText}</strong>
                </div>
                <div>
                  <span className="muted">Job type</span>
                  <strong>{jobTypeLabel}</strong>
                </div>
                <div>
                  <span className="muted">Experience</span>
                  <strong>{experienceLabel}</strong>
                </div>
                <div>
                  <span className="muted">Location</span>
                  <strong>{job?.location?.name || 'Anywhere'}</strong>
                </div>
                <div>
                  <span className="muted">Posted</span>
                  <strong>{formatDate(job?.postedAt) || 'N/A'}</strong>
                </div>
                <div>
                  <span className="muted">Expires</span>
                  <strong>{formatDate(job?.expiresAt) || 'N/A'}</strong>
                </div>
              </div>
              <div className="sidebar-actions">
                <button className="btn primary" disabled={!isOpen} onClick={handleApply}>
                  Apply now
                </button>
                <button className="btn ghost" onClick={handleShare}>
                  Share
                </button>
              </div>
            </section>

            <section className="section-card company-card">
              <div className="section-head">
                <h3>Company</h3>
              </div>
              <div className="company-header">
                <div className="company-logo">
                  {job?.company?.logoUrl ? (
                    <img src={job.company.logoUrl} alt={job.company.name || 'Company logo'} />
                  ) : (
                    <span>{(job?.company?.name || 'C')?.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <strong>{job?.company?.name || 'Unknown company'}</strong>
                  {job?.company?.size && <p className="muted">Size: {job.company.size}</p>}
                </div>
              </div>
              {job?.company?.description && <p className="muted">{job.company.description}</p>}

              <div className="company-info">
                {job?.company?.contactEmail && (
                  <div>
                    <span className="muted">Email</span>
                    <strong>{job.company.contactEmail}</strong>
                  </div>
                )}
                {job?.company?.contactPhone && (
                  <div>
                    <span className="muted">Phone</span>
                    <strong>{job.company.contactPhone}</strong>
                  </div>
                )}
                {job?.company?.contactAddress && (
                  <div>
                    <span className="muted">Address</span>
                    <strong>{job.company.contactAddress}</strong>
                  </div>
                )}
              </div>

              {(job?.company?.linkedinUrl ||
                job?.company?.facebookUrl ||
                job?.company?.twitterUrl) && (
                <div className="social-links">
                  {job.company.linkedinUrl && (
                    <a href={job.company.linkedinUrl} target="_blank" rel="noreferrer">
                      LinkedIn
                    </a>
                  )}
                  {job.company.facebookUrl && (
                    <a href={job.company.facebookUrl} target="_blank" rel="noreferrer">
                      Facebook
                    </a>
                  )}
                  {job.company.twitterUrl && (
                    <a href={job.company.twitterUrl} target="_blank" rel="noreferrer">
                      Twitter
                    </a>
                  )}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
