import { useEffect, useMemo, useState } from "react";
import SimpleModal from "../Modal.jsx";
import { ResumeApi } from "../../services/resumeApi";
import { ApplicationService } from "../../lib/api";
import "./ApplyDrawer.css";

/**
 * Drawer modal to let candidate pick/upload resume and apply to a job.
 */
export default function ApplyDrawer({
  open,
  onClose,
  jobId,
  jobTitle,
  onSubmitted,
}) {
  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [selectedResume, setSelectedResume] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [applicationData, setApplicationData] = useState(null);

  const fetchResumes = async () => {
    setLoadingResumes(true);
    setError("");
    try {
      const data = await ResumeApi.getResumes();
      const list = Array.isArray(data) ? data : data?.data || [];
      setResumes(list);
      const defaultResume = list.find((r) => r.is_default);
      if (defaultResume) {
        setSelectedResume(defaultResume.id);
      } else if (list.length > 0) {
        setSelectedResume(list[0].id);
      }
    } catch (err) {
      setError(err?.message || "Không thể tải danh sách CV. Vui lòng thử lại.");
      setResumes([]);
    } finally {
      setLoadingResumes(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchResumes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      await ResumeApi.uploadResume(file, {
        title: file.name,
        auto_parse: true,
        is_default: resumes.length === 0,
      });
      await fetchResumes();
    } catch (err) {
      setError(err?.message || "Tải CV thất bại. Vui lòng thử lại.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jobId) {
      setError("Thiếu thông tin job.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await ApplicationService.create({
        job_id: jobId,
        resume_id: selectedResume || undefined,
        metadata: note ? { note } : undefined,
      });

      // Show success modal
      setApplicationData({
        jobTitle,
        resumeTitle: selectedResumeObj?.title,
        isProfileCV: false, // Backend đã xử lý PDF generation
      });
      setShowSuccessModal(true);

      if (onSubmitted) {
        onSubmitted();
      }
    } catch (err) {
      if (err?.status === 401) {
        setError("Bạn cần đăng nhập tài khoản Người tìm việc để ứng tuyển.");
      } else if (err?.status === 403) {
        setError(
          "Bạn không có quyền ứng tuyển. Hãy đăng nhập đúng vai trò Người tìm việc hoặc kiểm tra token."
        );
      } else {
        setError(
          err?.data?.message || err?.message || "Không thể gửi ứng tuyển."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedResumeObj = useMemo(
    () => resumes.find((r) => r.id === selectedResume),
    [resumes, selectedResume]
  );

  const isProfileBasedCV =
    selectedResumeObj?.source_type === "created" &&
    !selectedResumeObj?.file_url;

  return (
    <SimpleModal open={open} onClose={onClose} noWrapper>
      <div className="apply-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="apply-drawer__header">
          <div>
            <div className="muted small">Ứng tuyển</div>
            <h3 className="apply-drawer__title">{jobTitle || "Công việc"}</h3>
          </div>
          <button className="btn ghost" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>

        <form className="apply-drawer__body" onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="form-label">
              Chọn CV
              <span className="muted small">
                Chúng tôi sẽ gửi CV này cho nhà tuyển dụng
              </span>
            </div>
            {loadingResumes ? (
              <div className="muted">Đang tải CV...</div>
            ) : resumes.length === 0 ? (
              <div className="empty-box">
                <p className="muted" style={{ marginBottom: 8 }}>
                  Bạn chưa có CV nào.
                </p>
                <label className="btn primary">
                  Tải CV lên
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleUpload}
                    hidden
                  />
                </label>
              </div>
            ) : (
              <>
                {/* Info box khi chọn CV từ profile */}
                {isProfileBasedCV && (
                  <div
                    className="info-box"
                    style={{
                      padding: "12px 16px",
                      background: "#eff6ff",
                      border: "1px solid #3b82f6",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      style={{ flexShrink: 0, marginTop: "2px" }}
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "#1e40af",
                          marginBottom: "4px",
                        }}
                      >
                        CV từ hồ sơ
                      </div>
                      <div style={{ fontSize: "14px", color: "#1e3a8a" }}>
                        CV này sẽ được tự động chuyển đổi sang PDF khi bạn gửi
                        ứng tuyển. Quá trình này có thể mất vài giây.
                      </div>
                    </div>
                  </div>
                )}

                <div className="resume-grid">
                  {resumes.map((resume) => {
                    const isProfileCV =
                      resume.source_type === "created" && !resume.file_url;

                    return (
                      <label
                        key={resume.id}
                        className={`resume-card ${
                          selectedResume === resume.id ? "active" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="resume"
                          value={resume.id}
                          checked={selectedResume === resume.id}
                          onChange={() => setSelectedResume(resume.id)}
                        />
                        <div className="resume-card__content">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: "4px",
                              flexWrap: "wrap",
                            }}
                          >
                            <div className="resume-card__title">
                              {resume.title || "CV không tên"}
                            </div>
                            {isProfileCV && (
                              <span
                                className="badge"
                                style={{
                                  background: "#eff6ff",
                                  color: "#3b82f6",
                                  fontSize: "11px",
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                }}
                              >
                                Từ hồ sơ
                              </span>
                            )}
                            {resume.is_default && (
                              <span className="badge">Mặc định</span>
                            )}
                          </div>
                          <div className="muted small">
                            {resume.status || resume.updated_at
                              ? `Cập nhật: ${new Date(
                                  resume.updated_at || resume.created_at
                                ).toLocaleDateString("vi-VN")}`
                              : "Chưa rõ"}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
            <div className="inline-actions">
              <label className="btn ghost small">
                {uploading ? "Đang tải..." : "Tải CV mới"}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleUpload}
                  hidden
                  disabled={uploading}
                />
              </label>
              <a className="muted small" href="/resumes" onClick={onClose}>
                Quản lý CV
              </a>
            </div>
          </div>

          <div className="form-group">
            <div className="form-label">
              Ghi chú tới nhà tuyển dụng (tuỳ chọn)
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Thời gian phỏng vấn phù hợp, portfolio..."
              rows={3}
            />
          </div>

          {selectedResumeObj?.file_url && (
            <div className="muted small">
              CV được gửi: {selectedResumeObj.title || "CV"}
            </div>
          )}

          {error && (
            <div className="error-box">
              <p>{error}</p>
            </div>
          )}

          <div className="apply-drawer__footer">
            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={submitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={
                submitting ||
                loadingResumes ||
                (resumes.length === 0 && uploading)
              }
            >
              {submitting ? "Đang xử lý..." : "Gửi ứng tuyển"}
            </button>
          </div>
        </form>
      </div>

      {/* Success modal */}
      {showSuccessModal && (
        <SimpleModal
          open={true}
          onClose={() => {
            setShowSuccessModal(false);
            onClose?.();
          }}
          noWrapper
        >
          <div
            style={{
              padding: "32px",
              background: "white",
              borderRadius: "12px",
              maxWidth: "400px",
              textAlign: "center",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                margin: "0 auto 16px",
                background: "#dcfce7",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#16a34a"
                strokeWidth="3"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: "20px",
                fontWeight: 600,
                color: "#0f172a",
              }}
            >
              Ứng tuyển thành công!
            </h3>
            <p
              style={{ margin: "0 0 16px", color: "#64748b", fontSize: "14px" }}
            >
              Đơn ứng tuyển của bạn đã được gửi đến nhà tuyển dụng.
            </p>
            <button
              className="btn primary"
              onClick={() => {
                setShowSuccessModal(false);
                onClose?.();
              }}
              style={{ width: "100%" }}
            >
              Đóng
            </button>
          </div>
        </SimpleModal>
      )}
    </SimpleModal>
  );
}
