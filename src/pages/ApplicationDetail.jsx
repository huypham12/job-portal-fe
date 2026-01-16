import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApplicationService, UserService } from "../lib/api.js";
import { isEmployer } from "../auth/auth.js";
import {
  Button,
  Card,
  CardBody,
  Badge,
  Input,
  Textarea,
  Select,
  Modal,
} from "../components/shared";
import ContactCandidateModal from "../components/ContactCandidateModal";
import Timeline from "../components/Timeline";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  APPLICATION_STATUSES,
  normalizeStatus,
} from "../constants/applicationStatuses";
import useSocket from "../hooks/useSocket";
import "../styles/shared.css";
import "./ApplicationDetail.css";

// Dynamic status options based on current application state and stages
const getStatusOptions = (currentStatus, stages) => {
  const options = [];

  // From APPLIED: can go to REVIEWED, INTERVIEWING or REJECTED
  if (currentStatus === APPLICATION_STATUSES.APPLIED) {
    options.push(
      {
        value: APPLICATION_STATUSES.REVIEWED,
        label: STATUS_LABELS[APPLICATION_STATUSES.REVIEWED],
      },
      {
        value: APPLICATION_STATUSES.INTERVIEWING,
        label: STATUS_LABELS[APPLICATION_STATUSES.INTERVIEWING],
      },
      {
        value: APPLICATION_STATUSES.REJECTED,
        label: STATUS_LABELS[APPLICATION_STATUSES.REJECTED],
      }
    );
    return options;
  }

  // From REVIEWED: can go to INTERVIEWING or REJECTED
  if (currentStatus === APPLICATION_STATUSES.REVIEWED) {
    // Allow INTERVIEWING (sẽ tạo stages sau khi chuyển)
    options.push({
      value: APPLICATION_STATUSES.INTERVIEWING,
      label: STATUS_LABELS[APPLICATION_STATUSES.INTERVIEWING],
    });

    // Allow REJECTED
    options.push({
      value: APPLICATION_STATUSES.REJECTED,
      label: STATUS_LABELS[APPLICATION_STATUSES.REJECTED],
    });
    return options;
  }

  // From INTERVIEWING: can go to ACCEPTED or REJECTED
  if (currentStatus === APPLICATION_STATUSES.INTERVIEWING) {
    // Có thể chuyển sang ACCEPTED hoặc REJECTED bất cứ lúc nào
    options.push(
      {
        value: APPLICATION_STATUSES.ACCEPTED,
        label: STATUS_LABELS[APPLICATION_STATUSES.ACCEPTED],
      },
      {
        value: APPLICATION_STATUSES.REJECTED,
        label: STATUS_LABELS[APPLICATION_STATUSES.REJECTED],
      }
    );
    return options;
  }

  // Default fallback - shouldn't happen but just in case
  return options;
};

const STAGE_STATUS_OPTIONS = [
  "pending",
  "scheduled",
  "in_progress",
  "passed",
  "failed",
  "skipped",
  "completed",
];

function formatDate(dateString) {
  if (!dateString) return "--";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--";
  }
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name[0].toUpperCase();
}

/**
 * Download file from URL
 * @param {string} url - File URL
 * @param {string} filename - Filename for download
 */
async function downloadFile(url, filename) {
  try {
    const token = localStorage.getItem("auth_token");
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename || "cv.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Download error:", error);
    // Fallback: open in new tab if download fails
    window.open(url, "_blank");
    throw error;
  }
}

