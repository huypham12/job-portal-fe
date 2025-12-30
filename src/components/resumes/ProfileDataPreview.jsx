import { useState } from 'react'

export default function ProfileDataPreview({ profileData, completion }) {
  const [expandedSections, setExpandedSections] = useState({
    skills: false,
    experiences: false,
    educations: false,
    certifications: false,
    awards: false,
  })

  if (!profileData) {
    return (
      <div className="profile-data-preview profile-data-preview--empty">
        <p className="muted">Không có dữ liệu hồ sơ</p>
      </div>
    )
  }

  const sections = profileData.sections || {}
  const content = profileData.content || {}
  const personalInfo = sections.personal_info?.data || {}
  const skills = sections.skills?.items || []
  const experiences = sections.experiences?.items || []
  const educations = sections.educations?.items || []
  const certificates = profileData.certifications || profileData.certificates || sections.certifications?.items || sections.certificates?.items || []
  const awards = profileData.awards || sections.awards?.items || []

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

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

  const getSkillName = (skill) => {
    if (typeof skill === 'string') return skill
    if (skill?.skills?.name) return skill.skills.name
    if (skill?.name) return skill.name
    if (skill?.skill_id) return skill.skill_id
    return 'Kỹ năng'
  }

  return (
    <div className="profile-data-preview">
      <div className="profile-data-preview__header">
        <h3 className="profile-data-preview__title">Thông tin sẽ được sử dụng</h3>
        {completion && (
          <div className={`profile-data-preview__badge ${completion.isComplete ? 'profile-data-preview__badge--complete' : ''}`}>
            {completion.percentage}% hoàn thành
          </div>
        )}
      </div>

      {/* Personal Info */}
      <div className="profile-data-preview__section">
        <div className="profile-data-preview__section-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <h4 className="profile-data-preview__section-title">Thông tin cá nhân</h4>
        </div>
        <div className="profile-data-preview__section-content">
          <div className="profile-data-preview__field">
            <span className="profile-data-preview__field-label">Họ và tên:</span>
            <span className="profile-data-preview__field-value">
              {personalInfo.full_name || <span className="muted">Chưa có</span>}
            </span>
          </div>
          {personalInfo.headline && (
            <div className="profile-data-preview__field">
              <span className="profile-data-preview__field-label">Headline:</span>
              <span className="profile-data-preview__field-value">{personalInfo.headline}</span>
            </div>
          )}
          <div className="profile-data-preview__field">
            <span className="profile-data-preview__field-label">Email:</span>
            <span className="profile-data-preview__field-value">
              {personalInfo.email || <span className="muted">Chưa có</span>}
            </span>
          </div>
          <div className="profile-data-preview__field">
            <span className="profile-data-preview__field-label">Số điện thoại:</span>
            <span className="profile-data-preview__field-value">
              {personalInfo.phone || <span className="muted">Chưa có</span>}
            </span>
          </div>
          {personalInfo.location && (
            <div className="profile-data-preview__field">
              <span className="profile-data-preview__field-label">Địa chỉ:</span>
              <span className="profile-data-preview__field-value">{personalInfo.location}</span>
            </div>
          )}
          {personalInfo.date_of_birth && (
            <div className="profile-data-preview__field">
              <span className="profile-data-preview__field-label">Ngày sinh:</span>
              <span className="profile-data-preview__field-value">{formatDateOfBirth(personalInfo.date_of_birth)}</span>
            </div>
          )}
          {personalInfo.linkedin_url && (
            <div className="profile-data-preview__field">
              <span className="profile-data-preview__field-label">LinkedIn:</span>
              <span className="profile-data-preview__field-value">
                <a href={personalInfo.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>
                  {personalInfo.linkedin_url}
                </a>
              </span>
            </div>
          )}
          {personalInfo.website && (
            <div className="profile-data-preview__field">
              <span className="profile-data-preview__field-label">Website:</span>
              <span className="profile-data-preview__field-value">
                <a href={personalInfo.website} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>
                  {personalInfo.website}
                </a>
              </span>
            </div>
          )}
          {personalInfo.bio && (
            <div className="profile-data-preview__field profile-data-preview__field--full">
              <span className="profile-data-preview__field-label">Giới thiệu:</span>
              <p className="profile-data-preview__bio">{personalInfo.bio}</p>
            </div>
          )}
        </div>
      </div>

      {/* Skills Summary */}
      <div className="profile-data-preview__section">
        <div className="profile-data-preview__section-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <h4 className="profile-data-preview__section-title">Kỹ năng</h4>
          <span className="profile-data-preview__section-count">{skills.length}</span>
        </div>
        {skills.length > 0 ? (
          <>
            <div className="profile-data-preview__section-content">
              <div className="profile-data-preview__skills-preview">
                {skills.slice(0, 5).map((skill, idx) => (
                  <span key={skill.id || skill.skill_id || idx} className="profile-data-preview__skill-tag">
                    {getSkillName(skill)}
                  </span>
                ))}
                {skills.length > 5 && (
                  <span className="profile-data-preview__skill-more">+{skills.length - 5} kỹ năng khác</span>
                )}
              </div>
            </div>
            {skills.length > 5 && (
              <button
                type="button"
                className="profile-data-preview__expand-btn"
                onClick={() => toggleSection('skills')}
              >
                {expandedSections.skills ? 'Thu gọn' : `Xem tất cả ${skills.length} kỹ năng`}
              </button>
            )}
            {expandedSections.skills && (
              <div className="profile-data-preview__expanded-content">
                {skills.map((skill, idx) => (
                  <div key={skill.id || skill.skill_id || idx} className="profile-data-preview__skill-item">
                    <span>{getSkillName(skill)}</span>
                    {(skill.proficiency_level || skill.proficiency || skill.level) && (
                      <span className="profile-data-preview__skill-level">
                        {skill.proficiency_level || skill.level || (skill.proficiency ? `Điểm ${skill.proficiency}` : '')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="profile-data-preview__section-content">
            <p className="muted small">Chưa có kỹ năng nào</p>
          </div>
        )}
      </div>

      {/* Experiences Summary */}
      <div className="profile-data-preview__section">
        <div className="profile-data-preview__section-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <h4 className="profile-data-preview__section-title">Kinh nghiệm làm việc</h4>
          <span className="profile-data-preview__section-count">{experiences.length}</span>
        </div>
        {experiences.length > 0 ? (
          <>
            <div className="profile-data-preview__section-content">
              {experiences.slice(0, 2).map((exp, idx) => (
                <div key={exp.id || idx} className="profile-data-preview__experience-item">
                  <div className="profile-data-preview__experience-title">
                    {exp.job_title || exp.position || 'Chưa có chức danh'}
                  </div>
                  <div className="profile-data-preview__experience-company">
                    {exp.company_name || 'Chưa có công ty'}
                  </div>
                  <div className="profile-data-preview__experience-date muted small">
                    {exp.start_date && formatDate(exp.start_date)}
                    {exp.end_date ? ` - ${formatDate(exp.end_date)}` : exp.is_current ? ' - Hiện tại' : ''}
                  </div>
                </div>
              ))}
            </div>
            {experiences.length > 2 && (
              <>
                <button
                  type="button"
                  className="profile-data-preview__expand-btn"
                  onClick={() => toggleSection('experiences')}
                >
                  {expandedSections.experiences ? 'Thu gọn' : `Xem tất cả ${experiences.length} kinh nghiệm`}
                </button>
                {expandedSections.experiences && (
                  <div className="profile-data-preview__expanded-content">
                    {experiences.map((exp, idx) => (
                      <div key={exp.id || idx} className="profile-data-preview__experience-item">
                        <div className="profile-data-preview__experience-title">
                          {exp.job_title || exp.position || 'Chưa có chức danh'}
                        </div>
                        <div className="profile-data-preview__experience-company">
                          {exp.company_name || 'Chưa có công ty'}
                        </div>
                        <div className="profile-data-preview__experience-date muted small">
                          {exp.start_date && formatDate(exp.start_date)}
                          {exp.end_date ? ` - ${formatDate(exp.end_date)}` : exp.is_current ? ' - Hiện tại' : ''}
                        </div>
                        {exp.description && (
                          <p className="profile-data-preview__experience-desc muted small">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="profile-data-preview__section-content">
            <p className="muted small">Chưa có kinh nghiệm nào</p>
          </div>
        )}
      </div>

      {/* Educations Summary */}
      <div className="profile-data-preview__section">
        <div className="profile-data-preview__section-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <h4 className="profile-data-preview__section-title">Học vấn</h4>
          <span className="profile-data-preview__section-count">{educations.length}</span>
        </div>
        {educations.length > 0 ? (
          <>
            <div className="profile-data-preview__section-content">
              {educations.slice(0, 2).map((edu, idx) => (
                <div key={edu.id || idx} className="profile-data-preview__education-item">
                  <div className="profile-data-preview__education-title">
                    {edu.institution_name || edu.school_name || 'Chưa có trường'}
                  </div>
                  <div className="profile-data-preview__education-degree">
                    {edu.degree || edu.field_of_study || 'Chưa có bằng cấp'}
                  </div>
                  <div className="profile-data-preview__education-date muted small">
                    {edu.start_date && formatDate(edu.start_date)}
                    {edu.end_date ? ` - ${formatDate(edu.end_date)}` : ' - Hiện tại'}
                  </div>
                </div>
              ))}
            </div>
            {educations.length > 2 && (
              <>
                <button
                  type="button"
                  className="profile-data-preview__expand-btn"
                  onClick={() => toggleSection('educations')}
                >
                  {expandedSections.educations ? 'Thu gọn' : `Xem tất cả ${educations.length} học vấn`}
                </button>
                {expandedSections.educations && (
                  <div className="profile-data-preview__expanded-content">
                    {educations.map((edu, idx) => (
                      <div key={edu.id || idx} className="profile-data-preview__education-item">
                        <div className="profile-data-preview__education-title">
                          {edu.institution_name || edu.school_name || 'Chưa có trường'}
                        </div>
                        <div className="profile-data-preview__education-degree">
                          {edu.degree || edu.field_of_study || 'Chưa có bằng cấp'}
                        </div>
                        <div className="profile-data-preview__education-date muted small">
                          {edu.start_date && formatDate(edu.start_date)}
                          {edu.end_date ? ` - ${formatDate(edu.end_date)}` : ' - Hiện tại'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="profile-data-preview__section-content">
            <p className="muted small">Chưa có học vấn nào</p>
          </div>
        )}
      </div>

      {/* Certifications Summary */}
      <div className="profile-data-preview__section">
        <div className="profile-data-preview__section-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <h4 className="profile-data-preview__section-title">Chứng chỉ</h4>
          <span className="profile-data-preview__section-count">{certificates.length}</span>
        </div>
        {certificates.length > 0 ? (
          <>
            <div className="profile-data-preview__section-content">
              {certificates.slice(0, 2).map((cert, idx) => (
                <div key={cert.id || idx} className="profile-data-preview__experience-item">
                  <div className="profile-data-preview__experience-title">
                    {cert.name || cert.title || 'Chưa có tên chứng chỉ'}
                  </div>
                  <div className="profile-data-preview__experience-company">
                    {cert.issuing_org || cert.issuer || 'Chưa có tổ chức cấp'}
                  </div>
                  {cert.issue_date && (
                    <div className="profile-data-preview__experience-date muted small">
                      {formatDate(cert.issue_date)}
                      {cert.expiry_date && ` - ${formatDate(cert.expiry_date)}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {certificates.length > 2 && (
              <>
                <button
                  type="button"
                  className="profile-data-preview__expand-btn"
                  onClick={() => toggleSection('certifications')}
                >
                  {expandedSections.certifications ? 'Thu gọn' : `Xem tất cả ${certificates.length} chứng chỉ`}
                </button>
                {expandedSections.certifications && (
                  <div className="profile-data-preview__expanded-content">
                    {certificates.map((cert, idx) => (
                      <div key={cert.id || idx} className="profile-data-preview__experience-item">
                        <div className="profile-data-preview__experience-title">
                          {cert.name || cert.title || 'Chưa có tên chứng chỉ'}
                        </div>
                        <div className="profile-data-preview__experience-company">
                          {cert.issuing_org || cert.issuer || 'Chưa có tổ chức cấp'}
                        </div>
                        {cert.issue_date && (
                          <div className="profile-data-preview__experience-date muted small">
                            {formatDate(cert.issue_date)}
                            {cert.expiry_date && ` - ${formatDate(cert.expiry_date)}`}
                          </div>
                        )}
                        {cert.credential_id && (
                          <div className="profile-data-preview__experience-date muted small">
                            ID: {cert.credential_id}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="profile-data-preview__section-content">
            <p className="muted small">Chưa có chứng chỉ nào</p>
          </div>
        )}
      </div>

      {/* Awards Summary */}
      <div className="profile-data-preview__section">
        <div className="profile-data-preview__section-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
          <h4 className="profile-data-preview__section-title">Giải thưởng</h4>
          <span className="profile-data-preview__section-count">{awards.length}</span>
        </div>
        {awards.length > 0 ? (
          <>
            <div className="profile-data-preview__section-content">
              {awards.slice(0, 2).map((award, idx) => (
                <div key={award.id || idx} className="profile-data-preview__experience-item">
                  <div className="profile-data-preview__experience-title">
                    {award.title || award.name || 'Chưa có tên giải thưởng'}
                  </div>
                  <div className="profile-data-preview__experience-company">
                    {award.issuer || award.issuing_org || 'Chưa có đơn vị trao tặng'}
                  </div>
                  {award.date && (
                    <div className="profile-data-preview__experience-date muted small">
                      {formatDate(award.date)}
                    </div>
                  )}
                  {award.description && (
                    <p className="profile-data-preview__experience-desc muted small">{award.description}</p>
                  )}
                </div>
              ))}
            </div>
            {awards.length > 2 && (
              <>
                <button
                  type="button"
                  className="profile-data-preview__expand-btn"
                  onClick={() => toggleSection('awards')}
                >
                  {expandedSections.awards ? 'Thu gọn' : `Xem tất cả ${awards.length} giải thưởng`}
                </button>
                {expandedSections.awards && (
                  <div className="profile-data-preview__expanded-content">
                    {awards.map((award, idx) => (
                      <div key={award.id || idx} className="profile-data-preview__experience-item">
                        <div className="profile-data-preview__experience-title">
                          {award.title || award.name || 'Chưa có tên giải thưởng'}
                        </div>
                        <div className="profile-data-preview__experience-company">
                          {award.issuer || award.issuing_org || 'Chưa có đơn vị trao tặng'}
                        </div>
                        {award.date && (
                          <div className="profile-data-preview__experience-date muted small">
                            {formatDate(award.date)}
                          </div>
                        )}
                        {award.description && (
                          <p className="profile-data-preview__experience-desc muted small">{award.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="profile-data-preview__section-content">
            <p className="muted small">Chưa có giải thưởng nào</p>
          </div>
        )}
      </div>
    </div>
  )
}
