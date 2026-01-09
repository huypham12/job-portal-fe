import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { JobService, ApplicationService } from "../lib/api.js";
import { ResumeApi } from "../services/resumeApi.js";

export default function ApplyJob() {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [selectedResume, setSelectedResume] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Load job details
  useEffect(() => {
    const loadJob = async () => {
      try {
        setLoadingJob(true);
        setError("");
        const jobData = await JobService.getById(jobId);
        setJob(jobData);
      } catch (err) {
        setError("Không thể tải thông tin công việc. Vui lòng thử lại.");
        console.error("Failed to load job:", err);
      } finally {
        setLoadingJob(false);
      }
    };

    if (jobId) {
      loadJob();
    }
  }, [jobId]);

  // Load user's resumes
  const loadResumes = useCallback(async () => {
    try {
      setLoadingResumes(true);
      setError("");
      const data = await ResumeApi.getResumes();
      const list = Array.isArray(data) ? data : data?.data || [];
      setResumes(list);

      // Auto-select default resume or first resume
      const defaultResume = list.find((r) => r.is_default);
      if (defaultResume) {
        setSelectedResume(defaultResume.id);
      } else if (list.length > 0) {
        setSelectedResume(list[0].id);
      }
    } catch (err) {
      setError("Không thể tải danh sách CV. Vui lòng thử lại.");
      console.error("Failed to load resumes:", err);
    } finally {
      setLoadingResumes(false);
    }
  }, []);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setError("");

      const uploadResult = await ResumeApi.uploadResume(file, {
        title: file.name,
        auto_parse: true,
        is_default: false,
      });

      // Reload resumes to include the new one
      await loadResumes();

      // Select the newly uploaded resume
      if (uploadResult?.id) {
        setSelectedResume(uploadResult.id);
      }
    } catch (err) {
      setError("Không thể tải CV lên. Vui lòng thử lại.");
      console.error("Failed to upload resume:", err);
    } finally {
      setUploading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedResume) {
      setError("Vui lòng chọn CV để ứng tuyển.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const applicationData = {
        job_id: jobId,
        resume_id: selectedResume,
        cover_letter: coverLetter.trim() || undefined,
      };

      const result = await ApplicationService.create(applicationData);

      setSuccess(true);

      // Navigate to applications list after a short delay
      setTimeout(() => {
        navigate("/applications");
      }, 2000);
    } catch (err) {
      if (err?.status === 401) {
        setError("Bạn cần đăng nhập tài khoản Người tìm việc để ứng tuyển.");
      } else if (err?.status === 403) {
        setError(
          "Bạn không có quyền ứng tuyển. Hãy đăng nhập đúng vai trò Người tìm việc."
        );
      } else if (err?.status === 409) {
        setError("Bạn đã ứng tuyển công việc này rồi.");
      } else {
        setError(
          err?.data?.message ||
            err?.message ||
            "Không thể gửi ứng tuyển. Vui lòng thử lại."
        );
      }
      console.error("Failed to submit application:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingJob) {
    return (
      <div className="section">
        <div className="card">
          <p>Đang tải thông tin công việc...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="section">
        <h2>Không tìm thấy công việc</h2>
        <Link to="/search" className="btn">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="section">
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
          <h2 style={{ marginTop: 0, color: "#22c55e" }}>
            Ứng tuyển thành công!
          </h2>
          <p>
            Bạn đã gửi CV thành công. Nhà tuyển dụng sẽ xem xét và liên hệ với
            bạn sớm.
          </p>
          <p style={{ fontSize: "14px", color: "#666" }}>
            Đang chuyển hướng...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="card">
        <div style={{ marginBottom: "24px" }}>
          <Link
            to={`/search/${job.id}`}
            style={{ color: "#666", textDecoration: "none" }}
          >
            ← Quay lại chi tiết công việc
          </Link>
        </div>

        <h2 style={{ marginTop: 0 }}>Ứng tuyển: {job.title}</h2>
        <div className="muted" style={{ marginBottom: "24px" }}>
          {job.company?.name} • {job.location?.name}
        </div>

        {error && (
          <div
            style={{
              padding: "12px",
              backgroundColor: "#fee",
              border: "1px solid #fcc",
              borderRadius: "4px",
              marginBottom: "16px",
              color: "#c00",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
          {/* Resume Selection */}
          <div className="field">
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "500",
              }}
            >
              Chọn CV <span style={{ color: "red" }}>*</span>
            </label>
            <span
              style={{
                fontSize: "14px",
                color: "#666",
                display: "block",
                marginBottom: "12px",
              }}
            >
              CV này sẽ được gửi cho nhà tuyển dụng
            </span>

            {loadingResumes ? (
              <div className="muted">Đang tải CV...</div>
            ) : resumes.length === 0 ? (
              <div
                style={{
                  padding: "20px",
                  border: "2px dashed #ddd",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <p style={{ marginBottom: "12px", color: "#666" }}>
                  Bạn chưa có CV nào.
                </p>
                <label className="btn primary" style={{ cursor: "pointer" }}>
                  {uploading ? "Đang tải lên..." : "Tải CV lên"}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    hidden
                    disabled={uploading}
                  />
                </label>
              </div>
            ) : (
              <div>
                <select
                  value={selectedResume}
                  onChange={(e) => setSelectedResume(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                >
                  <option value="">Chọn CV</option>
                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.title} {resume.is_default ? "(Mặc định)" : ""}
                    </option>
                  ))}
                </select>

                <div style={{ marginTop: "12px" }}>
                  <label
                    className="btn"
                    style={{ cursor: "pointer", fontSize: "14px" }}
                  >
                    Hoặc tải CV mới lên
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      hidden
                      disabled={uploading}
                    />
                  </label>
                  {uploading && (
                    <span style={{ marginLeft: "8px", color: "#666" }}>
                      Đang tải lên...
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cover Letter */}
          <div className="field">
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "500",
              }}
            >
              Thư xin việc (tuỳ chọn)
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Viết một đoạn giới thiệu ngắn về bản thân và lý do bạn muốn ứng tuyển công việc này..."
              rows={4}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                resize: "vertical",
              }}
            />
          </div>

          {/* Submit Button */}
          <div style={{ display: "flex", gap: 10, marginTop: "24px" }}>
            <Link to={`/search/${job.id}`} className="btn">
              ← Xem chi tiết
            </Link>
            <button
              type="submit"
              className="btn primary"
              disabled={submitting || !selectedResume}
            >
              {submitting ? "Đang gửi..." : "Gửi ứng tuyển"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
