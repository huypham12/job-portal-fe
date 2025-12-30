export default function ProfessionalTemplate({ data, title }) {
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

  return (
    <div className="cv-template cv-template--professional">
      <style>{`
        .cv-template--professional {
          max-width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          background: white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #2d3748;
        }
        .cv-template--professional .template-header {
          background: #1e293b;
          color: white;
          padding: 50px 45px;
          text-align: center;
        }
        .cv-template--professional .template-header h1 {
          font-family: 'Poppins', sans-serif;
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 12px;
          line-height: 1.2;
        }
        .cv-template--professional .template-header-contact {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          font-size: 13px;
          margin-top: 20px;
        }
        .cv-template--professional .template-header-contact-item {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.2s ease;
        }
        .cv-template--professional .template-header-contact-item:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(96, 165, 250, 0.3);
        }
        .cv-template--professional .template-header-contact-item svg,
        .cv-template--professional .template-header-contact-item i {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
          padding: 4px;
        }
        .cv-template--professional .template-header-contact-item svg {
          stroke: #ffffff;
        }
        .cv-template--professional .template-header-contact-item a {
          color: white;
          text-decoration: none;
          font-weight: 500;
        }
        .cv-template--professional .template-header-contact-item span {
          color: white;
          font-weight: 500;
        }
        .cv-template--professional .template-content {
          padding: 40px 45px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }
        .cv-template--professional .template-section {
          margin-bottom: 35px;
        }
        .cv-template--professional .template-section-title {
          font-family: 'Poppins', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 auto 20px;
          padding-bottom: 8px;
          border-bottom: 3px solid #1e293b;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .cv-template--professional .template-section-title i {
          font-size: 20px;
        }
        .cv-template--professional .template-item {
          margin-bottom: 20px;
        }
        .cv-template--professional .template-item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
          gap: 15px;
        }
        .cv-template--professional .template-item-title {
          font-size: 15px;
          font-weight: 600;
          color: #1a202c;
          line-height: 1.3;
        }
        .cv-template--professional .template-item-subtitle {
          font-size: 14px;
          color: #1e293b;
          font-weight: 500;
          margin-top: 4px;
        }
        .cv-template--professional .template-item-date {
          font-size: 12px;
          color: #718096;
          white-space: nowrap;
        }
        .cv-template--professional .template-item-description {
          font-size: 13px;
          color: #4a5568;
          line-height: 1.6;
          margin-top: 8px;
        }
        .cv-template--professional .template-skill-tag {
          display: inline-block;
          padding: 6px 12px;
          background: #f1f5f9;
          color: #1e293b;
          border-radius: 6px;
          font-size: 13px;
          margin: 4px 4px 4px 0;
          border: 1px solid #e2e8f0;
        }
        .cv-template--professional .template-language-item {
          padding: 8px 12px;
          background: #f7fafc;
          border-radius: 6px;
          margin-bottom: 8px;
          font-size: 13px;
          border-left: 3px solid #1e293b;
        }
        .cv-template--professional .template-cert-item,
        .cv-template--professional .template-award-item {
          padding: 12px;
          background: #f7fafc;
          border-radius: 8px;
          margin-bottom: 12px;
          border-left: 3px solid #1e293b;
        }
        .cv-template--professional .template-cert-name,
        .cv-template--professional .template-award-title {
          font-size: 14px;
          font-weight: 600;
          color: #1a202c;
          margin-bottom: 4px;
        }
        .cv-template--professional .template-cert-issuer,
        .cv-template--professional .template-award-issuer {
          font-size: 13px;
          color: #1e293b;
          margin-bottom: 4px;
        }
        .cv-template--professional .template-cert-date,
        .cv-template--professional .template-award-date {
          font-size: 12px;
          color: #718096;
        }
        .cv-template--professional .template-avatar {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 42px;
          font-weight: 700;
          color: #1e293b;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18), inset 0 0 0 4px rgba(59, 130, 246, 0.25);
          border: 3px solid rgba(59, 130, 246, 0.45);
          overflow: hidden;
        }
        .cv-template--professional .template-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }
      `}</style>
      
      <div className="template-header">
        <div className="template-avatar">
          {personalInfo.avatar_url ? (
            <img src={personalInfo.avatar_url} alt={personalInfo.full_name || 'Avatar'} />
          ) : (
            (personalInfo.full_name || 'CV')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .substring(0, 2)
          )}
        </div>
        <h1>{personalInfo.full_name || 'Your Name'}</h1>
        {personalInfo.headline && (
          <p style={{ fontSize: '16px', opacity: 0.9, marginTop: '8px', marginBottom: '16px' }}>
            {personalInfo.headline}
          </p>
        )}
        {(personalInfo.email || personalInfo.phone || personalInfo.location || personalInfo.linkedin_url || personalInfo.website || personalInfo.date_of_birth) && (
          <div className="template-header-contact">
            {personalInfo.email && (
              <div className="template-header-contact-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <span style={{ opacity: 0.9 }}>Email: </span>
                <a href={`mailto:${personalInfo.email}`}>{personalInfo.email}</a>
              </div>
            )}
            {personalInfo.phone && (
              <div className="template-header-contact-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span style={{ opacity: 0.9 }}>SĐT: </span>
                <span>{personalInfo.phone}</span>
              </div>
            )}
            {personalInfo.location && (
              <div className="template-header-contact-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span style={{ opacity: 0.9 }}>Địa chỉ: </span>
                <span>{personalInfo.location}</span>
              </div>
            )}
            {personalInfo.linkedin_url && (
              <div className="template-header-contact-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span style={{ opacity: 0.9 }}>LinkedIn: </span>
                <a href={personalInfo.linkedin_url} target="_blank" rel="noopener noreferrer">
                  LinkedIn
                </a>
              </div>
            )}
            {personalInfo.website && (
              <div className="template-header-contact-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
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
              <div className="template-header-contact-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
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
        )}
      </div>

      <div className="template-content">
        {/* Left Column */}
        <div>
          {skills.length > 0 && (
            <div className="template-section">
              <h2 className="template-section-title">
                <i className="fas fa-code"></i>
                Kỹ năng
              </h2>
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
            <div className="template-section">
              <h2 className="template-section-title">
                <i className="fas fa-language"></i>
                Ngôn ngữ
              </h2>
              {languages.map((lang, idx) => (
                <div key={idx} className="template-language-item">
                  <div style={{ fontWeight: 600 }}>
                    {lang.language || lang.name || 'Language'} {lang.proficiency && `(${lang.proficiency})`}
                  </div>
                  {(lang.certificate || lang.certificate_url) && (
                    <div style={{ marginTop: 4, fontSize: '12px', color: '#475569' }}>
                      {lang.certificate && <span>Chứng chỉ: {lang.certificate}</span>}
                      {lang.certificate_url && (
                        <a
                          href={lang.certificate_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ marginLeft: 6, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
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
                    <div className="template-item-description" style={{ marginTop: '8px' }}>{award.description}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div>
          {(summary || personalInfo.bio) && (
            <div className="template-section">
              <h2 className="template-section-title">
                <i className="fas fa-user"></i>
                Tóm tắt
              </h2>
              <div style={{ fontSize: '14px', color: '#4a5568', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
                {summary || personalInfo.bio}
              </div>
            </div>
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
                          <a href={project.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1e293b' }}>{project.url}</a>
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
    </div>
  )
}

