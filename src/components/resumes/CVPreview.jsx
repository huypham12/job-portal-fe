import { useState, forwardRef, useEffect } from "react";
import { ResumeApi } from "../../services/resumeApi";

function CVPreviewComponent(
  {
    resumeId,
    profileData,
    title,
    theme = "modern", // Unified default theme
    onClose,
    hideHeader = false,
    additionalData = {},
  },
  ref
) {
  const [fullscreen, setFullscreen] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Always use backend preview for consistency with PDF
  useEffect(() => {
    if (resumeId) {
      loadPreview();
    } else {
      // For create mode without resumeId, show placeholder
      setHtmlContent("");
      setError("");
    }
  }, [resumeId]);

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await ResumeApi.previewResume(resumeId);

      // The API returns HTML string directly from unified engine
      setHtmlContent(response);
    } catch (err) {
      console.error("Error loading preview:", err);
      setError("Không thể tải preview. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // No client-side rendering - always use backend unified preview

  if (loading) {
    return (
      <div className="cv-preview cv-preview--loading">
        {!hideHeader && (
          <div className="cv-preview__header">
            <h3 className="cv-preview__title">Xem trước CV</h3>
          </div>
        )}
        <div
          className="cv-preview__content"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "400px",
          }}
        >
          <div className="spinner">Đang tải preview...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cv-preview cv-preview--error">
        {!hideHeader && (
          <div className="cv-preview__header">
            <h3 className="cv-preview__title">Xem trước CV</h3>
          </div>
        )}
        <div
          className="cv-preview__content"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "400px",
          }}
        >
          <p style={{ color: "#ef4444", textAlign: "center" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!htmlContent) {
    return (
      <div className="cv-preview cv-preview--empty">
        {!hideHeader && (
          <div className="cv-preview__header">
            <h3 className="cv-preview__title">Xem trước CV</h3>
          </div>
        )}
        <div
          className="cv-preview__content"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "400px",
          }}
        >
          <p className="muted">Vui lòng tạo CV trước để xem preview</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`cv-preview ${fullscreen ? "cv-preview--fullscreen" : ""}`}
      >
        {!hideHeader && (
          <div className="cv-preview__header">
            <h3 className="cv-preview__title">Xem trước CV</h3>
            <div className="cv-preview__actions">
              <button
                type="button"
                className="btn btn--icon"
                onClick={() => setFullscreen(!fullscreen)}
                title={fullscreen ? "Thoát fullscreen" : "Fullscreen"}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
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
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
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
            <div
              className="cv-preview__html-container"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        </div>

        <div className="cv-preview__footer">
          <p className="cv-preview__footer-note muted small">
            Preview chính xác như CV sẽ được export. Template và styling đã được
            áp dụng.
          </p>
        </div>
      </div>
      {fullscreen && (
        <div
          className="cv-preview__overlay"
          onClick={() => setFullscreen(false)}
        />
      )}
    </>
  );
}

const CVPreview = forwardRef(CVPreviewComponent);

CVPreview.displayName = "CVPreview";

export default CVPreview;
