import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ResumeApi } from "../services/resumeApi";
import { ProfileClient } from "../services/profileClient";
import TemplateGallery from "../components/resumes/TemplateGallery";
import ProfileDataPreview from "../components/resumes/ProfileDataPreview";
import StepIndicator from "../components/resumes/StepIndicator";
import ProjectsSection from "../components/resumes/ProjectsSection";
import LanguagesSection from "../components/resumes/LanguagesSection";
import SummarySection from "../components/resumes/SummarySection";
import ReferencesSection from "../components/resumes/ReferencesSection";
import { calculateProfileCompletion } from "../utils/profileCompletion";
import { useResumeWizard } from "../hooks/useResumeWizard";

export default function ResumeCreate() {
  const navigate = useNavigate();
  const wizard = useResumeWizard();
  const {
    currentStep,
    formData,
    updateFormData,
    nextStep,
    prevStep,
    previousStep,
    canGoNext,
    STEPS,
    STEP_NAMES,
    totalSteps,
  } = wizard;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [themesLoading, setThemesLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [completion, setCompletion] = useState(null);
  const [titleError, setTitleError] = useState("");
  const [includedSections, setIncludedSections] = useState({
    awards: true,
    certifications: true,
    skills: true,
    experiences: true,
    educations: true,
  });
  const [filteredAwards, setFilteredAwards] = useState([]);
  const [filteredSkills, setFilteredSkills] = useState([]);
  const [filteredCertifications, setFilteredCertifications] = useState([]);
  const [filteredExperiences, setFilteredExperiences] = useState([]);
  const [filteredEducations, setFilteredEducations] = useState([]);

  const loadProfileData = useCallback(async () => {
    setProfileLoading(true);
    try {
      let data = null;
      try {
        data = await ResumeApi.getProfileData();
      } catch (resumeApiError) {
        try {
          const profileRes = await ProfileClient.get();
          const profileData = profileRes?.data || profileRes;
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
                  },
                },
                skills: {
                  items: profileData.skills || [],
                },
                experiences: {
                  items: profileData.experiences || [],
                },
                educations: {
                  items: profileData.educations || [],
                },
                certifications: {
                  items: profileData.certifications || [],
                },
                awards: {
                  items: profileData.awards || [],
                },
              },
              certifications: profileData.certifications || [],
              awards: profileData.awards || [],
            };
          }
        } catch (profileError) {
          throw resumeApiError;
        }
      }

      if (!data) {
        throw new Error("Không nhận được dữ liệu từ API");
      }

      // Normalize server response:
      // - old frontend code expected `sections` format (used when calling ProfileClient.get())
      // - server may return `{ personal_info: {...}, skills: [...], ... }`
      // Convert that shape into the `sections` shape so `calculateProfileCompletion`
      // sees a consistent structure.
      if (data.personal_info && !data.sections) {
        const serverPersonal = data.personal_info || {};
        data = {
          sections: {
            personal_info: {
              data: {
                full_name: serverPersonal.full_name,
                email: serverPersonal.email,
                phone: serverPersonal.phone,
                bio: serverPersonal.bio,
                location:
                  serverPersonal.location || serverPersonal.location_text,
                headline: serverPersonal.headline,
                linkedin_url: serverPersonal.linkedin_url,
                website: serverPersonal.website,
                date_of_birth: serverPersonal.date_of_birth,
                // completion helper fields (if present)
                // Accept either location_id or plain location/location_text (calculateProfileCompletion checks .trim())
                location_id:
                  serverPersonal.location_id ||
                  serverPersonal.location ||
                  serverPersonal.location_text ||
                  data.location_id,
                desired_job_title:
                  serverPersonal.desired_job_title || data.desired_job_title,
                years_of_experience:
                  serverPersonal.years_of_experience ??
                  data.years_of_experience,
                avatar_url:
                  serverPersonal.avatar_url ||
                  serverPersonal?.users?.profile?.avatar_url ||
                  data.avatar_url,
              },
            },
            skills: { items: data.skills || [] },
            experiences: { items: data.experiences || [] },
            educations: { items: data.educations || [] },
            certifications: { items: data.certifications || [] },
            awards: { items: data.awards || [] },
          },
          // keep top-level arrays for other usage
          skills: data.skills || [],
          experiences: data.experiences || [],
          educations: data.educations || [],
          certifications: data.certifications || [],
          awards: data.awards || [],
          avatar_url: data.personal_info?.avatar_url || data.avatar_url,
        };
      }

      setProfileData(data);
      // Bổ sung avatar_url nếu có
      if (!data.sections?.personal_info?.data?.avatar_url && data.avatar_url) {
        data.sections.personal_info.data.avatar_url = data.avatar_url;
      }
      const completionData = calculateProfileCompletion(data);
      setCompletion(completionData);
      // Debug: log normalized profileData + computed completion to help diagnose mismatches
      // (remove or guard in production)
      try {
        // eslint-disable-next-line no-console
        console.debug("ResumeCreate: normalized profileData:", data);
        // eslint-disable-next-line no-console
        console.debug("ResumeCreate: completionData:", completionData);
      } catch (e) {}
    } catch (err) {
      console.error("Không thể tải profile data:", err);
      const errorMessage =
        err?.message || err?.data?.message || "Không thể tải thông tin hồ sơ";
      setCompletion({
        percentage: 0,
        isComplete: false,
        missingItems: [errorMessage],
        error: true,
      });
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Load profile data khi chọn method = 'profile'
  useEffect(() => {
    if (formData.method === "profile") {
      loadProfileData();
    } else {
      setProfileData(null);
      setCompletion(null);
    }
  }, [formData.method, loadProfileData]);

  // Initialize filteredAwards when profileData changes
  useEffect(() => {
    if (profileData?.sections?.awards?.items) {
      setFilteredAwards(
        profileData.sections.awards.items.map((a) => ({ ...a, selected: true }))
      );
    } else {
      setFilteredAwards([]);
    }
    if (profileData?.sections?.skills?.items) {
      setFilteredSkills(
        profileData.sections.skills.items.map((s) => ({ ...s, selected: true }))
      );
    } else {
      setFilteredSkills([]);
    }
    if (profileData?.sections?.certifications?.items) {
      setFilteredCertifications(
        profileData.sections.certifications.items.map((c) => ({
          ...c,
          selected: true,
        }))
      );
    } else {
      setFilteredCertifications([]);
    }
    if (profileData?.sections?.experiences?.items) {
      setFilteredExperiences(
        profileData.sections.experiences.items.map((e) => ({
          ...e,
          selected: true,
        }))
      );
    } else {
      setFilteredExperiences([]);
    }
    if (profileData?.sections?.educations?.items) {
      setFilteredEducations(
        profileData.sections.educations.items.map((ed) => ({
          ...ed,
          selected: true,
        }))
      );
    } else {
      setFilteredEducations([]);
    }
    // Load persisted selections (if any)
    try {
      const saved = JSON.parse(
        localStorage.getItem("resume-create-selection-v1") || "{}"
      );
      if (saved && saved.selected) {
        if (saved.selected.awards && Array.isArray(saved.selected.awards)) {
          setFilteredAwards((prev) =>
            prev.map((a) => ({
              ...a,
              selected: saved.selected.awards.includes(a.id),
            }))
          );
        }
        if (saved.selected.skills && Array.isArray(saved.selected.skills)) {
          setFilteredSkills((prev) =>
            prev.map((s) => ({
              ...s,
              selected: saved.selected.skills.includes(s.id),
            }))
          );
        }
        if (
          saved.selected.certifications &&
          Array.isArray(saved.selected.certifications)
        ) {
          setFilteredCertifications((prev) =>
            prev.map((c) => ({
              ...c,
              selected: saved.selected.certifications.includes(c.id),
            }))
          );
        }
        if (
          saved.selected.experiences &&
          Array.isArray(saved.selected.experiences)
        ) {
          setFilteredExperiences((prev) =>
            prev.map((e) => ({
              ...e,
              selected: saved.selected.experiences.includes(e.id),
            }))
          );
        }
        if (
          saved.selected.educations &&
          Array.isArray(saved.selected.educations)
        ) {
          setFilteredEducations((prev) =>
            prev.map((ed) => ({
              ...ed,
              selected: saved.selected.educations.includes(ed.id),
            }))
          );
        }
        if (saved.includedSections) {
          setIncludedSections((prev) => ({
            ...prev,
            ...saved.includedSections,
          }));
        }
      }
    } catch (e) {}
  }, [profileData]);

  // Persist selection whenever user changes picks
  useEffect(() => {
    try {
      const payload = {
        includedSections,
        selected: {
          awards: filteredAwards.filter((a) => a.selected).map((a) => a.id),
          skills: filteredSkills.filter((s) => s.selected).map((s) => s.id),
          certifications: filteredCertifications
            .filter((c) => c.selected)
            .map((c) => c.id),
          experiences: filteredExperiences
            .filter((e) => e.selected)
            .map((e) => e.id),
          educations: filteredEducations
            .filter((ed) => ed.selected)
            .map((ed) => ed.id),
        },
      };
      localStorage.setItem(
        "resume-create-selection-v1",
        JSON.stringify(payload)
      );
    } catch (e) {}
  }, [
    includedSections,
    filteredAwards,
    filteredSkills,
    filteredCertifications,
    filteredExperiences,
    filteredEducations,
  ]);

  const validateTitle = (value) => {
    if (!value.trim()) {
      setTitleError("Tên CV là bắt buộc");
      return false;
    }
    if (value.trim().length < 3) {
      setTitleError("Tên CV phải có ít nhất 3 ký tự");
      return false;
    }
    setTitleError("");
    return true;
  };

  const handleTitleChange = (e) => {
    const value = e.target.value;
    updateFormData({ title: value });
    if (titleError) {
      validateTitle(value);
    }
  };

  const handleSelectProfile = () => {
    updateFormData({ method: "profile" });
    loadProfileData();
  };

  const toggleSection = (section) => {
    setIncludedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleAwardItem = (id) => {
    setFilteredAwards((prev) =>
      prev.map((a) => (a.id === id ? { ...a, selected: !a.selected } : a))
    );
  };
  const toggleSkillItem = (id) => {
    setFilteredSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
  };
  const toggleCertificationItem = (id) => {
    setFilteredCertifications((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };
  const toggleExperienceItem = (id) => {
    setFilteredExperiences((prev) =>
      prev.map((e) => (e.id === id ? { ...e, selected: !e.selected } : e))
    );
  };
  const toggleEducationItem = (id) => {
    setFilteredEducations((prev) =>
      prev.map((ed) => (ed.id === id ? { ...ed, selected: !ed.selected } : ed))
    );
  };

  const handleNext = () => {
    if (currentStep === STEPS.TITLE) {
      if (!validateTitle(formData.title)) {
        return;
      }
    }
    if (
      currentStep === STEPS.METHOD &&
      formData.method === "profile" &&
      completion &&
      !completion.isComplete
    ) {
      setError(
        "Vui lòng hoàn thành 100% hồ sơ trước khi tiếp tục. Chuyển về trang hồ sơ để cập nhật."
      );
      navigate("/profile");
      return;
    }
    setError("");
    nextStep();
  };

  const handleSubmit = async () => {
    if (!validateTitle(formData.title)) return;

    if (formData.method === "profile" && completion && !completion.isComplete) {
      setError(
        "Vui lòng hoàn thành 100% hồ sơ trước khi tạo CV. Chuyển về trang hồ sơ để cập nhật."
      );
      navigate("/profile");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Map all data into content object
      const sections = profileData?.sections || {};
      const personalInfo = {
        ...(sections.personal_info?.data || {}),
        avatar_url:
          (sections.personal_info?.data || {}).avatar_url ||
          profileData?.avatar_url,
      };
      // Normalize additional sections so backend and template can rely on structured objects
      const normalizedProjects = (formData.projects || []).map((p) =>
        typeof p === "string" ? { name: p } : p
      );
      const normalizedLanguages = (formData.languages || []).map((l) =>
        typeof l === "string"
          ? { name: l, proficiency_level: "intermediate" }
          : l
      );
      const normalizedReferences = (formData.references || []).map((r) =>
        typeof r === "string" ? { name: r } : r
      );

      const content = {
        personal_info: personalInfo,
        skills: includedSections.skills
          ? filteredSkills.length
            ? filteredSkills
                .filter((s) => s.selected)
                .map(({ id, name, proficiency_level }) => ({
                  id,
                  name,
                  proficiency_level,
                }))
            : sections.skills?.items || []
          : [],
        experiences: includedSections.experiences
          ? filteredExperiences.length
            ? filteredExperiences
                .filter((e) => e.selected)
                .map(
                  ({
                    id,
                    job_title,
                    company_name,
                    start_date,
                    end_date,
                    is_current,
                    description,
                  }) => ({
                    id,
                    job_title,
                    company_name,
                    start_date,
                    end_date,
                    is_current,
                    description,
                  })
                )
            : sections.experiences?.items || []
          : [],
        educations: includedSections.educations
          ? filteredEducations.length
            ? filteredEducations
                .filter((ed) => ed.selected)
                .map(
                  ({
                    id,
                    institution_name,
                    degree,
                    field_of_study,
                    start_date,
                    end_date,
                    description,
                  }) => ({
                    id,
                    institution_name,
                    degree,
                    field_of_study,
                    start_date,
                    end_date,
                    description,
                  })
                )
            : sections.educations?.items || []
          : [],
        certifications: includedSections.certifications
          ? filteredCertifications.length
            ? filteredCertifications
                .filter((c) => c.selected)
                .map(
                  ({
                    id,
                    name,
                    issuing_organization,
                    issue_date,
                    expiration_date,
                    credential_id,
                    credential_url,
                  }) => ({
                    id,
                    name,
                    issuing_organization,
                    issue_date,
                    expiration_date,
                    credential_id,
                    credential_url,
                  })
                )
            : sections.certifications?.items || []
          : [],
        awards: includedSections.awards
          ? filteredAwards
              .filter((a) => a.selected)
              .map(({ id, title, issuer, date, description }) => ({
                id,
                title,
                issuer,
                date,
                description,
              }))
          : [],
        projects: normalizedProjects,
        languages: normalizedLanguages,
        summary: formData.summary || "",
        references: normalizedReferences,
      };

      // Build dynamic sections_order respecting user's includedSections choice and actual content
      const sectionsOrder = ["personal_info"];
      if (includedSections.skills && content.skills.length > 0)
        sectionsOrder.push("skills");
      if (includedSections.experiences && content.experiences.length > 0)
        sectionsOrder.push("experiences");
      if (includedSections.educations && content.educations.length > 0)
        sectionsOrder.push("educations");
      if (includedSections.certifications && content.certifications.length > 0)
        sectionsOrder.push("certifications");
      if (includedSections.awards && content.awards.length > 0)
        sectionsOrder.push("awards");

      // Add additional sections that have content
      if (content.projects.length > 0) sectionsOrder.push("projects");
      if (content.summary) sectionsOrder.push("summary");
      if (content.languages.length > 0) sectionsOrder.push("languages");
      if (content.references.length > 0) sectionsOrder.push("references");

      // Update layout_settings with the correct sections_order
      content.layout_settings = {
        theme: formData.theme || "modern",
        sections_order: sectionsOrder,
      };

      let result;
      // Always use createResume with full content (no need for createResumeFromProfile anymore)
      result = await ResumeApi.createResume({
        title: formData.title.trim(),
        content: content,
        is_default: formData.isDefault,
        is_public: formData.isPublic,
        status: "draft",
      });

      // Clear draft
      localStorage.removeItem("resume-create-draft");
      navigate(`/resumes/${result.id}`);
    } catch (err) {
      setError(err?.message || "Không thể tạo CV.");
    } finally {
      setLoading(false);
    }
  };

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
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <h3 className="resume-wizard-method__title">Tạo từ hồ sơ</h3>
                <p className="resume-wizard-method__description muted small">
                  Sử dụng thông tin từ hồ sơ của bạn
                </p>
                {formData.method === "profile" && profileLoading && (
                  <div className="resume-wizard-method__loading">
                    <div
                      className="spinner"
                      style={{ width: "16px", height: "16px" }}
                    />
                    Đang tải...
                  </div>
                )}
                {formData.method === "profile" && completion && (
                  <div
                    className={`resume-wizard-method__status ${
                      completion.isComplete
                        ? "resume-wizard-method__status--complete"
                        : "resume-wizard-method__status--incomplete"
                    }`}
                  >
                    {completion.isComplete
                      ? "✓ Hoàn thành"
                      : `${completion.percentage}% hoàn thành`}
                  </div>
                )}
              </button>
            </div>
            {formData.method === "profile" &&
              completion &&
              !completion.isComplete && (
                <div className="resume-wizard-step__warning">
                  <ProfileDataPreview
                    profileData={profileData}
                    completion={completion}
                  />
                  <div className="resume-wizard-step__warning-actions">
                    <a href="/profile" className="btn primary">
                      Cập nhật hồ sơ
                    </a>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        setError(
                          "Vui lòng hoàn thành 100% hồ sơ trước khi tiếp tục. Chuyển về trang hồ sơ để cập nhật."
                        );
                        navigate("/profile");
                      }}
                    >
                      Quay lại hồ sơ
                    </button>
                  </div>
                </div>
              )}
            {formData.method === "profile" &&
              completion &&
              completion.isComplete &&
              profileData && (
                <div className="resume-wizard-step__preview">
                  <ProfileDataPreview
                    profileData={profileData}
                    completion={completion}
                  />
                  <div
                    style={{
                      marginTop: 16,
                      borderTop: "1px solid #eee",
                      paddingTop: 12,
                    }}
                  >
                    <h4 className="muted small">Tuỳ chọn import từ hồ sơ</h4>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 16,
                        marginTop: 12,
                      }}
                    >
                      {[
                        {
                          key: "skills",
                          title: "Skills",
                          items: filteredSkills,
                          total:
                            profileData?.sections?.skills?.items?.length || 0,
                        },
                        {
                          key: "experiences",
                          title: "Experiences",
                          items: filteredExperiences,
                          total:
                            profileData?.sections?.experiences?.items?.length ||
                            0,
                        },
                        {
                          key: "educations",
                          title: "Educations",
                          items: filteredEducations,
                          total:
                            profileData?.sections?.educations?.items?.length ||
                            0,
                        },
                        {
                          key: "certifications",
                          title: "Certifications",
                          items: filteredCertifications,
                          total:
                            profileData?.sections?.certifications?.items
                              ?.length || 0,
                        },
                        {
                          key: "awards",
                          title: "Awards",
                          items: filteredAwards,
                          total:
                            profileData?.sections?.awards?.items?.length || 0,
                        },
                      ].map((section) => {
                        const selectedCount = (section.items || []).filter(
                          (it) => it.selected
                        ).length;
                        return (
                          <div
                            key={section.key}
                            style={{
                              border: "1px solid #e6e9ee",
                              borderRadius: 8,
                              padding: 12,
                              background: "#fff",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <div>
                                <label
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={includedSections[section.key]}
                                    onChange={() => toggleSection(section.key)}
                                  />
                                  <strong>{section.title}</strong>
                                </label>
                                <div
                                  className="muted small"
                                  style={{ marginTop: 6 }}
                                >
                                  {selectedCount}/{section.total} selected
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button
                                  type="button"
                                  className="btn"
                                  onClick={() => {
                                    if (section.key === "awards")
                                      setFilteredAwards((prev) =>
                                        prev.map((a) => ({
                                          ...a,
                                          selected: true,
                                        }))
                                      );
                                    if (section.key === "skills")
                                      setFilteredSkills((prev) =>
                                        prev.map((s) => ({
                                          ...s,
                                          selected: true,
                                        }))
                                      );
                                    if (section.key === "certifications")
                                      setFilteredCertifications((prev) =>
                                        prev.map((c) => ({
                                          ...c,
                                          selected: true,
                                        }))
                                      );
                                    if (section.key === "experiences")
                                      setFilteredExperiences((prev) =>
                                        prev.map((e) => ({
                                          ...e,
                                          selected: true,
                                        }))
                                      );
                                    if (section.key === "educations")
                                      setFilteredEducations((prev) =>
                                        prev.map((ed) => ({
                                          ...ed,
                                          selected: true,
                                        }))
                                      );
                                  }}
                                >
                                  Select all
                                </button>
                                <button
                                  type="button"
                                  className="btn"
                                  onClick={() => {
                                    if (section.key === "awards")
                                      setFilteredAwards((prev) =>
                                        prev.map((a) => ({
                                          ...a,
                                          selected: false,
                                        }))
                                      );
                                    if (section.key === "skills")
                                      setFilteredSkills((prev) =>
                                        prev.map((s) => ({
                                          ...s,
                                          selected: false,
                                        }))
                                      );
                                    if (section.key === "certifications")
                                      setFilteredCertifications((prev) =>
                                        prev.map((c) => ({
                                          ...c,
                                          selected: false,
                                        }))
                                      );
                                    if (section.key === "experiences")
                                      setFilteredExperiences((prev) =>
                                        prev.map((e) => ({
                                          ...e,
                                          selected: false,
                                        }))
                                      );
                                    if (section.key === "educations")
                                      setFilteredEducations((prev) =>
                                        prev.map((ed) => ({
                                          ...ed,
                                          selected: false,
                                        }))
                                      );
                                  }}
                                >
                                  Deselect
                                </button>
                              </div>
                            </div>

                            {includedSections[section.key] &&
                              section.items &&
                              section.items.length > 0 && (
                                <div
                                  style={{
                                    marginTop: 10,
                                    maxHeight: 220,
                                    overflowY: "auto",
                                    paddingRight: 6,
                                  }}
                                >
                                  {(section.items || []).map((it) => (
                                    <label
                                      key={it.id}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: "6px 0",
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={!!it.selected}
                                        onChange={() => {
                                          if (section.key === "awards")
                                            toggleAwardItem(it.id);
                                          if (section.key === "skills")
                                            toggleSkillItem(it.id);
                                          if (section.key === "certifications")
                                            toggleCertificationItem(it.id);
                                          if (section.key === "experiences")
                                            toggleExperienceItem(it.id);
                                          if (section.key === "educations")
                                            toggleEducationItem(it.id);
                                        }}
                                      />
                                      <div style={{ minWidth: 0 }}>
                                        <div
                                          style={{
                                            fontWeight: 600,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                          }}
                                        >
                                          {it.title ||
                                            it.name ||
                                            it.job_title ||
                                            it.institution_name}
                                        </div>
                                        <div className="muted small">
                                          {it.issuer ||
                                            it.proficiency_level ||
                                            it.company_name ||
                                            it.field_of_study ||
                                            (it.start_date
                                              ? new Date(
                                                  it.start_date
                                                ).getFullYear()
                                              : "")}
                                        </div>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
          </div>
        );

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
                  placeholder={
                    formData.method === "profile" &&
                    profileData?.sections?.personal_info?.data?.full_name
                      ? `CV ${profileData.sections.personal_info.data.full_name} - 2025`
                      : "VD: CV Frontend Developer - 2025"
                  }
                  className={`resume-create-field__input ${
                    titleError ? "resume-create-field__input--error" : ""
                  }`}
                  required
                />
                {titleError && (
                  <span className="resume-create-field__error">
                    {titleError}
                  </span>
                )}
                {formData.method === "profile" &&
                  profileData?.sections?.personal_info?.data?.full_name && (
                    <p className="resume-create-field__hint muted small">
                      Gợi ý: CV{" "}
                      {profileData.sections.personal_info.data.full_name} -{" "}
                      {new Date().getFullYear()}
                    </p>
                  )}
              </div>
            </div>
          </div>
        );

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
                showPreview={false}
              />
            </div>
          </div>
        );

      /* Preview step removed — preview is available after CV is created in ResumeDetail */

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
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                      </svg>
                    </div>
                    <div className="additional-info-card__title-group">
                      <h3 className="additional-info-card__title">Dự án</h3>
                      <p className="additional-info-card__subtitle muted small">
                        Thêm các dự án nổi bật của bạn
                      </p>
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
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    </div>
                    <div className="additional-info-card__title-group">
                      <h3 className="additional-info-card__title">
                        Tóm tắt / Mục tiêu
                      </h3>
                      <p className="additional-info-card__subtitle muted small">
                        Viết về bản thân và mục tiêu nghề nghiệp
                      </p>
                    </div>
                  </div>
                  <div className="additional-info-card__body">
                    <SummarySection
                      summary={formData.summary || ""}
                      onChange={(value) => updateFormData({ summary: value })}
                    />
                  </div>
                </div>

                <div className="additional-info-card">
                  <div className="additional-info-card__header">
                    <div className="additional-info-card__icon">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                    </div>
                    <div className="additional-info-card__title-group">
                      <h3 className="additional-info-card__title">Ngôn ngữ</h3>
                      <p className="additional-info-card__subtitle muted small">
                        Thêm các ngôn ngữ bạn thành thạo
                      </p>
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
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <div className="additional-info-card__title-group">
                      <h3 className="additional-info-card__title">
                        Người tham khảo
                      </h3>
                      <p className="additional-info-card__subtitle muted small">
                        Thêm thông tin người tham khảo
                      </p>
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
        );

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
                    onChange={(e) =>
                      updateFormData({ isDefault: e.target.checked })
                    }
                  />
                  <div className="resume-create-checkbox__content">
                    <div className="resume-create-checkbox__title">
                      Đặt làm CV mặc định
                    </div>
                    <div className="resume-create-checkbox__description muted small">
                      CV này sẽ được sử dụng mặc định khi ứng tuyển
                    </div>
                  </div>
                </label>
                <label className="resume-create-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) =>
                      updateFormData({ isPublic: e.target.checked })
                    }
                  />
                  <div className="resume-create-checkbox__content">
                    <div className="resume-create-checkbox__title">
                      Công khai CV
                    </div>
                    <div className="resume-create-checkbox__description muted small">
                      Cho phép nhà tuyển dụng xem CV công khai
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
              wizard.goToStep(step);
            }
          }}
          completedSteps={Array.from(
            { length: currentStep - 1 },
            (_, i) => i + 1
          )}
        />

        {error && (
          <div className="error-banner resume-create-banner">{error}</div>
        )}

        {/* Step Content */}
        <div className="resume-wizard-content">{renderStepContent()}</div>

        {/* Navigation */}
        <div className="resume-wizard-navigation">
          <button
            type="button"
            className="btn"
            onClick={() =>
              currentStep === STEPS.METHOD ? navigate("/resumes") : prevStep()
            }
          >
            {currentStep === STEPS.METHOD ? "Hủy" : "Quay lại"}
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
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            ) : currentStep === STEPS.SETTINGS ? (
              <button
                type="button"
                className="btn primary"
                onClick={handleSubmit}
                disabled={
                  loading ||
                  !!titleError ||
                  (formData.method === "profile" &&
                    completion &&
                    !completion.isComplete)
                }
              >
                {loading ? (
                  <>
                    <svg
                      className="spinner"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeDasharray="32"
                        strokeDashoffset="32"
                      >
                        <animate
                          attributeName="stroke-dasharray"
                          dur="2s"
                          values="0 32;16 16;0 32;0 32"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="stroke-dashoffset"
                          dur="2s"
                          values="0;-16;-32;-32"
                          repeatCount="indefinite"
                        />
                      </circle>
                    </svg>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
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
  );
}
