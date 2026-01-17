import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import CVPreview from "./CVPreview";
import SimpleModal from "../Modal";

export default function ResumeCard({ resume, onSetDefault, onDelete }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [resumeWithContent, setResumeWithContent] = useState(resume);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuOpen]);

  // Sync resumeWithContent when resume prop changes
  useEffect(() => {
    setResumeWithContent(resume);
  }, [resume]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const sourceLabel = resume.source_type === "uploaded" ? "Tải lên" : "Tạo mới";

  // Map resume content to CVPreview format (now unified flat structure)
  const getProfileDataForPreview = () => {
    const currentResume = resumeWithContent || resume;

    if (!currentResume || !currentResume.content) {
      return null; // Let CVPreview handle empty state
    }

    const content = currentResume.content;

    // Unified flat structure from backend
    return {
      personal_info: content.personal_info || {},
      skills: Array.isArray(content.skills) ? content.skills : [],
      experiences: Array.isArray(content.experiences)
        ? content.experiences
        : [],
      educations: Array.isArray(content.educations) ? content.educations : [],
      certifications: Array.isArray(content.certifications)
        ? content.certifications
        : [],
      awards: Array.isArray(content.awards) ? content.awards : [],
      projects: Array.isArray(content.projects) ? content.projects : [],
      languages: Array.isArray(content.languages) ? content.languages : [],
      summary: content.summary || "",
      references: Array.isArray(content.references) ? content.references : [],
    };
  };

  const getAdditionalDataForPreview = () => {
    const currentResume = resumeWithContent || resume;

    if (!currentResume) return {};

    const content = currentResume.content || {};
    return {
      projects: Array.isArray(content.projects) ? content.projects : [],
      languages: Array.isArray(content.languages) ? content.languages : [],
      summary: content.summary || "",
      references: Array.isArray(content.references) ? content.references : [],
    };
  };

  const currentResume = resumeWithContent || resume;
  const isFileResume =
    currentResume?.source_type === "uploaded" && !!currentResume?.file_url;

  return (
    <div className="resume-card">
      <div className="resume-card__content">
        <div className="resume-card__header">
          <div className="resume-card__title-group">
            <h3 className="resume-card__title">{resume.title}</h3>
            {resume.is_default && (
              <span className="resume-card__badge resume-card__badge--default">
                Mặc định
              </span>
            )}
            {resume.is_public && (
              <span className="resume-card__badge resume-card__badge--public">
                Công khai
              </span>
            )}
          </div>
          <div className="resume-card__meta">
            <StatusBadge status={resume.status} />
            <span className="resume-card__date muted small">
              {formatDate(resume.updated_at)}
            </span>
          </div>
        </div>

        <div className="resume-card__info">
          <span className="resume-card__source">{sourceLabel}</span>
          {resume.file_name && (
            <>
              <span className="resume-card__divider">•</span>
              <span className="muted small">{resume.file_name}</span>
            </>
          )}
        </div>
      </div>

      <div className="resume-card__actions">
        <button
          className="btn btn--icon"
          onClick={() => navigate(`/resumes/${resume.id}`)}
          title="Xem / Chỉnh sửa"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>

        {!resume.is_default && (
          <button
            className="btn btn--icon"
            onClick={() => onSetDefault(resume.id)}
            title="Đặt làm mặc định"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        )}

        <div
          className="resume-card__menu"
          ref={menuRef}
          style={{ position: "relative" }}
        >
          <button
            className="btn btn--icon"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            title="Thêm tùy chọn"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>

          {menuOpen && (
            <div
              className="resume-card__dropdown"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="resume-card__dropdown-item"
                onClick={() => {
                  setMenuOpen(false);
                  navigate(`/resumes/${resume.id}`);
                }}
              >
                Xem chi tiết
              </button>
              <button
                className="resume-card__dropdown-item"
                onClick={async () => {
                  setMenuOpen(false);
                  // Nếu là CV upload file, chỉ cần mở modal xem PDF
                  if (!isFileResume && !resumeWithContent.content) {
                    try {
                      const { ResumeApi } = await import(
                        "../../services/resumeApi"
                      );
                      const detail = await ResumeApi.getResumeById(resume.id);
                      setResumeWithContent(detail);
                    } catch (err) {
                      console.error("Failed to load resume detail:", err);
                      setResumeWithContent(resume); // Fallback to original
                    }
                  }
                  setPreviewOpen(true);
                }}
              >
                Preview
              </button>
              <div className="resume-card__dropdown-divider" />
              <button
                className="resume-card__dropdown-item resume-card__dropdown-item--danger"
                onClick={() => {
                  setMenuOpen(false);
                  if (window.confirm("Bạn chắc chắn muốn xóa CV này?")) {
                    onDelete(resume.id);
                  }
                }}
              >
                Xóa CV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <SimpleModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        noWrapper={true}
      >
        <div className="resume-preview-modal">
          <div className="resume-preview-modal__header">
            <h3 style={{ margin: 0 }}>Preview CV</h3>
            <div className="resume-preview-modal__actions">
              <button
                className="btn btn--icon"
                onClick={() => setPreviewOpen(false)}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
          <div className="resume-preview-modal__body">
            {currentResume &&
              (isFileResume && currentResume.file_url ? (
                <iframe
                  src={currentResume.file_url}
                  title={currentResume.title || "CV"}
                  style={{
                    width: "100%",
                    height: "80vh",
                    border: "none",
                    borderRadius: "12px",
                  }}
                />
              ) : (
                <CVPreview
                  resumeId={currentResume.id}
                  profileData={getProfileDataForPreview()}
                  theme={
                    currentResume.content?.layout_settings?.theme || "modern"
                  }
                  title={currentResume.title}
                  onClose={() => setPreviewOpen(false)}
                  hideHeader={true}
                  additionalData={getAdditionalDataForPreview()}
                />
              ))}
          </div>
        </div>
      </SimpleModal>
    </div>
  );
}
