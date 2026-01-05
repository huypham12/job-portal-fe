import { useState, forwardRef, useEffect } from 'react'
import { ResumeApi } from '../../services/resumeApi'
import ProfessionalTemplate from './templates/ProfessionalTemplate'
import TimelineTemplate from './templates/TimelineTemplate'
import CompactTemplate from './templates/CompactTemplate'

function CVPreviewComponent({ resumeId, profileData, title, theme = 'modern', onClose, hideHeader = false, additionalData = {} }, ref) {
  const [fullscreen, setFullscreen] = useState(false)
  const [htmlContent, setHtmlContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Use backend preview if resumeId is available, otherwise use client-side rendering
  const useBackendPreview = !!resumeId

  useEffect(() => {
    if (useBackendPreview) {
      loadPreview()
    }
  }, [resumeId, theme])

  const loadPreview = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await ResumeApi.previewResume(resumeId)

      // The API returns HTML string directly
      setHtmlContent(response)
    } catch (err) {
      console.error('Error loading preview:', err)
      setError('Không thể tải preview. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  // Client-side rendering logic (for create mode)
  const renderClientSideTemplate = () => {
    if (!profileData) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p className="muted">Không có dữ liệu để preview</p>
        </div>
      )
    }

    try {
      // Map profile data to template format
      const sections = profileData.sections || {}
      const personalInfo = {
        ...(sections.personal_info?.data || {}),
        avatar_url: (sections.personal_info?.data || {}).avatar_url || profileData.avatar_url
      }
      const skills = sections.skills?.items || []
      const experiences = sections.experiences?.items || []
      const educations = sections.educations?.items || []
      const certifications = sections.certifications?.items || []
      const awards = sections.awards?.items || []

      // Get additional data (projects, languages, summary, references)
      const projects = additionalData.projects || []
      const languages = additionalData.languages || []

      // summary có thể là string hoặc object { content, enabled }
      const rawSummary = additionalData.summary
      const summary =
        typeof rawSummary === 'string'
          ? rawSummary
          : typeof rawSummary === 'object' && rawSummary !== null
          ? rawSummary.content || ''
          : ''

      const references = additionalData.references || []

      // Prepare data for template
      const templateData = {
        personal_info: personalInfo,
        skills,
        experiences,
        educations,
        certifications,
        awards,
        projects,
        languages,
        summary,
        references
      }

      // Select template component based on theme
      const validTheme = theme || 'modern'

      // Map backend theme IDs to frontend template components
      // Note: We may need to create specific components for classic and creative layouts
      switch (validTheme) {
        case 'classic':
          // Classic uses header-top layout, fallback to ProfessionalTemplate for now
          return <ProfessionalTemplate data={templateData} title={title} />
        case 'creative':
          // Creative uses two-column layout, fallback to ProfessionalTemplate for now
          return <ProfessionalTemplate data={templateData} title={title} />
        case 'modern':
        default:
          return <ProfessionalTemplate data={templateData} title={title} />
      }
    } catch (error) {
      console.error('Error rendering template:', error)
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ color: '#ef4444' }}>Lỗi khi render template. Vui lòng thử lại.</p>
        </div>
      )
    }
  }

  if (useBackendPreview && loading) {
    return (
      <div className="cv-preview cv-preview--loading">
        <div className="cv-preview__header">
          <h3 className="cv-preview__title">Xem trước CV</h3>
        </div>
        <div className="cv-preview__content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <div className="spinner">Đang tải preview...</div>
        </div>
      </div>
    )
  }

  if (useBackendPreview && error) {
    return (
      <div className="cv-preview cv-preview--error">
        <div className="cv-preview__header">
          <h3 className="cv-preview__title">Xem trước CV</h3>
        </div>
        <div className="cv-preview__content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <p style={{ color: '#ef4444', textAlign: 'center' }}>{error}</p>
        </div>
      </div>
    )
  }

  if (useBackendPreview && !htmlContent) {
    return (
      <div className="cv-preview cv-preview--empty">
        <div className="cv-preview__header">
          <h3 className="cv-preview__title">Xem trước CV</h3>
        </div>
        <div className="cv-preview__content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <p className="muted">Không có dữ liệu để preview</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={`cv-preview ${fullscreen ? 'cv-preview--fullscreen' : ''}`}>
        {!hideHeader && (
          <div className="cv-preview__header">
            <h3 className="cv-preview__title">Xem trước CV</h3>
            <div className="cv-preview__actions">
              <button
                type="button"
                className="btn btn--icon"
                onClick={() => setFullscreen(!fullscreen)}
                title={fullscreen ? 'Thoát fullscreen' : 'Fullscreen'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {fullscreen ? (
                    <>
                      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                    </>
                  ) : (
                    <>
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    </>
                  )}
                </svg>
              </button>
              {onClose && (
                <button
                  type="button"
                  className="btn btn--icon"
                  onClick={onClose}
                  title="Đóng"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="cv-preview__content">
          <div className="cv-preview__document" ref={ref}>
            {useBackendPreview ? (
              <div
                className="cv-preview__html-container"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            ) : (
              renderClientSideTemplate()
            )}
          </div>
        </div>

        <div className="cv-preview__footer">
          <p className="cv-preview__footer-note muted small">
            Đây là preview. CV thực tế sẽ có định dạng và styling theo template đã chọn.
          </p>
        </div>
      </div>
      {fullscreen && (
        <div className="cv-preview__overlay" onClick={() => setFullscreen(false)} />
      )}
    </>
  )
}

const CVPreview = forwardRef(CVPreviewComponent)

CVPreview.displayName = 'CVPreview'

export default CVPreview
