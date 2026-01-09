import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApplicationService } from "../lib/api";
import {
  STATUS_LABELS,
  APPLICATION_STATUSES,
  normalizeStatus,
} from "../constants/applicationStatuses";
import { useSocket } from "../hooks/useSocket";
import "./MyApplicationDetail.css";

function formatDate(dateString) {
  if (!dateString) return "--";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "--";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MyApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [stages, setStages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [withdrawing, setWithdrawing] = useState(false);
  const [docType, setDocType] = useState("");

  // Socket connection for real-time updates
  const { isConnected, onNotification } = useSocket();

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await ApplicationService.getDetail(id);
      const data = res?.data || res;
      setApplication(data);
      const stageRes = await ApplicationService.getStages(id);
      setStages(stageRes?.data || stageRes || []);
      const docsRes = await ApplicationService.getDocuments(id);
      setDocuments(docsRes?.data || docsRes || []);
    } catch (err) {
      setError(err?.message || "Không thể tải thông tin đơn ứng tuyển.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Real-time notifications listener
  useEffect(() => {
    if (!id || !isConnected) return;

    // Listen for notifications related to this application
    const handleNotification = (notification) => {
      // Check if this notification is related to current application
      const metadata = notification.metadata || {};
      const isRelatedToThisApplication =
        metadata.application_id === id || metadata.application === id;

      if (isRelatedToThisApplication) {
        console.log(
          "📩 Received notification for this application:",
          notification
        );

        // Refresh data when relevant notifications are received
        const relevantTypes = [
          "application_stage_updated",
          "interview_scheduled",
          "application_status_changed",
        ];

        if (relevantTypes.includes(notification.type)) {
          console.log(
            "🔄 Refreshing application data due to notification:",
            notification.type
          );
          // Add a small delay to ensure backend has processed the changes
          setTimeout(() => {
            loadData();
          }, 1000);
        }
      }
    };

    onNotification(handleNotification);

    // Cleanup function
    return () => {
      // Note: onNotification doesn't return a cleanup function in this implementation
      // The cleanup is handled by the useSocket hook
    };
  }, [id, isConnected, onNotification]);

  const handleAcceptStage = async (stageId) => {
    if (!window.confirm("Bạn xác nhận tham gia buổi phỏng vấn này?")) return;
    try {
      await ApplicationService.acceptStage(id, stageId);
      alert("Bạn đã chấp nhận buổi phỏng vấn.");
      await loadData();
    } catch (err) {
      alert(
        err?.message || "Không thể chấp nhận buổi phỏng vấn. Vui lòng thử lại."
      );
    }
  };

  const handleDeclineStage = async (stageId) => {
    const reason = window.prompt("Lý do từ chối (tùy chọn):", "");
    if (reason === null) return; // user cancelled
    try {
      await ApplicationService.declineStage(id, stageId, reason || "");
      alert("Bạn đã từ chối buổi phỏng vấn.");
      await loadData();
    } catch (err) {
      alert(
        err?.message || "Không thể từ chối buổi phỏng vấn. Vui lòng thử lại."
      );
    }
  };

  const handleWithdraw = async () => {
    if (!window.confirm("Bạn chắc chắn muốn rút đơn này?")) return;
    setWithdrawing(true);
    try {
      await ApplicationService.withdraw(id);
      alert("Đã rút đơn thành công.");
      navigate("/applications");
    } catch (err) {
      alert(err?.message || "Không thể rút đơn. Vui lòng thử lại.");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleUploadDoc = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      await ApplicationService.uploadDocument(id, file, docType || undefined);
      setUploadProgress(100);
      setTimeout(() => {
        setDocType("");
      }, 500);
      await loadData();
    } catch (err) {
      alert(err?.message || "Tải tài liệu thất bại.");
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        e.target.value = "";
      }, 1000);
    }
  };

  if (loading) {
    return <div className="state-card">Đang tải...</div>;
  }

  if (error || !application) {
    return (
      <div className="state-card error">
        <p>{error || "Không tìm thấy đơn ứng tuyển."}</p>
        <button className="btn" onClick={() => navigate("/applications")}>
          Quay lại
        </button>
      </div>
    );
  }

  const job = application.jobs || application.job || {};

  return (
    <div className="my-application-detail">
      <div className="page-header">
        <div>
          <button className="btn ghost small" onClick={() => navigate(-1)}>
            ← Quay lại
          </button>
          <h1>{job.title || "Tin tuyển dụng"}</h1>
          <p className="muted">
            {job.companies?.name || job.company?.name || "Nhà tuyển dụng"}
          </p>
        </div>
        <div className="header-actions">
          <span className="status-pill large">
            {STATUS_LABELS[application.status] || application.status}
          </span>
          {application.status !== "withdrawn" && (
            <button
              className="btn danger"
              onClick={handleWithdraw}
              disabled={withdrawing}
            >
              {withdrawing ? "Đang rút..." : "Rút đơn"}
            </button>
          )}
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <h3>Thông tin đơn</h3>
          <div className="info-row">
            <span className="muted">Ngày nộp</span>
            <span>{formatDate(application.applied_at)}</span>
          </div>
          <div className="info-row">
            <span className="muted">Vị trí</span>
            <span>{job.title || "--"}</span>
          </div>
          <div className="info-row">
            <span className="muted">Stage hiện tại</span>
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
          <div className="info-row">
            <span className="muted">CV</span>
            <span>{application.resume_id ? "Đã đính kèm" : "Chưa có"}</span>
          </div>
        </div>

        <div className="detail-card">
          <h3>Quy trình tuyển dụng</h3>
          <div className="stages-list">
            {stages.length === 0 && <p className="muted">Chưa có stage nào.</p>}
            {stages.map((stage) => (
              <div
                key={stage.id}
                className={`stage-item ${
                  stage.status === "scheduled" ? "scheduled" : ""
                }`}
              >
                <div>
                  <div className="stage-title">{stage.stage_name}</div>
                  <div className="muted small">{stage.status || "pending"}</div>
                  {stage.scheduled_at && (
                    <div className="stage-scheduled">
                      <span className="calendar-icon">📅</span>
                      Dự kiến: {formatDate(stage.scheduled_at)}
                      {/* Show accept/decline buttons only if candidate hasn't responded yet */}
                      {stage.status === "scheduled" &&
                        !stage.candidate_accepted_at &&
                        !stage.candidate_declined_at && (
                          <div
                            style={{
                              marginTop: 8,
                              display: "flex",
                              gap: 8,
                            }}
                          >
                            <button
                              className="btn success small"
                              onClick={() => handleAcceptStage(stage.id)}
                            >
                              ✅ Tham gia
                            </button>
                            <button
                              className="btn danger small"
                              onClick={() => handleDeclineStage(stage.id)}
                            >
                              ❌ Từ chối
                            </button>
                          </div>
                        )}
                      {/* If candidate already accepted, show accepted badge */}
                      {stage.candidate_accepted_at && (
                        <div style={{ marginTop: 8 }}>
                          <span className="status-pill success">
                            Đã xác nhận tham gia
                          </span>
                        </div>
                      )}
                      {/* If candidate declined, show declined badge */}
                      {stage.candidate_declined_at && (
                        <div style={{ marginTop: 8 }}>
                          <span className="status-pill danger">Đã từ chối</span>
                        </div>
                      )}
                    </div>
                  )}
                  {stage.location && (
                    <div className="stage-meta small muted">
                      📍 Địa điểm: {stage.location}
                    </div>
                  )}
                  {stage.duration_minutes !== undefined &&
                    stage.duration_minutes !== null && (
                      <div className="stage-meta small muted">
                        ⏱ Thời lượng: {stage.duration_minutes} phút
                      </div>
                    )}

                  {stage.status === "passed" && (
                    <div className="stage-success">
                      🎉 Chúc mừng! Bạn đã vượt qua stage này.
                    </div>
                  )}
                  {stage.status === "failed" && (
                    <div className="stage-failed">
                      😔 Rất tiếc, bạn chưa vượt qua stage này. Nhà tuyển dụng
                      sẽ liên hệ nếu có cơ hội khác.
                    </div>
                  )}
                  {stage.recruiter_decision && (
                    <div className="stage-decision small muted">
                      📝 Quyết định: {stage.recruiter_decision}
                      {stage.decision_at && (
                        <span> ({formatDate(stage.decision_at)})</span>
                      )}
                    </div>
                  )}
                  {stage.candidate_response_deadline && (
                    <div className="stage-meta small muted">
                      ⏳ Hạn phản hồi:{" "}
                      {formatDate(stage.candidate_response_deadline)}
                    </div>
                  )}
                  {(stage.candidate_accepted_at ||
                    stage.candidate_declined_at) && (
                    <div className="stage-meta small muted">
                      📣 Phản hồi ứng viên:{" "}
                      {stage.candidate_accepted_at
                        ? `Chấp nhận ${formatDate(stage.candidate_accepted_at)}`
                        : `Từ chối ${formatDate(stage.candidate_declined_at)}`}
                      {stage.decline_reason && (
                        <div className="small muted">
                          Lý do: {stage.decline_reason}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="muted small">
                  {stage.completed_at
                    ? `Hoàn thành: ${formatDate(stage.completed_at)}`
                    : ""}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="detail-card">
          <h3>Tài liệu bổ sung</h3>
          {normalizeStatus(application.status) ===
          APPLICATION_STATUSES.INTERVIEWING ? (
            <div className="upload-row">
              <input
                type="text"
                placeholder="Loại tài liệu (VD: Portfolio)"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                disabled={uploading}
              />
              <label className={`btn primary ${uploading ? "uploading" : ""}`}>
                {uploading ? `Đang tải... ${uploadProgress}%` : "Tải lên"}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleUploadDoc}
                  hidden
                  disabled={uploading}
                />
              </label>
            </div>
          ) : (
            <div className="upload-disabled">
              <p className="muted">
                Tài liệu bổ sung chỉ có thể tải lên khi đơn ứng tuyển đang ở
                giai đoạn phỏng vấn.
              </p>
            </div>
          )}
          {uploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          <div className="documents-list">
            {documents.length === 0 && (
              <p className="muted">Chưa có tài liệu.</p>
            )}
            {documents.map((doc) => (
              <div key={doc.id} className="document-item">
                <div>
                  <div className="doc-name">
                    {doc.document_type || "Tài liệu"}
                  </div>
                  <div className="muted small">
                    {formatDate(doc.created_at)}
                  </div>
                </div>
                {doc.file_url && (
                  <a
                    className="btn ghost small"
                    href={doc.file_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Xem
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
