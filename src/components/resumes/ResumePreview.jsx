export default function ResumePreview({ resume }) {
  if (!resume) {
    return (
      <div className="resume-preview resume-preview--empty">
        <p className="muted">Không có dữ liệu để preview</p>
      </div>
    )
  }

  const content = resume.content || {}
  const layoutSettings = content.layout_settings || {}
  const sections = content.sections || {}
  
  // Extract data from sections
  const personalInfo = sections.personal_info?.data || {}
  const avatarUrl = personalInfo.avatar_url || resume.avatar_url || resume.user?.profile?.avatar_url || resume.profile?.avatar_url
  const skills = sections.skills?.items || content.skills || []
  const experiences = sections.experiences?.items || content.experiences || []
  const educations = sections.educations?.items || content.educations || []
  const projects = content.projects || []
  const languages = content.languages || []

  // summary có thể là string hoặc object { content, enabled }
  const rawSummary = content.summary
  const summary =
    typeof rawSummary === 'string'
      ? rawSummary
      : typeof rawSummary === 'object' && rawSummary !== null
      ? rawSummary.content || ''
      : ''

  const references = content.references || []

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      month: 'short',
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
    if (skill?.skill_id) return skill.skill_id
    return 'Kỹ năng'
  }

  const getProficiencyLabel = (level) => {
    const labels = {
      basic: 'Cơ bản',
      intermediate: 'Trung bình',
      advanced: 'Nâng cao',
      native: 'Bản ngữ'
    }
    return labels[level] || level
  }

  return (
    <div className="resume-preview">
      <div className="resume-preview__document">
        {/* CV Header */}
        <div className="resume-preview__header-section">
          <div className="resume-preview__header-content">
            {avatarUrl && (
              <div className="resume-preview__avatar">
                <img src={avatarUrl} alt={personalInfo.full_name || 'Avatar'} />
              </div>
            )}
            <div className="resume-preview__header-text">
              <h1 className="resume-preview__cv-title">{resume.title || personalInfo.full_name || 'CV của tôi'}</h1>
              {(personalInfo.email || personalInfo.phone) && (
                <div className="resume-preview__contact">
                  {personalInfo.email || ''}
                  {personalInfo.email && personalInfo.phone && ' • '}
                  {personalInfo.phone || ''}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="resume-preview__section">
            <h2 className="resume-preview__section-title">Tóm tắt / Mục tiêu nghề nghiệp</h2>
            <p className="resume-preview__section-content">{summary}</p>
          </div>
        )}

        {/* Bio */}
        {personalInfo.bio && (
          <div className="resume-preview__section">
            <h2 className="resume-preview__section-title">Giới thiệu</h2>
            <p className="resume-preview__section-content">{personalInfo.bio}</p>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="resume-preview__section">
            <h2 className="resume-preview__section-title">Kỹ năng</h2>
            <div className="resume-preview__skills">
              {skills.map((skill, idx) => (
                <span key={skill.id || skill.skill_id || idx} className="resume-preview__skill-tag">
                  {getSkillName(skill)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experiences */}
        {experiences.length > 0 && (
          <div className="resume-preview__section">
            <h2 className="resume-preview__section-title">Kinh nghiệm làm việc</h2>
            <div className="resume-preview__timeline">
              {experiences.map((exp, idx) => (
                <div key={exp.id || idx} className="resume-preview__timeline-item">
                  <div className="resume-preview__timeline-header">
                    <div>
                      <h3 className="resume-preview__timeline-title">
                        {exp.job_title || exp.position || 'Chưa có chức danh'}
                      </h3>
                      <div className="resume-preview__timeline-company">
                        {exp.company_name || 'Chưa có công ty'}
                      </div>
                    </div>
                    <div className="resume-preview__timeline-date">
                      {formatDateRange(exp.start_date, exp.end_date, exp.is_current)}
                    </div>
                  </div>
                  {exp.description && (
                    <p className="resume-preview__timeline-description">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Educations */}
        {educations.length > 0 && (
          <div className="resume-preview__section">
            <h2 className="resume-preview__section-title">Học vấn</h2>
            <div className="resume-preview__timeline">
              {educations.map((edu, idx) => (
                <div key={edu.id || idx} className="resume-preview__timeline-item">
                  <div className="resume-preview__timeline-header">
                    <div>
                      <h3 className="resume-preview__timeline-title">
                        {edu.institution_name || edu.school_name || 'Chưa có trường'}
                      </h3>
                      <div className="resume-preview__timeline-company">
                        {edu.degree || edu.field_of_study || 'Chưa có bằng cấp'}
                      </div>
                    </div>
                    <div className="resume-preview__timeline-date">
                      {formatDateRange(edu.start_date, edu.end_date, false)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div className="resume-preview__section">
            <h2 className="resume-preview__section-title">Dự án</h2>
            <div className="resume-preview__timeline">
              {projects.map((project, idx) => (
                <div key={idx} className="resume-preview__timeline-item">
                  <div className="resume-preview__timeline-header">
                    <div>
                      <h3 className="resume-preview__timeline-title">
                        {project.name || 'Dự án không tên'}
                      </h3>
                      {project.role && (
                        <div className="resume-preview__timeline-company">
                          {project.role}
                          {project.client && ` • ${project.client}`}
                        </div>
                      )}
                      {project.tech_stack && project.tech_stack.length > 0 && (
                        <div className="resume-preview__skills" style={{ marginTop: '8px' }}>
                          {project.tech_stack.map((tech, i) => (
                            <span key={i} className="resume-preview__skill-tag">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="resume-preview__timeline-date">
                      {formatDateRange(project.start_date, project.end_date, project.is_current)}
                    </div>
                  </div>
                  {project.description && (
                    <p className="resume-preview__timeline-description">{project.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {languages.length > 0 && (
          <div className="resume-preview__section">
            <h2 className="resume-preview__section-title">Ngôn ngữ</h2>
            <div className="resume-preview__timeline">
              {languages.map((lang, idx) => (
                <div key={idx} className="resume-preview__timeline-item">
                  <div className="resume-preview__timeline-header">
                    <div>
                      <h3 className="resume-preview__timeline-title">{lang.name || 'Ngôn ngữ'}</h3>
                      <div className="resume-preview__timeline-company">
                        {getProficiencyLabel(lang.proficiency_level)}
                        {lang.certificate && ` • ${lang.certificate}`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* References */}
        {references.length > 0 && (
          <div className="resume-preview__section">
            <h2 className="resume-preview__section-title">Người tham khảo</h2>
            <div className="resume-preview__timeline">
              {references.map((ref, idx) => (
                <div key={idx} className="resume-preview__timeline-item">
                  <div className="resume-preview__timeline-header">
                    <div>
                      <h3 className="resume-preview__timeline-title">{ref.name || 'Người tham khảo'}</h3>
                      {(ref.position || ref.company) && (
                        <div className="resume-preview__timeline-company">
                          {ref.position || ''}
                          {ref.position && ref.company && ' tại '}
                          {ref.company || ''}
                        </div>
                      )}
                      {(ref.email || ref.phone) && (
                        <div className="resume-preview__timeline-company" style={{ marginTop: '4px', fontSize: '13px', color: '#64748b' }}>
                          {ref.email || ''}
                          {ref.email && ref.phone && ' • '}
                          {ref.phone || ''}
                        </div>
                      )}
                      {ref.relationship && (
                        <div className="resume-preview__timeline-company" style={{ marginTop: '4px', fontSize: '13px', color: '#64748b' }}>
                          Mối quan hệ: {ref.relationship}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

