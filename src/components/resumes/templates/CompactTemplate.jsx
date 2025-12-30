export default function CompactTemplate({ data, title }) {
  const personalInfo = data?.personal_info || {}
  const skills = data?.skills || []
  const experiences = data?.experiences || []
  const educations = data?.educations || []
  const certifications = data?.certifications || []
  const awards = data?.awards || []
  const projects = data?.projects || []
  const languages = data?.languages || []
  const summary = data?.summary || ''
  const references = data?.references || []

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      month: 'short',
      year: 'numeric'
    })
  }

  const formatDateOfBirth = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateRange = (start, end, isCurrent) => {
    const startText = formatDate(start) || '—'
    const endText = isCurrent ? 'Hiện tại' : (formatDate(end) || '—')
    return `${startText} – ${endText}`
  }

  const getSkillName = (skill) => {
    if (typeof skill === 'string') return skill
    if (skill?.skills?.name) return skill.skills.name
    if (skill?.name) return skill.name
    return 'Kỹ năng'
  }

  const getInitials = (name) => {
    if (!name) return 'CV'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="cv-template cv-template--compact">
      <style>{`
        .cv-template--compact {
          max-width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          background: #ffffff;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          display: flex;
          overflow: hidden;
          font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #334155;
          line-height: 1.5;
        }
        .cv-template--compact .template-sidebar {
          width: 28%;
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          color: white;
          padding: 35px 25px;
          flex-shrink: 0;
          position: relative;
        }
        .cv-template--compact .template-sidebar::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 1px;
          height: 100%;
          background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.1), transparent);
        }
        .cv-template--compact .template-profile-photo {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
          margin: 0 auto 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          font-weight: 700;
          color: #1e293b;
          box-shadow: 0 3px 12px rgba(0, 0, 0, 0.2), inset 0 0 0 3px rgba(59, 130, 246, 0.3);
          border: 3px solid rgba(59, 130, 246, 0.5);
        overflow: hidden;
      }
      .cv-template--compact .template-profile-photo img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
        }
        .cv-template--compact .template-sidebar h1 {
          font-family: 'Poppins', 'Inter', sans-serif;
          font-size: 20px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 8px;
          line-height: 1.2;
          letter-spacing: -0.02em;
          color: #e5edff;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
        .cv-template--compact .template-sidebar-section {
          margin-top: 25px;
          padding-top: 20px;
          border-top: 1px solid transparent;
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05));
          background-size: 100% 1px;
          background-repeat: no-repeat;
          background-position: top;
        }
        .cv-template--compact .template-sidebar-section:first-of-type {
          margin-top: 20px;
          padding-top: 0;
          border-top: none;
          background-image: none;
        }
        .cv-template--compact .template-sidebar-section h3 {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          margin-bottom: 12px;
          opacity: 0.95;
          color: #cbd5e1;
        }
        .cv-template--compact .template-contact-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          line-height: 1.4;
          padding: 6px 11px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.2s ease;
        }
        .cv-template--compact .template-contact-item:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-1px);
          box-shadow: 0 2px 5px rgba(96, 165, 250, 0.3);
        }
        .cv-template--compact .template-contact-item svg,
        .cv-template--compact .template-contact-item i {
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 0;
          color: #ffffff;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border-radius: 50%;
          box-shadow: 0 2px 3px rgba(59, 130, 246, 0.4), 0 0 0 1.5px rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
          padding: 3px;
        }
        .cv-template--compact .template-contact-item svg {
          stroke: #ffffff;
        }
        .cv-template--compact .template-contact-item a {
          color: white;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }
        .cv-template--compact .template-contact-item a:hover {
          color: #60a5fa;
        }
        .cv-template--compact .template-contact-item span {
          color: white;
          font-weight: 500;
        }
        .cv-template--compact .template-skill-tag {
          display: inline-block;
          padding: 5px 10px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 6px;
          font-size: 11px;
          margin: 4px 4px 4px 0;
          border: 1px solid rgba(255, 255, 255, 0.25);
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .cv-template--compact .template-skill-tag:hover {
          background: rgba(255, 255, 255, 0.25);
        }
        .cv-template--compact .template-language-item {
          font-size: 11px;
          margin-bottom: 6px;
          padding-left: 8px;
          border-left: 3px solid rgba(96, 165, 250, 0.5);
          color: #e2e8f0;
        }
        .cv-template--compact .template-main-content {
          flex: 1;
          padding: 35px 40px;
          overflow: hidden;
          background: #ffffff;
        }
        .cv-template--compact .template-section {
          margin-bottom: 30px;
        }
        .cv-template--compact .template-section-title {
          font-family: 'Poppins', 'Inter', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 auto 18px;
          padding-bottom: 8px;
          border-bottom: 3px solid transparent;
          background: linear-gradient(to right, #3b82f6, #1e40af);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          letter-spacing: -0.02em;
        }
        .cv-template--compact .template-section-title::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 3px;
          background: linear-gradient(to right, #3b82f6, #1e40af);
          border-radius: 2px;
        }
        .cv-template--compact .template-section-title i {
          font-size: 17px;
          color: #3b82f6;
          -webkit-text-fill-color: #3b82f6;
        }
        .cv-template--compact .template-bio {
          font-size: 13px;
          color: #475569;
          margin-bottom: 28px;
          line-height: 1.6;
          text-align: justify;
          white-space: pre-line;
          padding: 18px;
          background: linear-gradient(135deg, #fafbfc 0%, #f1f5f9 100%);
          border-radius: 8px;
          border-left: 3px solid transparent;
          border-image: linear-gradient(to bottom, #3b82f6, #1e40af) 1;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        .cv-template--compact .template-item {
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e2e8f0;
        }
        .cv-template--compact .template-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .cv-template--compact .template-item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
          gap: 15px;
        }
        .cv-template--compact .template-item-title {
          font-size: 15px;
          font-weight: 600;
          color: #0f172a;
          line-height: 1.4;
          letter-spacing: -0.01em;
        }
        .cv-template--compact .template-item-subtitle {
          font-size: 13px;
          color: #334155;
          font-weight: 500;
          margin-top: 3px;
        }
        .cv-template--compact .template-item-date {
          font-size: 11px;
          color: #64748b;
          white-space: nowrap;
          background: #f1f5f9;
          padding: 3px 9px;
          border-radius: 6px;
          font-weight: 500;
        }
        .cv-template--compact .template-item-description {
          font-size: 12px;
          color: #475569;
          line-height: 1.6;
          margin-top: 8px;
        }
        .cv-template--compact .template-cert-item,
        .cv-template--compact .template-award-item {
          padding: 12px;
          background: #fafbfc;
          border-radius: 8px;
          margin-bottom: 12px;
          border-left: 3px solid transparent;
          border-image: linear-gradient(to bottom, #3b82f6, #1e40af) 1;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
        }
        .cv-template--compact .template-cert-item:hover,
        .cv-template--compact .template-award-item:hover {
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }
        .cv-template--compact .template-cert-name,
        .cv-template--compact .template-award-title {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 4px;
          letter-spacing: -0.01em;
        }
        .cv-template--compact .template-cert-issuer,
        .cv-template--compact .template-award-issuer {
          font-size: 12px;
          color: #334155;
          margin-bottom: 4px;
          font-weight: 500;
        }
        .cv-template--compact .template-cert-date,
        .cv-template--compact .template-award-date {
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
        }
        @media print {
          .cv-template--compact {
            box-shadow: none;
            max-width: 100%;
          }
          .cv-template--compact .template-sidebar::after {
            display: none;
          }
          .cv-template--compact .template-cert-item:hover,
          .cv-template--compact .template-award-item:hover {
            transform: none;
          }
          .cv-template--compact .template-section {
            page-break-inside: avoid;
          }
          .cv-template--compact .template-item {
            page-break-inside: avoid;
          }
        }
      `}</style>
      
      <div className="template-sidebar">
        <div className="template-profile-photo">
          {personalInfo.avatar_url ? (
            <img src={personalInfo.avatar_url} alt={personalInfo.full_name || 'Avatar'} />
          ) : (
            getInitials(personalInfo.full_name)
          )}
        </div>
        <h1>{personalInfo.full_name || 'Your Name'}</h1>
        {personalInfo.headline && (
          <p style={{ fontSize: '12px', opacity: 0.95, textAlign: 'center', marginTop: '5px', marginBottom: '18px', lineHeight: '1.4', fontStyle: 'italic', fontWeight: 300 }}>
            {personalInfo.headline}
          </p>
        )}

        {(personalInfo.email || personalInfo.phone || personalInfo.location || personalInfo.linkedin_url || personalInfo.website || personalInfo.date_of_birth) && (
          <div className="template-sidebar-section">
            <h3>Contact</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {personalInfo.email && (
                <div className="template-contact-item">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '11px', height: '11px' }}>
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <span style={{ opacity: 0.9 }}>Email: </span>
                  <a href={`mailto:${personalInfo.email}`}>{personalInfo.email}</a>
                </div>
              )}
              {personalInfo.phone && (
                <div className="template-contact-item">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '11px', height: '11px' }}>
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <span style={{ opacity: 0.9 }}>SĐT: </span>
                  <span>{personalInfo.phone}</span>
                </div>
              )}
              {personalInfo.location && (
                <div className="template-contact-item">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '11px', height: '11px' }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span style={{ opacity: 0.9 }}>Địa chỉ: </span>
                  <span>{personalInfo.location}</span>
                </div>
              )}
              {personalInfo.linkedin_url && (
                <div className="template-contact-item">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span style={{ opacity: 0.9 }}>LinkedIn: </span>
                  <a href={personalInfo.linkedin_url} target="_blank" rel="noopener noreferrer">
                    LinkedIn
                  </a>
                </div>
              )}
              {personalInfo.website && (
                <div className="template-contact-item">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '11px', height: '11px' }}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                  <span style={{ opacity: 0.9 }}>Website: </span>
                  <a href={personalInfo.website} target="_blank" rel="noopener noreferrer">
                    Website
                  </a>
                </div>
              )}
              {personalInfo.date_of_birth && (
                <div className="template-contact-item">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '11px', height: '11px' }}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span style={{ opacity: 0.9 }}>Ngày sinh: </span>
                  <span>{formatDateOfBirth(personalInfo.date_of_birth)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {skills.length > 0 && (
          <div className="template-sidebar-section">
            <h3>Skills</h3>
            <div>
              {skills.map((skill, idx) => (
                <span key={skill.id || skill.skill_id || idx} className="template-skill-tag">
                  {getSkillName(skill)}
                </span>
              ))}
            </div>
          </div>
        )}

        {languages.length > 0 && (
          <div className="template-sidebar-section">
            <h3>Languages</h3>
            {languages.map((lang, idx) => (
              <div key={idx} className="template-language-item">
                <div style={{ fontWeight: 700, color: '#e2e8f0' }}>
                  {lang.language || lang.name || 'Language'} {lang.proficiency && `(${lang.proficiency})`}
                </div>
                {(lang.certificate || lang.certificate_url) && (
                  <div style={{ marginTop: 3, fontSize: '10px', color: '#cbd5e1' }}>
                    {lang.certificate && <span>Chứng chỉ: {lang.certificate}</span>}
                    {lang.certificate_url && (
                      <a
                        href={lang.certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ marginLeft: 6, color: '#a5b4fc', textDecoration: 'none', fontWeight: 600 }}
                      >
                        Xem
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="template-main-content">
        {(summary || personalInfo.bio) && (
          <div className="template-bio">{summary || personalInfo.bio}</div>
        )}

        {experiences.length > 0 && (
          <div className="template-section">
            <h2 className="template-section-title">
              <i className="fas fa-briefcase"></i>
              Kinh nghiệm làm việc
            </h2>
            {experiences.map((exp, idx) => (
              <div key={exp.id || idx} className="template-item">
                <div className="template-item-header">
                  <div>
                    <div className="template-item-title">{exp.job_title || exp.position || 'Position'}</div>
                    <div className="template-item-subtitle">{exp.company_name || 'Company'}</div>
                  </div>
                  <div className="template-item-date">
                    {formatDateRange(exp.start_date, exp.end_date, exp.is_current)}
                  </div>
                </div>
                {exp.description && (
                  <div className="template-item-description">{exp.description}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {educations.length > 0 && (
          <div className="template-section">
            <h2 className="template-section-title">
              <i className="fas fa-graduation-cap"></i>
              Học vấn
            </h2>
            {educations.map((edu, idx) => (
              <div key={edu.id || idx} className="template-item">
                <div className="template-item-header">
                  <div>
                    <div className="template-item-title">
                      {edu.degree || 'Degree'}{edu.field_of_study ? ` - ${edu.field_of_study}` : ''}
                    </div>
                    <div className="template-item-subtitle">{edu.institution_name || edu.school_name || 'Institution'}</div>
                  </div>
                  <div className="template-item-date">
                    {formatDateRange(edu.start_date, edu.end_date, false)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {projects.length > 0 && (
          <div className="template-section">
            <h2 className="template-section-title">
              <i className="fas fa-project-diagram"></i>
              Dự án
            </h2>
            {projects.map((project, idx) => (
              <div key={idx} className="template-item">
                <div className="template-item-header">
                  <div>
                    <div className="template-item-title">{project.name || project.title || 'Project'}</div>
                    {project.role && (
                      <div className="template-item-subtitle" style={{ color: '#475569' }}>
                        Vai trò: {project.role}
                      </div>
                    )}
                    {project.client && (
                      <div className="template-item-subtitle" style={{ color: '#475569' }}>
                        Khách hàng/Đơn vị: {project.client}
                      </div>
                    )}
                    {project.url && (
                      <div className="template-item-subtitle">
                        <a href={project.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>{project.url}</a>
                      </div>
                    )}
                    {Array.isArray(project.links) && project.links.length > 0 && (
                      <div className="template-item-subtitle" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                        {project.links.map((link, linkIdx) => (
                          <a
                            key={linkIdx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
                          >
                            {link.label || link.url}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  {(project.start_date || project.end_date || project.is_current) && (
                    <div className="template-item-date">
                      {formatDateRange(project.start_date, project.end_date, project.is_current)}
                    </div>
                  )}
                </div>
                {project.description && (
                  <div className="template-item-description" style={{ whiteSpace: 'pre-line' }}>
                    {project.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {certifications.length > 0 && (
          <div className="template-section">
            <h2 className="template-section-title">
              <i className="fas fa-certificate"></i>
              Chứng chỉ
            </h2>
            {certifications.map((cert, idx) => (
              <div key={cert.id || idx} className="template-cert-item">
                <div className="template-cert-name">{cert.name || 'Certification'}</div>
                <div className="template-cert-issuer">{cert.issuing_organization || cert.issuing_org || 'Issuer'}</div>
                <div className="template-cert-date">
                  {formatDate(cert.issue_date)}
                  {cert.expiration_date && ` - ${formatDate(cert.expiration_date)}`}
                </div>
              </div>
            ))}
          </div>
        )}

        {awards.length > 0 && (
          <div className="template-section">
            <h2 className="template-section-title">
              <i className="fas fa-trophy"></i>
              Giải thưởng
            </h2>
            {awards.map((award, idx) => (
              <div key={award.id || idx} className="template-award-item">
                <div className="template-award-title">{award.title || 'Award'}</div>
                <div className="template-award-issuer">{award.issuer || 'Issuer'}</div>
                <div className="template-award-date">{formatDate(award.date)}</div>
                {award.description && (
                  <div className="template-item-description" style={{ marginTop: '6px' }}>{award.description}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {references.length > 0 && (
          <div className="template-section">
            <h2 className="template-section-title">
              <i className="fas fa-user-friends"></i>
              Người tham khảo
            </h2>
            {references.map((ref, idx) => (
              <div key={idx} className="template-item">
                <div className="template-item-title">{ref.name || 'Reference'}</div>
                <div className="template-item-subtitle">{ref.position || ref.title || ''} {ref.company ? `at ${ref.company}` : ''}</div>
                {ref.email && (
                  <div className="template-item-date">{ref.email}</div>
                )}
                {ref.phone && (
                  <div className="template-item-date">{ref.phone}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