export default function ApplicationDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [stages, setStages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("info");

  // Status management
  const [status, setStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Stage management

  // Notes removed (handled in backend metadata). Frontend UI omitted.

  // Profile modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [fullProfile, setFullProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [isShortlisted, setIsShortlisted] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  // Socket connection for real-time updates
  const { isConnected, onNotification } = useSocket();

  const fetchApplication = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response =
        ApplicationService.getDetailRecruiter && isEmployer()
          ? await ApplicationService.getDetailRecruiter(id)
          : await ApplicationService.getDetail(id);
      const data = response?.data || response;
      console.log("Application data received:", data);
      console.log("Profile data:", data?.profiles);
      setApplication(data);
      setStatus(normalizeStatus(data.status));

      // notes are stored in application.metadata on server; frontend note UI removed

      // Fetch timeline for recruiter (includes all stages) or stages for candidate
      try {
        const stagesResponse = isEmployer()
          ? await ApplicationService.getTimeline(id)
          : await ApplicationService.getStages(id);
        const stagesData =
          stagesResponse?.data?.stages ||
          stagesResponse?.data ||
          stagesResponse ||
          [];
        setStages(stagesData);
      } catch (err) {
        console.error("Failed to fetch stages:", err);
      }

      // Fetch documents (for recruiter)
      if (isEmployer()) {
        try {
          console.log("Fetching documents for application:", id);
          const docsResponse = await ApplicationService.getDocumentsRecruiter(
            id
          );
          console.log("Documents response:", docsResponse);
          const docsData = docsResponse?.data || docsResponse || [];
          console.log("Parsed documents data:", docsData);
          setDocuments(docsData);
        } catch (err) {
          console.error("Failed to fetch documents:", err);
        }
      }
    } catch (err) {
      console.error("Failed to fetch application:", err);
      setError(
        err?.message || "Không thể tải thông tin ứng viên. Vui lòng thử lại."
      );
      if (err?.status === 401) {
        navigate(
          "/login?role=recruiter&redirect=" +
            encodeURIComponent(window.location.pathname)
        );
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  // Listen for real-time updates via Socket.IO
  useEffect(() => {
    if (!isConnected || !id) return;

    onNotification((notification) => {
      const notificationAppId = notification.metadata?.application_id;

      // Reload application when status changes or interview scheduled
      if (
        (notification.type === "application_status_changed" ||
          notification.type === "application_stage_updated" ||
          notification.type === "interview_scheduled" ||
          notification.type === "interview_cancelled" ||
          notification.type === "interview_reminder") &&
        notificationAppId === id
      ) {
        console.log("🔔 Real-time update:", notification.content);
        fetchApplication();
      }
    });
  }, [isConnected, id, onNotification, fetchApplication]);

  const handleUpdateStatus = async () => {
    if (!status) return;

    setUpdatingStatus(true);
    try {
      await ApplicationService.updateStatus(id, {
        status,
        reason: statusReason || undefined,
      });
      alert("Đã cập nhật trạng thái thành công.");

      // If switched to interviewing, prompt to create stages
      if (status === APPLICATION_STATUSES.INTERVIEWING) {
        alert(
          "Ứng dụng đã chuyển sang 'Đang phỏng vấn'. Vui lòng tạo các giai đoạn phỏng vấn bằng cách nhấn 'Thêm stage' bên dưới."
        );
        // Scroll stages area into view
        const el = document.querySelector(".stages-card");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      fetchApplication();
      setStatusReason("");
    } catch (err) {
      alert(err?.message || "Không thể cập nhật trạng thái. Vui lòng thử lại.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Compatible create handler for Timeline (Timeline calls onCreateStage(payload))
  const handleCreateStage = async (payload) => {
    const stagePayload = payload || {};
    if (!stagePayload.stage_name) {
      alert("Vui lòng nhập tên stage.");
      return;
    }

    try {
      const resp = await ApplicationService.createStage(id, stagePayload);
      const created = resp?.data?.data || resp?.data || resp || null;
      if (created) {
        setStages((prev) =>
          Array.isArray(prev) ? [...prev, created] : [created]
        );
      }
      alert("Đã tạo stage thành công.");
      // Refresh full application/timeline in background to stay consistent
      fetchApplication();
      return;
    } catch (err) {
      // If backend complains about duplicate stage_order, try to recover:
      const msg =
        (err && (err.message || (err.data && err.data.message))) || "";
      if (
        String(msg).toLowerCase().includes("stage order") ||
        String(msg).toLowerCase().includes("must be unique") ||
        err?.status === 400
      ) {
        try {
          // Fetch latest stages and compute a safe next order
          const stagesResponse = await ApplicationService.getTimeline(id);
          const stagesData =
            stagesResponse?.data?.stages ||
            stagesResponse?.data ||
            stagesResponse ||
            [];
          const maxOrder =
            stagesData && stagesData.length > 0
              ? Math.max(...stagesData.map((s) => s.stage_order || 0))
              : 0;
          const retryPayload = { ...stagePayload, stage_order: maxOrder + 1 };
          const retryResp = await ApplicationService.createStage(
            id,
            retryPayload
          );
          const created =
            retryResp?.data?.data || retryResp?.data || retryResp || null;
          if (created) {
            setStages((prev) =>
              Array.isArray(prev) ? [...prev, created] : [created]
            );
          }
          alert("Đã tạo stage thành công.");
          fetchApplication();
          return;
        } catch (err2) {
          console.error("Retry create stage failed:", err2);
          alert(err2?.message || "Không thể tạo stage. Vui lòng thử lại.");
          return;
        }
      }

      alert(err?.message || "Không thể tạo stage. Vui lòng thử lại.");
    }
  };

  const handleUpdateStage = async (stageId, data) => {
    try {
      await ApplicationService.updateStage(id, {
        stage_id: stageId,
        ...data,
      });
      alert("Đã cập nhật stage thành công.");
      fetchApplication();
    } catch (err) {
      alert(err?.message || "Không thể cập nhật stage. Vui lòng thử lại.");
    }
  };

  // handleAddNote removed - notes UI has been removed from frontend

  const handleDownloadCV = async () => {
    try {
      const response = await ApplicationService.getCVRecruiter(id);
      const data = response?.data || response;
      const resume = data?.resume || data;
      const fileUrl = resume?.file_url || data?.file_url;

      if (!fileUrl) {
        alert("CV không có sẵn để tải xuống.");
        return;
      }

      // Get filename from resume title or use default
      const filename = resume?.title
        ? `${resume.title}.pdf`
        : `CV_${
            application?.profiles?.full_name || "candidate"
          }_${new Date().getTime()}.pdf`;

      // Show loading indicator
      const downloadBtn = document.querySelector("[data-download-cv]");
      if (downloadBtn) {
        downloadBtn.disabled = true;
        downloadBtn.textContent = "Đang tải...";
      }

      await downloadFile(fileUrl, filename);

      if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.textContent = "Tải CV";
      }
    } catch (err) {
      console.error("Download CV error:", err);
      alert(err?.message || "Không thể tải CV. Vui lòng thử lại.");
    }
  };

  const handleViewFullProfile = async () => {
    const profileId = application?.profiles?.id || application?.profile_id;
    if (!profileId) {
      alert("Không tìm thấy thông tin profile.");
      return;
    }

    setShowProfileModal(true);
    setLoadingProfile(true);
    try {
      const response = await UserService.getPublicProfile(profileId);
      // API trả về { success, message, data }
      const data = response?.data?.data || response?.data || response;
      // Lưu profile (dù rỗng) và giữ modal mở
      setFullProfile(data || {});
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      alert(
        err?.message || "Không thể tải thông tin profile. Vui lòng thử lại."
      );
      setShowProfileModal(false);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleViewCV = async () => {
    try {
      const response = await ApplicationService.getCVRecruiter(id);
      const data = response?.data || response;
      const resume = data?.resume || data;
      const fileUrl = resume?.file_url || data?.file_url;

      if (fileUrl) {
        // Mở CV trực tiếp trong tab mới
        window.open(fileUrl, "_blank");
      } else {
        alert("CV không có sẵn để xem.");
      }
    } catch (err) {
      console.error("Failed to get CV:", err);
      alert(err?.message || "Không thể lấy thông tin CV. Vui lòng thử lại.");
    }
  };

  const handleShortlistToggle = async () => {
    const action = isShortlisted ? "remove" : "add";

    try {
      await ApplicationService.shortlistCandidate({
        application_id: id,
        action: action,
      });

      setIsShortlisted(!isShortlisted);
      const message =
        action === "add" ? "Đã thêm vào shortlist" : "Đã bỏ khỏi shortlist";
      console.log(message);
    } catch (err) {
      alert(err?.message || "Không thể cập nhật shortlist. Vui lòng thử lại.");
    }
  };

  // Notes UI removed from frontend; backend still stores notes in application.metadata

  if (loading) {
    return (
      <div
        className="section application-detail-page"
        role="status"
        aria-label="Đang tải thông tin ứng viên"
      >
        <Card padding="large">
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div aria-hidden="true">Đang tải...</div>
            <div className="loading-spinner" aria-hidden="true"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section application-detail-page">
        <Card
          padding="medium"
          style={{ background: "#fee", border: "1px solid #fcc" }}
        >
          <p style={{ color: "#c00", margin: 0 }}>{error}</p>
          <Button
            variant="outline"
            onClick={fetchApplication}
            style={{ marginTop: "12px" }}
          >
            Thử lại
          </Button>
        </Card>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="section application-detail-page">
        <Card padding="large">
          <div style={{ textAlign: "center" }}>
            <p>Không tìm thấy thông tin ứng viên.</p>
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              style={{ marginTop: "12px" }}
            >
              Quay lại
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const profile =
    application.profiles ||
    application.candidate?.profile ||
    application.candidate ||
    {};
  const name =
    profile.full_name || profile.display_name || profile.name || "Chưa có tên";
  const job = application.jobs || {};
  const currentStatus = normalizeStatus(application.status);

  console.log("Parsed profile:", profile);
  console.log("Profile years_of_experience:", profile.years_of_experience);
  console.log("Profile location_text:", profile.location_text);
  console.log("Profile desired_job_title:", profile.desired_job_title);
  // Friendly helper message for status management area
  const statusHelperMessage = (() => {
    if (currentStatus === APPLICATION_STATUSES.APPLIED) {
      return "👀 Xem xét đơn ứng tuyển và chuyển sang 'Đã xem' hoặc từ chối nếu không phù hợp.";
    }
    if (currentStatus === APPLICATION_STATUSES.REVIEWED) {
      return "💡 Chọn 'Đang phỏng vấn' để bắt đầu quy trình phỏng vấn và thêm các giai đoạn tuyển dụng.";
    }
    if (
      currentStatus === APPLICATION_STATUSES.INTERVIEWING &&
      (!stages || stages.length === 0)
    ) {
      return "🎯 Thêm các giai đoạn phỏng vấn để bắt đầu quy trình tuyển dụng.";
    }
    if (currentStatus === APPLICATION_STATUSES.INTERVIEWING) {
      return "✅ Có thể chấp nhận hoặc từ chối ứng viên bất cứ lúc nào trong quá trình phỏng vấn.";
    }
    if (
      [
        APPLICATION_STATUSES.ACCEPTED,
        APPLICATION_STATUSES.REJECTED,
        APPLICATION_STATUSES.WITHDRAWN,
      ].includes(currentStatus)
    ) {
      if (currentStatus === APPLICATION_STATUSES.ACCEPTED) {
        return "🎉 Quy trình đã hoàn tất — ứng viên đã được chấp nhận.";
      }
      if (currentStatus === APPLICATION_STATUSES.REJECTED) {
        return "❌ Quy trình đã hoàn tất — ứng viên đã bị từ chối.";
      }
      return "📝 Quy trình đã kết thúc.";
    }
    return "⚠️ Không có trạng thái nào khả thi để chuyển tiếp.";
  })();

  return (
    <div className="section application-detail-page">
      <div className="application-header">
        <div className="breadcrumb">
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "none",
              border: "none",
              color: "#2563eb",
              cursor: "pointer",
            }}
          >
            ← Quay lại
          </button>
        </div>
        <div className="candidate-header-info">
          <div className="candidate-avatar-large">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={name} />
            ) : (
              <span>{getInitials(name)}</span>
            )}
          </div>
          <div>
            <h1 className="candidate-name-large">{name}</h1>
            {profile.headline && (
              <p className="candidate-headline-large">{profile.headline}</p>
            )}
            <Badge
              variant={STATUS_COLORS[currentStatus] || "default"}
              size="medium"
              style={{ marginTop: "8px" }}
            >
              {STATUS_LABELS[currentStatus] || currentStatus}
            </Badge>
            <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
              <Button
                variant={isShortlisted ? "primary" : "outline"}
                size="small"
                onClick={handleShortlistToggle}
              >
                {isShortlisted ? "★ Đã shortlist" : "☆ Thêm vào shortlist"}
              </Button>
              <Button
                variant="outline"
                size="small"
                onClick={() => setShowContactModal(true)}
              >
                📧 Liên hệ
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="application-content">
        {/* Left Column - Candidate Info */}
        <div className="application-left">
          {/* Profile Card */}
          <Card padding="medium" className="profile-card">
            <h2 className="section-title">Thông tin ứng viên</h2>
            <div className="profile-info">
              {profile.years_of_experience !== null &&
                profile.years_of_experience !== undefined && (
                  <div className="info-item">
                    <span className="info-label">Kinh nghiệm:</span>
                    {Number(profile.years_of_experience) === 0 ? (
                      <span>Chưa có kinh nghiệm</span>
                    ) : (
                      <span>{profile.years_of_experience} năm</span>
                    )}
                  </div>
                )}
              {profile.location_text && (
                <div className="info-item">
                  <span className="info-label">Địa điểm:</span>
                  <span>{profile.location_text}</span>
                </div>
              )}
              {profile.desired_job_title && (
                <div className="info-item">
                  <span className="info-label">Vị trí mong muốn:</span>
                  <span>{profile.desired_job_title}</span>
                </div>
              )}
              {(profile.years_of_experience === null ||
                profile.years_of_experience === undefined) &&
                !profile.location_text &&
                !profile.desired_job_title && (
                  <div className="info-item">
                    <span style={{ color: "#94a3b8", fontStyle: "italic" }}>
                      Chưa có thông tin bổ sung
                    </span>
                  </div>
                )}
            </div>
            {profile.skills && profile.skills.length > 0 && (
              <div className="skills-section">
                <h3 className="subsection-title">Kỹ năng</h3>
                <div className="skills-list">
                  {profile.skills.slice(0, 10).map((skill, idx) => (
                    <Badge key={idx} variant="default" size="small">
                      {skill.skills?.name || skill.name || skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div style={{ marginTop: "16px" }}>
              <Button
                variant="outline"
                size="small"
                onClick={handleViewFullProfile}
              >
                Xem profile đầy đủ
              </Button>
            </div>
          </Card>

          {/* CV Section */}
          <Card padding="medium" className="cv-card">
            <h2 className="section-title">CV / Resume</h2>
            <div className="cv-info">
              <p style={{ color: "#64748b", margin: "0 0 12px 0" }}>
                {application.resumes ? "CV đã được đính kèm" : "Chưa có CV"}
              </p>
              {application.resumes && (
                <div className="cv-actions">
                  <Button
                    variant="default"
                    size="small"
                    onClick={handleDownloadCV}
                    data-download-cv
                  >
                    Tải CV
                  </Button>
                  <Button variant="outline" size="small" onClick={handleViewCV}>
                    Xem CV
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Additional Documents Section */}
          <Card padding="medium" className="documents-card">
            <h2 className="section-title">Tài liệu bổ sung</h2>
            {documents.length === 0 ? (
              <p style={{ color: "#94a3b8", margin: "12px 0" }}>
                Ứng viên chưa tải lên tài liệu bổ sung nào.
              </p>
            ) : (
              <div className="documents-list">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="document-item"
                    style={{
                      padding: "12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      marginBottom: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, marginBottom: "4px" }}>
                        {doc.document_type || "Tài liệu"}
                      </div>
                      <div style={{ fontSize: "13px", color: "#64748b" }}>
                        {formatDate(doc.created_at)}
                      </div>
                    </div>
                    {doc.file_url && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <Button
                          variant="outline"
                          size="small"
                          onClick={() => window.open(doc.file_url, "_blank")}
                        >
                          Xem
                        </Button>
                        <Button
                          variant="outline"
                          size="small"
                          onClick={() =>
                            downloadFile(
                              doc.file_url,
                              `${doc.document_type || "document"}_${
                                application?.profiles?.full_name || "candidate"
                              }.pdf`
                            )
                          }
                        >
                          Tải xuống
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Application Info */}
          <Card padding="medium" className="application-info-card">
            <h2 className="section-title">Thông tin đơn ứng tuyển</h2>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Ngày ứng tuyển:</span>
                <span>{formatDate(application.applied_at)}</span>
              </div>
              {job.title && (
                <div className="info-item">
                  <span className="info-label">Vị trí:</span>
                  <span>{job.title}</span>
                </div>
              )}
              <div className="info-item">
                <span className="info-label">Stage hiện tại:</span>
                <span>
                  {(() => {
                    // Try to get current_stage from application data
                    if (application.current_stage?.stage_name) {
                      return application.current_stage.stage_name;
                    }

                    // If not available, find from stages array
                    // Priority: in_progress > pending > scheduled > first stage
                    if (stages && stages.length > 0) {
                      const inProgressStage = stages.find(
                        (s) => s.status === "in_progress"
                      );
                      if (inProgressStage) return inProgressStage.stage_name;

                      const pendingStage = stages.find(
                        (s) => s.status === "pending"
                      );
                      if (pendingStage) return pendingStage.stage_name;

                      const scheduledStage = stages.find(
                        (s) => s.status === "scheduled"
                      );
                      if (scheduledStage) return scheduledStage.stage_name;

                      // Return first stage by order
                      const sortedStages = [...stages].sort(
                        (a, b) => (a.stage_order || 0) - (b.stage_order || 0)
                      );
                      if (sortedStages.length > 0)
                        return sortedStages[0].stage_name;
                    }

                    return "--";
                  })()}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Management */}
        <div className="application-right">
          {/* Status Management */}
          <Card padding="medium" className="status-card">
            <h2 className="section-title">Quản lý trạng thái</h2>
            <div className="status-form">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={getStatusOptions(currentStatus, stages)}
                style={{ marginBottom: "12px" }}
              />
              {getStatusOptions(currentStatus, stages).length <= 1 && (
                <div
                  style={{
                    padding: "8px",
                    backgroundColor: "#fef3c7",
                    border: "1px solid #f59e0b",
                    borderRadius: "4px",
                    marginBottom: "12px",
                    fontSize: "14px",
                    color: "#92400e",
                  }}
                >
                  {statusHelperMessage}
                </div>
              )}
              {status === APPLICATION_STATUSES.REJECTED && (
                <Textarea
                  placeholder="Lý do từ chối (tùy chọn)"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  rows={3}
                  style={{ marginBottom: "12px" }}
                />
              )}
              <Button
                variant="primary"
                onClick={handleUpdateStatus}
                disabled={updatingStatus || status === currentStatus}
                style={{ width: "100%" }}
              >
                {updatingStatus ? "Đang cập nhật..." : "Cập nhật trạng thái"}
              </Button>
            </div>
          </Card>

          {/* Stages Timeline - Only show when in INTERVIEWING status */}
          {currentStatus === APPLICATION_STATUSES.INTERVIEWING && (
            <Card padding="medium" className="stages-card">
              <Timeline
                stages={stages}
                onUpdateStage={handleUpdateStage}
                onCreateStage={handleCreateStage}
                applicationId={id}
                candidateName={name}
                jobTitle={job?.title}
              />
            </Card>
          )}

          {/* Notes removed from frontend (stored in application.metadata on server) */}
        </div>
      </div>

      {/* Profile Modal */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setFullProfile(null);
        }}
        style={{ maxWidth: "800px", maxHeight: "90vh", overflow: "auto" }}
      >
        <div style={{ padding: "20px" }}>
          <h2 style={{ marginTop: 0, marginBottom: "24px" }}>Profile đầy đủ</h2>

          {loadingProfile ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p>Đang tải...</p>
            </div>
          ) : fullProfile ? (
            <div className="full-profile-content">
              {/* Header */}
              <div className="profile-modal-header">
                <div className="candidate-avatar-large">
                  {fullProfile.avatar_url ? (
                    <img
                      src={fullProfile.avatar_url}
                      alt={fullProfile.full_name}
                    />
                  ) : (
                    <span>{getInitials(fullProfile.full_name)}</span>
                  )}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "24px" }}>
                    {fullProfile.full_name || "Chưa có tên"}
                  </h3>
                  {fullProfile.headline && (
                    <p style={{ margin: "8px 0 0 0", color: "#64748b" }}>
                      {fullProfile.headline}
                    </p>
                  )}
                  {fullProfile.bio && (
                    <p style={{ margin: "12px 0 0 0", color: "#475569" }}>
                      {fullProfile.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="profile-section">
                <h4 className="profile-section-title">Thông tin cơ bản</h4>
                <div className="profile-info-grid">
                  {fullProfile.years_of_experience !== null &&
                    fullProfile.years_of_experience !== undefined && (
                      <div className="info-item">
                        <span className="info-label">Kinh nghiệm:</span>
                        {Number(fullProfile.years_of_experience) === 0 ? (
                          <span>Chưa có kinh nghiệm</span>
                        ) : (
                          <span>{fullProfile.years_of_experience} năm</span>
                        )}
                      </div>
                    )}
                  {fullProfile.location_text && (
                    <div className="info-item">
                      <span className="info-label">Địa điểm:</span>
                      <span>{fullProfile.location_text}</span>
                    </div>
                  )}
                  {fullProfile.desired_job_title && (
                    <div className="info-item">
                      <span className="info-label">Vị trí mong muốn:</span>
                      <span>{fullProfile.desired_job_title}</span>
                    </div>
                  )}
                  {fullProfile.desired_salary_min !== null &&
                    fullProfile.desired_salary_min !== undefined && (
                      <div className="info-item">
                        <span className="info-label">Mức lương mong muốn:</span>
                        <span>
                          {Number(
                            fullProfile.desired_salary_min
                          ).toLocaleString("vi-VN")}{" "}
                          {fullProfile.desired_currency || "VND"}
                        </span>
                      </div>
                    )}
                  {Array.isArray(fullProfile.desired_job_type) &&
                    fullProfile.desired_job_type.length > 0 && (
                      <div className="info-item">
                        <span className="info-label">Loại công việc:</span>
                        <span>{fullProfile.desired_job_type.join(", ")}</span>
                      </div>
                    )}
                  {fullProfile.personal_website && (
                    <div className="info-item">
                      <span className="info-label">Website:</span>
                      <a
                        href={fullProfile.personal_website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {fullProfile.personal_website}
                      </a>
                    </div>
                  )}
                  {fullProfile.linkedin_url && (
                    <div className="info-item">
                      <span className="info-label">LinkedIn:</span>
                      <a
                        href={fullProfile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {fullProfile.linkedin_url}
                      </a>
                    </div>
                  )}
                  {fullProfile.github_url && (
                    <div className="info-item">
                      <span className="info-label">GitHub:</span>
                      <a
                        href={fullProfile.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {fullProfile.github_url}
                      </a>
                    </div>
                  )}
                  {(fullProfile.years_of_experience === null ||
                    fullProfile.years_of_experience === undefined) &&
                    !fullProfile.location_text &&
                    !fullProfile.desired_job_title &&
                    (fullProfile.desired_salary_min === null ||
                      fullProfile.desired_salary_min === undefined) &&
                    (!Array.isArray(fullProfile.desired_job_type) ||
                      fullProfile.desired_job_type.length === 0) &&
                    !fullProfile.personal_website &&
                    !fullProfile.linkedin_url &&
                    !fullProfile.github_url && (
                      <div className="info-item">
                        <span style={{ color: "#94a3b8", fontStyle: "italic" }}>
                          Chưa có thông tin cơ bản
                        </span>
                      </div>
                    )}
                </div>
              </div>

              {/* Skills */}
              {Array.isArray(fullProfile.skills) &&
                fullProfile.skills.length > 0 && (
                  <div className="profile-section">
                    <h4 className="profile-section-title">Kỹ năng</h4>
                    <div className="skills-list">
                      {fullProfile.skills.map((skill, idx) => (
                        <Badge key={idx} variant="default" size="small">
                          {skill.skills?.name || skill.name || skill}
                          {skill.proficiency && ` (${skill.proficiency}/5)`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              {(!Array.isArray(fullProfile.skills) ||
                fullProfile.skills.length === 0) && (
                <div className="profile-section">
                  <h4 className="profile-section-title">Kỹ năng</h4>
                  <p style={{ color: "#94a3b8" }}>Chưa cập nhật kỹ năng</p>
                </div>
              )}

              {/* Experiences */}
              {Array.isArray(fullProfile.experiences) &&
                fullProfile.experiences.length > 0 && (
                  <div className="profile-section">
                    <h4 className="profile-section-title">
                      Kinh nghiệm làm việc
                    </h4>
                    <div className="experiences-list">
                      {fullProfile.experiences.map((exp, idx) => (
                        <div key={idx} className="experience-item">
                          <h5 style={{ margin: "0 0 8px 0" }}>
                            {exp.position} tại {exp.company_name}
                          </h5>
                          <p
                            style={{
                              margin: "0 0 8px 0",
                              color: "#64748b",
                              fontSize: "14px",
                            }}
                          >
                            {formatDate(exp.start_date)} -{" "}
                            {exp.is_current
                              ? "Hiện tại"
                              : formatDate(exp.end_date)}
                          </p>
                          {exp.description && (
                            <p
                              style={{ margin: "8px 0 0 0", color: "#475569" }}
                            >
                              {exp.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              {(!Array.isArray(fullProfile.experiences) ||
                fullProfile.experiences.length === 0) && (
                <div className="profile-section">
                  <h4 className="profile-section-title">
                    Kinh nghiệm làm việc
                  </h4>
                  <p style={{ color: "#94a3b8" }}>
                    Chưa có kinh nghiệm được thêm
                  </p>
                </div>
              )}

              {/* Educations */}
              {Array.isArray(fullProfile.educations) &&
                fullProfile.educations.length > 0 && (
                  <div className="profile-section">
                    <h4 className="profile-section-title">Học vấn</h4>
                    <div className="educations-list">
                      {fullProfile.educations.map((edu, idx) => (
                        <div key={idx} className="education-item">
                          <h5 style={{ margin: "0 0 8px 0" }}>
                            {edu.school_name}
                          </h5>
                          {edu.degree && (
                            <p
                              style={{
                                margin: "0 0 4px 0",
                                color: "#64748b",
                                fontSize: "14px",
                              }}
                            >
                              {edu.degree}{" "}
                              {edu.field_of_study && `- ${edu.field_of_study}`}
                            </p>
                          )}
                          <p
                            style={{
                              margin: "0",
                              color: "#64748b",
                              fontSize: "14px",
                            }}
                          >
                            {formatDate(edu.start_date)} -{" "}
                            {edu.end_date
                              ? formatDate(edu.end_date)
                              : "Hiện tại"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              {(!Array.isArray(fullProfile.educations) ||
                fullProfile.educations.length === 0) && (
                <div className="profile-section">
                  <h4 className="profile-section-title">Học vấn</h4>
                  <p style={{ color: "#94a3b8" }}>Chưa có thông tin học vấn</p>
                </div>
              )}

              {/* Certifications */}
              {Array.isArray(fullProfile.certifications) &&
                fullProfile.certifications.length > 0 && (
                  <div className="profile-section">
                    <h4 className="profile-section-title">Chứng chỉ</h4>
                    <div className="certifications-list">
                      {fullProfile.certifications.map((cert, idx) => (
                        <div key={idx} className="certification-item">
                          <h5 style={{ margin: "0 0 8px 0" }}>{cert.name}</h5>
                          <p
                            style={{
                              margin: "0 0 4px 0",
                              color: "#64748b",
                              fontSize: "14px",
                            }}
                          >
                            {cert.issuing_org} - {formatDate(cert.issue_date)}
                          </p>
                          {cert.description && (
                            <p
                              style={{ margin: "8px 0 0 0", color: "#475569" }}
                            >
                              {cert.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              {(!Array.isArray(fullProfile.certifications) ||
                fullProfile.certifications.length === 0) && (
                <div className="profile-section">
                  <h4 className="profile-section-title">Chứng chỉ</h4>
                  <p style={{ color: "#94a3b8" }}>Chưa có chứng chỉ</p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p>Không tìm thấy thông tin profile.</p>
            </div>
          )}

          <div className="modal-actions" style={{ marginTop: "24px" }}>
            <Button
              variant="outline"
              onClick={() => {
                setShowProfileModal(false);
                setFullProfile(null);
              }}
            >
              Đóng
            </Button>
          </div>
        </div>
      </Modal>

      {/* Contact Candidate Modal */}
      <ContactCandidateModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        applicationId={id}
        candidateName={name}
        jobTitle={job?.title}
        companyName={job?.companies?.name || job?.company?.name}
      />
    </div>
  );
}
