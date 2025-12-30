import { useState, forwardRef } from 'react'
import ProfessionalTemplate from './templates/ProfessionalTemplate'
import TimelineTemplate from './templates/TimelineTemplate'
import CompactTemplate from './templates/CompactTemplate'

function CVPreviewComponent({ profileData, title, theme = 'professional', onClose, hideHeader = false, additionalData = {} }, ref) {
  const [fullscreen, setFullscreen] = useState(false)

  if (!profileData) {
    return (
      <div className="cv-preview cv-preview--empty">
        <p className="muted">Không có dữ liệu để preview</p>
      </div>
    )
  }

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
  const renderTemplate = () => {
    try {
      const validTheme = theme || 'professional'
      switch (validTheme) {
        case 'timeline':
          if (TimelineTemplate) {
            return <TimelineTemplate data={templateData} title={title} />
          }
          break
        case 'compact':
          if (CompactTemplate) {
            return <CompactTemplate data={templateData} title={title} />
          }
          break
        case 'professional':
        default:
          if (ProfessionalTemplate) {
            return <ProfessionalTemplate data={templateData} title={title} />
          }
          break
      }
      // Fallback to ProfessionalTemplate
      return <ProfessionalTemplate data={templateData} title={title} />
    } catch (error) {
      console.error('Error rendering template:', error)
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ color: '#ef4444' }}>Lỗi khi render template. Vui lòng thử lại.</p>
        </div>
      )
    }
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
            {renderTemplate()}
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
