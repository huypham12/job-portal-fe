import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ResumeApi } from '../services/resumeApi'
import { ProfileClient } from '../services/profileClient'
import TemplateGallery from '../components/resumes/TemplateGallery'
import ProfileDataPreview from '../components/resumes/ProfileDataPreview'
import CVPreview from '../components/resumes/CVPreview'
import StepIndicator from '../components/resumes/StepIndicator'
import ProjectsSection from '../components/resumes/ProjectsSection'
import LanguagesSection from '../components/resumes/LanguagesSection'
import SummarySection from '../components/resumes/SummarySection'
import ReferencesSection from '../components/resumes/ReferencesSection'
import { calculateProfileCompletion } from '../utils/profileCompletion'
import { useResumeWizard } from '../hooks/useResumeWizard'

export default function ResumeCreate() {
  const navigate = useNavigate()
  const wizard = useResumeWizard()
  const { currentStep, formData, updateFormData, nextStep, prevStep, previousStep, canGoNext, STEPS, STEP_NAMES, totalSteps } = wizard

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [themesLoading, setThemesLoading] = useState(false)
  const [profileData, setProfileData] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [completion, setCompletion] = useState(null)
  const [titleError, setTitleError] = useState('')

  const loadProfileData = useCallback(async () => {
    setProfileLoading(true)
    try {
      let data = null
      try {
        data = await ResumeApi.getProfileData()
      } catch (resumeApiError) {
        try {
          const profileRes = await ProfileClient.get()
          const profileData = profileRes?.data || profileRes
          if (profileData) {
            data = {
              sections: {
                personal_info: {
                  data: {
                    full_name: profileData.full_name,
                    email: profileData.users?.email,
                    phone: profileData.phone_number,
                    bio: profileData.bio,
                    location: profileData.location_text,
                    headline: profileData.headline,
                    linkedin_url: profileData.linkedin_url,
                    website: profileData.personal_website,
                    date_of_birth: profileData.date_of_birth,
                    // Các trường phục vụ tính completion
                    location_id: profileData.location_id,
                    desired_job_title: profileData.desired_job_title,
                    years_of_experience: profileData.years_of_experience,
                    avatar_url: profileData.avatar_url,
                  }
                },
                skills: {
                  items: profileData.skills || []
                },
                experiences: {
                  items: profileData.experiences || []
                },
                educations: {
                  items: profileData.educations || []
                },
                certifications: {
                  items: profileData.certifications || []
                },
                awards: {
                  items: profileData.awards || []
                }
              },
              certifications: profileData.certifications || [],
              awards: profileData.awards || []
            }
          }
        } catch (profileError) {
          throw resumeApiError
        }
      }
      
      if (!data) {
        throw new Error('Không nhận được dữ liệu từ API')
      }
      
      setProfileData(data)
      // Bổ sung avatar_url nếu có
      if (!data.sections?.personal_info?.data?.avatar_url && data.avatar_url) {
        data.sections.personal_info.data.avatar_url = data.avatar_url
      }
      const completionData = calculateProfileCompletion(data)
      setCompletion(completionData)
    } catch (err) {
      console.error('Không thể tải profile data:', err)
      const errorMessage = err?.message || err?.data?.message || 'Không thể tải thông tin hồ sơ'
      setCompletion({ 
        percentage: 0, 
        isComplete: false, 
        missingItems: [errorMessage],
        error: true
      })
    } finally {
      setProfileLoading(false)
    }
  }, [])

  // Load profile data khi chọn method = 'profile'
  useEffect(() => {
    if (formData.method === 'profile') {
      loadProfileData()
    } else {
      setProfileData(null)
      setCompletion(null)
    }
  }, [formData.method, loadProfileData])

  const validateTitle = (value) => {
    if (!value.trim()) {
      setTitleError('Tên CV là bắt buộc')
      return false
    }
    if (value.trim().length < 3) {
      setTitleError('Tên CV phải có ít nhất 3 ký tự')
      return false
    }
    setTitleError('')
    return true
  }

  const handleTitleChange = (e) => {
    const value = e.target.value
    updateFormData({ title: value })
    if (titleError) {
      validateTitle(value)
    }
  }

  const handleSelectProfile = () => {
    updateFormData({ method: 'profile' })
    loadProfileData()
  }

  const handleNext = () => {
    if (currentStep === STEPS.TITLE) {
      if (!validateTitle(formData.title)) {
        return
      }
    }
    if (currentStep === STEPS.METHOD && formData.method === 'profile' && completion && !completion.isComplete) {
      setError('Vui lòng hoàn thành 100% hồ sơ trước khi tiếp tục. Chuyển về trang hồ sơ để cập nhật.')
      navigate('/profile')
      return
    }
    setError('')
    nextStep()
  }

  const handleSubmit = async () => {
    if (!validateTitle(formData.title)) return

    if (formData.method === 'profile' && completion && !completion.isComplete) {
      setError('Vui lòng hoàn thành 100% hồ sơ trước khi tạo CV. Chuyển về trang hồ sơ để cập nhật.')
      navigate('/profile')
      return
    }

    setLoading(true)
    setError('')
    try {
      // Map all data into content object
      const sections = profileData?.sections || {}
      const personalInfo = {
        ...(sections.personal_info?.data || {}),
        avatar_url:
          (sections.personal_info?.data || {}).avatar_url ||
          profileData?.avatar_url
      }
      const content = {
        personal_info: personalInfo,
        skills: sections.skills?.items || [],
        experiences: sections.experiences?.items || [],
        educations: sections.educations?.items || [],
        certifications: sections.certifications?.items || [],
        awards: sections.awards?.items || [],
        projects: formData.projects || [],
        languages: formData.languages || [],
        summary: formData.summary || '',
        references: formData.references || [],
        layout_settings: {
          theme: formData.theme || 'professional',
          sections_order: ['personal_info', 'skills', 'experiences', 'educations', 'certifications', 'awards', 'projects', 'languages', 'references']
        }
      }

      let result
      // Always use createResume with full content (no need for createResumeFromProfile anymore)
        result = await ResumeApi.createResume({
          title: formData.title.trim(),
          content: content,
          is_default: formData.isDefault,
          is_public: formData.isPublic,
          status: 'draft',
        })

      // Clear draft
      localStorage.removeItem('resume-create-draft')
      navigate(`/resumes/${result.id}`)
    } catch (err) {
      setError(err?.message || 'Không thể tạo CV.')
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case STEPS.METHOD:
  return (
          <div className="resume-wizard-step">
            <h2 className="resume-wizard-step__title">Tạo CV từ hồ sơ</h2>
            <p className="resume-wizard-step__description muted">
              CV sẽ được tạo dựa trên thông tin hồ sơ hiện có của bạn
            </p>
            <div className="resume-wizard-methods">
          <button
            type="button"
                className="resume-wizard-method resume-wizard-method--selected"
                onClick={handleSelectProfile}
          >
                <div className="resume-wizard-method__icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <h3 className="resume-wizard-method__title">Tạo từ hồ sơ</h3>
                <p className="resume-wizard-method__description muted small">
                  Sử dụng thông tin từ hồ sơ của bạn
                </p>
                {formData.method === 'profile' && profileLoading && (
                  <div className="resume-wizard-method__loading">
                    <div className="spinner" style={{ width: '16px', height: '16px' }} />
                    Đang tải...
                  </div>
                )}
                {formData.method === 'profile' && completion && (
                  <div className={`resume-wizard-method__status ${completion.isComplete ? 'resume-wizard-method__status--complete' : 'resume-wizard-method__status--incomplete'}`}>
                    {completion.isComplete ? '✓ Hoàn thành' : `${completion.percentage}% hoàn thành`}
                  </div>
                )}
          </button>
        </div>
            {formData.method === 'profile' && completion && !completion.isComplete && (
              <div className="resume-wizard-step__warning">
                <ProfileDataPreview profileData={profileData} completion={completion} />
                <div className="resume-wizard-step__warning-actions">
                  <a href="/profile" className="btn primary">
                    Cập nhật hồ sơ
                  </a>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setError('Vui lòng hoàn thành 100% hồ sơ trước khi tiếp tục. Chuyển về trang hồ sơ để cập nhật.')
                      navigate('/profile')
                    }}
                  >
                    Quay lại hồ sơ
                  </button>
                </div>
              </div>
            )}
            {formData.method === 'profile' && completion && completion.isComplete && profileData && (
              <div className="resume-wizard-step__preview">
                <ProfileDataPreview profileData={profileData} completion={completion} />
              </div>
            )}
          </div>
        )

      case STEPS.TITLE:
        return (
          <div className="resume-wizard-step">
            <h2 className="resume-wizard-step__title">Đặt tên cho CV</h2>
            <p className="resume-wizard-step__description muted">
              Đặt tên để dễ quản lý và phân biệt các CV của bạn
            </p>
            <div className="resume-wizard-step__content">
              <div className="resume-create-field">
                <label className="resume-create-field__label">
                  Tên CV <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={handleTitleChange}
                  onBlur={() => validateTitle(formData.title)}
                  placeholder={formData.method === 'profile' && profileData?.sections?.personal_info?.data?.full_name 
                    ? `CV ${profileData.sections.personal_info.data.full_name} - 2025`
                    : "VD: CV Frontend Developer - 2025"}
                  className={`resume-create-field__input ${titleError ? 'resume-create-field__input--error' : ''}`}
                  required
                />
                {titleError && (
                  <span className="resume-create-field__error">{titleError}</span>
                )}
                {formData.method === 'profile' && profileData?.sections?.personal_info?.data?.full_name && (
                  <p className="resume-create-field__hint muted small">
                    Gợi ý: CV {profileData.sections.personal_info.data.full_name} - {new Date().getFullYear()}
                  </p>
                )}
              </div>
            </div>
            </div>
        )

      case STEPS.TEMPLATE:
        return (
          <div className="resume-wizard-step">
            <h2 className="resume-wizard-step__title">Chọn template</h2>
            <p className="resume-wizard-step__description muted">
              Chọn một template phù hợp với phong cách của bạn
            </p>
            <div className="resume-wizard-step__content">
              <TemplateGallery
                selectedTheme={formData.theme}
                onSelectTheme={(theme) => updateFormData({ theme })}
                loading={themesLoading}
                showPreview={true}
              />
            </div>
          </div>
        )

      case STEPS.PREVIEW:
        return (
          <div className="resume-wizard-step">
            <h2 className="resume-wizard-step__title">Xem trước CV</h2>
            <p className="resume-wizard-step__description muted">
              Xem trước CV của bạn trước khi tạo
            </p>
            <div className="resume-wizard-step__content">
              {formData.method === 'profile' && profileData ? (
                <CVPreview
                  profileData={profileData}
                  theme={formData.theme || 'professional'}
                  title={formData.title}
                  hideHeader={true}
                  additionalData={{
                    projects: formData.projects || [],
                    languages: formData.languages || [],
                    summary: formData.summary || '',
                    references: formData.references || []
                  }}
                />
              ) : (
                <div className="cv-preview cv-preview--empty">
                  <p className="muted">CV sẽ được tạo với template đã chọn. Bạn có thể chỉnh sửa sau khi tạo.</p>
                </div>
              )}
            </div>
          </div>
        )

      case STEPS.ADDITIONAL_INFO:
        return (
          <div className="resume-wizard-step">
            <h2 className="resume-wizard-step__title">Thông tin bổ sung</h2>
            <p className="resume-wizard-step__description muted">
              Thêm các thông tin bổ sung cho CV của bạn (tùy chọn)
            </p>
            <div className="resume-wizard-step__content">
              <div className="additional-info-grid">
                <div className="additional-info-card">
                  <div className="additional-info-card__header">
                    <div className="additional-info-card__icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                      </svg>
                    </div>
                    <div className="additional-info-card__title-group">
                      <h3 className="additional-info-card__title">Dự án</h3>
                      <p className="additional-info-card__subtitle muted small">Thêm các dự án nổi bật của bạn</p>
                    </div>
                  </div>
                  <div className="additional-info-card__body">
                    <ProjectsSection
                      projects={formData.projects || []}
                      onChange={(projects) => updateFormData({ projects })}
                    />
                  </div>
                </div>

                <div className="additional-info-card">
                  <div className="additional-info-card__header">
                    <div className="additional-info-card__icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    </div>
                    <div className="additional-info-card__title-group">
                      <h3 className="additional-info-card__title">Tóm tắt / Mục tiêu</h3>
                      <p className="additional-info-card__subtitle muted small">Viết về bản thân và mục tiêu nghề nghiệp</p>
                    </div>
                  </div>
                  <div className="additional-info-card__body">
                    <SummarySection
                      summary={formData.summary || ''}
                      onChange={(value) => updateFormData({ summary: value })}
                    />
                  </div>
                </div>

                <div className="additional-info-card">
                  <div className="additional-info-card__header">
                    <div className="additional-info-card__icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                    </div>
                    <div className="additional-info-card__title-group">
                      <h3 className="additional-info-card__title">Ngôn ngữ</h3>
                      <p className="additional-info-card__subtitle muted small">Thêm các ngôn ngữ bạn thành thạo</p>
                    </div>
                  </div>
                  <div className="additional-info-card__body">
                    <LanguagesSection
                      languages={formData.languages || []}
                      onChange={(languages) => updateFormData({ languages })}
                    />
                  </div>
                </div>

                <div className="additional-info-card">
                  <div className="additional-info-card__header">
                    <div className="additional-info-card__icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <div className="additional-info-card__title-group">
                      <h3 className="additional-info-card__title">Người tham khảo</h3>
                      <p className="additional-info-card__subtitle muted small">Thêm thông tin người tham khảo</p>
                    </div>
                  </div>
                  <div className="additional-info-card__body">
                    <ReferencesSection
                      references={formData.references || []}
                      onChange={(references) => updateFormData({ references })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case STEPS.SETTINGS:
        return (
          <div className="resume-wizard-step">
            <h2 className="resume-wizard-step__title">Cài đặt</h2>
            <p className="resume-wizard-step__description muted">
              Tùy chọn cấu hình cho CV
            </p>
            <div className="resume-wizard-step__content">
              <div className="resume-create-checkboxes">
                <label className="resume-create-checkbox">
                <input
                  type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => updateFormData({ isDefault: e.target.checked })}
                />
                  <div className="resume-create-checkbox__content">
                    <div className="resume-create-checkbox__title">Đặt làm CV mặc định</div>
                    <div className="resume-create-checkbox__description muted small">
                      CV này sẽ được sử dụng mặc định khi ứng tuyển
                    </div>
                  </div>
              </label>
                <label className="resume-create-checkbox">
                <input
                  type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => updateFormData({ isPublic: e.target.checked })}
                />
                  <div className="resume-create-checkbox__content">
                    <div className="resume-create-checkbox__title">Công khai CV</div>
                    <div className="resume-create-checkbox__description muted small">
                      Cho phép nhà tuyển dụng xem CV công khai
                    </div>
                  </div>
              </label>
            </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <section className="section resume-create-page resume-wizard">
      {/* Hero Header */}
      <div className="resume-create-hero">
        <div className="resume-create-hero__content">
          <h1 className="resume-create-hero__title">Tạo CV mới</h1>
          <p className="resume-create-hero__subtitle">
            Tạo CV chuyên nghiệp chỉ trong vài bước đơn giản
          </p>
            </div>
            </div>

      <div className="card resume-create-card">
        {/* Step Indicator */}
        <StepIndicator
          currentStep={currentStep}
          totalSteps={totalSteps}
          stepNames={STEP_NAMES}
          onStepClick={(step) => {
            // Only allow going to completed steps or next step
            if (step <= currentStep) {
              wizard.goToStep(step)
            }
          }}
          completedSteps={Array.from({ length: currentStep - 1 }, (_, i) => i + 1)}
              />

        {error && (
          <div className="error-banner resume-create-banner">
            {error}
            </div>
        )}

        {/* Step Content */}
        <div className="resume-wizard-content">
          {renderStepContent()}
            </div>

        {/* Navigation */}
        <div className="resume-wizard-navigation">
          <button
            type="button"
            className="btn"
            onClick={() => currentStep === STEPS.METHOD ? navigate('/resumes') : prevStep()}
          >
            {currentStep === STEPS.METHOD ? 'Hủy' : 'Quay lại'}
          </button>
          <div className="resume-wizard-navigation__right">
            {currentStep < STEPS.SETTINGS ? (
              <button
                type="button"
                className="btn primary"
                onClick={handleNext}
                disabled={!canGoNext}
              >
                Tiếp theo
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            ) : currentStep === STEPS.SETTINGS ? (
              <button
                type="button"
                className="btn primary"
                onClick={handleSubmit}
                disabled={loading || !!titleError || (formData.method === 'profile' && completion && !completion.isComplete)}
              >
                {loading ? (
                  <>
                    <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="32" strokeDashoffset="32">
                        <animate attributeName="stroke-dasharray" dur="2s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite" />
                        <animate attributeName="stroke-dashoffset" dur="2s" values="0;-16;-32;-32" repeatCount="indefinite" />
                      </circle>
                    </svg>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    Tạo CV
                  </>
                )}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
