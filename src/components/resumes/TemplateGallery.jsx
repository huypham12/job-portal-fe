import { useEffect, useState } from 'react'
import { ResumeApi } from '../../services/resumeApi'

export default function TemplateGallery({ selectedTheme, onSelectTheme, loading: externalLoading, showPreview = false }) {
  const [themes, setThemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hoveredTheme, setHoveredTheme] = useState(null)

  useEffect(() => {
    loadThemes()
  }, [])

  const loadThemes = async () => {
    setLoading(true)
    setError('')
    
    // Hardcode 3 templates mới trong frontend, không phụ thuộc vào API
    const frontendThemes = [
      {
        id: 'professional',
        name: 'Professional',
        description: 'Layout 2 cột đều nhau, header trên cùng, phù hợp cho corporate',
        layout: 'header-top',
        category: 'professional',
        colors: { primary: '#1e293b', secondary: '#334155' }
      },
      {
        id: 'timeline',
        name: 'Timeline',
        description: 'Layout timeline dọc với sidebar nhỏ, phù hợp cho developer/engineer',
        layout: 'sidebar',
        category: 'modern',
        colors: { primary: '#1e293b', secondary: '#334155' }
      },
      {
        id: 'compact',
        name: 'Compact',
        description: 'Layout sidebar nhỏ với spacing compact, phù hợp cho entry-level',
        layout: 'sidebar',
        category: 'modern',
        colors: { primary: '#1e293b', secondary: '#334155' }
      }
    ]
    
    // Luôn sử dụng themes từ frontend
    setThemes(frontendThemes)
      setLoading(false)
  }

  if (loading || externalLoading) {
    return (
      <div className="template-gallery">
        <div className="template-gallery__loading">
          <div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto 12px' }} />
          Đang tải template...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="template-gallery">
        <div className="error-banner">{error}</div>
      </div>
    )
  }

  const selectedThemeData = themes.find((t) => t.id === selectedTheme)

  return (
    <div className="template-gallery">
      {showPreview && selectedThemeData && (
        <div className="template-gallery__selected-preview">
          <div className="template-gallery__selected-badge">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13.5 4L6 11.5L2.5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Đã chọn
          </div>
          <h4 className="template-gallery__preview-title">{selectedThemeData.name}</h4>
          {selectedThemeData.description && (
            <p className="template-gallery__preview-description muted small">{selectedThemeData.description}</p>
          )}
        </div>
      )}
      <div className="template-gallery__grid">
        {themes.map((theme) => {
          const isSelected = selectedTheme === theme.id
          const colors = theme.colors || {}
          const layout = theme.layout || 'sidebar'
          
          // Render preview based on template id or layout
          const renderPreview = () => {
            const primaryColor = colors.primary || '#1e293b'
            const secondaryColor = colors.secondary || '#334155'
            
            if (theme.id === 'professional' || (layout === 'header-top' && theme.id !== 'timeline' && theme.id !== 'compact')) {
              // Professional template: header on top + 2 columns
              return (
                <div className="template-card__preview" style={{ background: primaryColor }}>
                  <div className="template-card__preview-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ background: primaryColor, padding: '10px', borderRadius: '4px 4px 0 0', minHeight: '35px' }}>
                      <div style={{ width: '60%', height: '7px', background: 'rgba(255,255,255,0.9)', borderRadius: '3px', margin: '0 auto 5px' }}></div>
                      <div style={{ width: '40%', height: '5px', background: 'rgba(255,255,255,0.7)', borderRadius: '3px', margin: '0 auto' }}></div>
                    </div>
                    <div style={{ flex: 1, padding: '6px', background: 'white', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                      <div>
                        <div style={{ width: '90%', height: '3px', background: '#e2e8f0', borderRadius: '2px', marginBottom: '4px' }}></div>
                        <div style={{ width: '70%', height: '3px', background: '#e2e8f0', borderRadius: '2px', marginBottom: '4px' }}></div>
                        <div style={{ width: '80%', height: '3px', background: '#e2e8f0', borderRadius: '2px' }}></div>
                      </div>
                      <div>
                        <div style={{ width: '100%', height: '3px', background: '#e2e8f0', borderRadius: '2px', marginBottom: '4px' }}></div>
                        <div style={{ width: '85%', height: '3px', background: '#e2e8f0', borderRadius: '2px', marginBottom: '4px' }}></div>
                        <div style={{ width: '90%', height: '3px', background: '#e2e8f0', borderRadius: '2px' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            } else if (theme.id === 'timeline') {
              // Timeline template: sidebar + timeline
              return (
                <div className="template-card__preview" style={{ background: primaryColor }}>
                  <div className="template-card__preview-content" style={{ display: 'flex', height: '100%' }}>
                    <div className="template-card__preview-sidebar" style={{ width: '30%', padding: '6px', background: primaryColor }}>
                      <div className="template-card__preview-avatar" style={{ width: '35px', height: '35px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', margin: '0 auto 6px' }}></div>
                      <div className="template-card__preview-name" style={{ width: '80%', height: '5px', background: 'rgba(255,255,255,0.5)', borderRadius: '3px', margin: '0 auto 3px' }}></div>
                      <div style={{ width: '60%', height: '3px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', margin: '0 auto' }}></div>
                    </div>
                    <div className="template-card__preview-main" style={{ flex: 1, padding: '6px', background: 'white', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '8px', top: '0', bottom: '0', width: '2px', background: primaryColor }}></div>
                      <div style={{ paddingLeft: '20px' }}>
                      <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '2px', marginBottom: '6px' }}></div>
                      <div style={{ width: '80%', height: '4px', background: '#e2e8f0', borderRadius: '2px', marginBottom: '6px' }}></div>
                      <div style={{ width: '90%', height: '4px', background: '#e2e8f0', borderRadius: '2px' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            } else if (theme.id === 'compact') {
              // Compact template: small sidebar
              return (
                <div className="template-card__preview" style={{ background: primaryColor }}>
                  <div className="template-card__preview-content" style={{ display: 'flex', height: '100%' }}>
                    <div className="template-card__preview-sidebar" style={{ width: '25%', padding: '6px', background: primaryColor }}>
                      <div className="template-card__preview-avatar" style={{ width: '30px', height: '30px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', margin: '0 auto 5px' }}></div>
                      <div className="template-card__preview-name" style={{ width: '70%', height: '4px', background: 'rgba(255,255,255,0.5)', borderRadius: '2px', margin: '0 auto 3px' }}></div>
                      <div style={{ width: '50%', height: '2px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', margin: '0 auto' }}></div>
                    </div>
                    <div className="template-card__preview-main" style={{ flex: 1, padding: '6px', background: 'white' }}>
                      <div className="template-card__preview-line" style={{ width: '100%', height: '3px', background: '#e2e8f0', borderRadius: '2px', marginBottom: '4px' }}></div>
                      <div className="template-card__preview-line short" style={{ width: '75%', height: '3px', background: '#e2e8f0', borderRadius: '2px', marginBottom: '4px' }}></div>
                      <div className="template-card__preview-line" style={{ width: '90%', height: '3px', background: '#e2e8f0', borderRadius: '2px' }}></div>
                  </div>
                  </div>
                </div>
              )
            } else {
              // Default: sidebar layout
              return (
                <div className="template-card__preview" style={{ background: primaryColor }}>
                  <div className="template-card__preview-content" style={{ display: 'flex', height: '100%' }}>
                    <div className="template-card__preview-sidebar" style={{ width: '35%', padding: '8px' }}>
                      <div className="template-card__preview-avatar" style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', margin: '0 auto 8px' }}></div>
                      <div className="template-card__preview-name" style={{ width: '80%', height: '6px', background: 'rgba(255,255,255,0.5)', borderRadius: '3px', margin: '0 auto 4px' }}></div>
                      <div style={{ width: '60%', height: '3px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', margin: '0 auto' }}></div>
                    </div>
                    <div className="template-card__preview-main" style={{ flex: 1, padding: '8px', background: 'white' }}>
                      <div className="template-card__preview-line" style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '2px', marginBottom: '6px' }}></div>
                      <div className="template-card__preview-line short" style={{ width: '80%', height: '4px', background: '#e2e8f0', borderRadius: '2px', marginBottom: '6px' }}></div>
                      <div className="template-card__preview-line" style={{ width: '90%', height: '4px', background: '#e2e8f0', borderRadius: '2px' }}></div>
                    </div>
                  </div>
                </div>
              )
            }
          }
          
          return (
            <div
              key={theme.id}
              className={`template-card-wrapper ${isSelected ? 'template-card-wrapper--selected' : ''}`}
              onMouseEnter={() => setHoveredTheme(theme.id)}
              onMouseLeave={() => setHoveredTheme(null)}
            >
            <button
              type="button"
                className={`template-card ${isSelected ? 'template-card--selected' : ''} ${hoveredTheme === theme.id ? 'template-card--hovered' : ''}`}
              onClick={() => onSelectTheme(theme.id)}
            >
              {renderPreview()}
              <div className="template-card__info">
                <div className="template-card__name">{theme.name || theme.id}</div>
                  {theme.description && (
                    <div className="template-card__description muted small">{theme.description}</div>
                  )}
              </div>
              {isSelected && (
                <div className="template-card__badge">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13.5 4L6 11.5L2.5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </button>
              {hoveredTheme === theme.id && theme.description && (
                <div className="template-card__tooltip">
                  {theme.description}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

