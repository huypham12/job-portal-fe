import React, { useState } from "react";
import { Button, Badge, Modal, Input, Textarea, Select } from "./shared";
import { ApplicationService } from "../lib/api";
import { APPLICATION_STATUSES } from "../constants/applicationStatuses";
import "./Timeline.css";

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

const STAGE_STATUS_OPTIONS = [
  "pending",
  "scheduled",
  "in_progress",
  "passed",
  "failed",
  "skipped",
  "completed",
];

export default function Timeline({
  stages,
  onUpdateStage,
  onCreateStage,
  applicationId,
  candidateName,
  jobTitle,
}) {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    stage_name: "",
    scheduled_at: "",
    location: "",
    duration_minutes: "",
  });
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionStage, setDecisionStage] = useState(null);
  const [decisionAction, setDecisionAction] = useState("accept_application");
  const [nextStageData, setNextStageData] = useState({
    stage_name: "",
    scheduled_at: "",
    location: "",
    duration_minutes: "",
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStage, setEditingStage] = useState(null);
  const [editData, setEditData] = useState({
    status: "",
    completed_at: "",
  });

  const handleQuickAction = (stage, action) => {
    switch (action) {
      case "schedule":
        setScheduleData({
          stage_name: stage.stage_name,
          scheduled_at: "",
        });
        setShowScheduleModal(true);
        break;
      case "start":
        onUpdateStage(stage.id, { status: "in_progress" });
        break;
      case "pass":
        onUpdateStage(stage.id, {
          status: "completed",
          completed_at: new Date().toISOString(),
        });
        break;
      case "fail":
        onUpdateStage(stage.id, {
          status: "completed",
          completed_at: new Date().toISOString(),
        });
        break;
      case "edit":
        setEditingStage(stage);
        setEditData({
          status: stage.status || "",
          completed_at: stage.completed_at
            ? stage.completed_at.slice(0, 16)
            : "",
        });
        setShowEditModal(true);
        break;
      default:
        break;
    }
  };

  const handleScheduleInterview = () => {
    if (!scheduleData.stage_name || !scheduleData.scheduled_at) {
      alert("Vui lòng nhập tên stage và thời gian dự kiến.");
      return;
    }

    // Validate scheduled_at: must be >= previous stage's scheduled_at
    if (scheduleData.scheduled_at) {
      const newDate = new Date(scheduleData.scheduled_at);

      // Check if there are existing stages with scheduled_at
      const scheduledStages = stages
        .filter((s) => s.scheduled_at)
        .sort((a, b) => (b.stage_order || 0) - (a.stage_order || 0)); // Sort descending

      if (scheduledStages.length > 0) {
        const lastScheduledStage = scheduledStages[0];
        const lastDate = new Date(lastScheduledStage.scheduled_at);

        if (newDate < lastDate) {
          alert(
            `Thời gian phỏng vấn phải sau hoặc bằng stage trước đó (${
              lastScheduledStage.stage_name
            }: ${formatDate(lastScheduledStage.scheduled_at)})`
          );
          return;
        }
      }
    }

    // Validate stage name uniqueness
    const existingStage = stages.find(
      (s) =>
        s.stage_name.trim().toLowerCase() ===
        scheduleData.stage_name.trim().toLowerCase()
    );
    if (existingStage) {
      // Update existing stage
      onUpdateStage(existingStage.id, {
        scheduled_at: scheduleData.scheduled_at,
        location: scheduleData.location || undefined,
        duration_minutes:
          scheduleData.duration_minutes !== ""
            ? Number(scheduleData.duration_minutes)
            : undefined,
      });
    } else {
      // Calculate next stage_order
      const maxOrder =
        stages.length > 0
          ? Math.max(...stages.map((s) => s.stage_order || 0))
          : 0;
      const nextOrder = maxOrder + 1;

      // Compute candidate response deadline = scheduled_at - 24h if scheduled_at provided
      const candidateResponseDeadline =
        scheduleData.scheduled_at && scheduleData.scheduled_at.trim()
          ? new Date(
              new Date(scheduleData.scheduled_at).getTime() -
                24 * 60 * 60 * 1000
            ).toISOString()
          : undefined;

      onCreateStage({
        stage_name: scheduleData.stage_name.trim(),
        stage_order: nextOrder,
        scheduled_at: scheduleData.scheduled_at,
        location: scheduleData.location || undefined,
        duration_minutes:
          scheduleData.duration_minutes !== ""
            ? Number(scheduleData.duration_minutes)
            : undefined,
        candidate_response_deadline: candidateResponseDeadline,
        status: "pending",
      });
    }

    setShowScheduleModal(false);
    setScheduleData({
      stage_name: "",
      scheduled_at: "",
      location: "",
      duration_minutes: "",
    });
  };

  const handleEditStage = async () => {
    if (!editData.status) {
      alert("Vui lòng chọn trạng thái.");
      return;
    }

    const payload = {
      status: editData.status,
      completed_at: editData.completed_at || undefined,
    };

    try {
      await onUpdateStage(editingStage.id, payload);

      // Note: No auto-transition logic - recruiter decides manually after each stage completion

      setShowEditModal(false);
      setEditingStage(null);
    } catch (error) {
      alert("Không thể cập nhật stage. Vui lòng thử lại.");
    }
  };

  const getStageStatusColor = (status) => {
    switch (status) {
      case "completed":
      case "passed":
        return "success";
      case "failed":
        return "danger";
      case "in_progress":
        return "info";
      case "scheduled":
        return "warning";
      default:
        return "default";
    }
  };

  const getQuickActions = (stage) => {
    const actions = [];
    const maxOrder =
      stages.length > 0
        ? Math.max(...stages.map((s) => s.stage_order || 0))
        : 0;
    const isLastStage = (stage.stage_order || 0) === maxOrder;
    const nextStage = stages.find(
      (s) => (s.stage_order || 0) === (stage.stage_order || 0) + 1
    );
    const hasNextStage = !!nextStage;

    if (stage.status === "pending") {
      actions.push(
        <Button
          key="schedule"
          variant="outline"
          size="small"
          onClick={() => handleQuickAction(stage, "schedule")}
        >
          📅 Lên lịch
        </Button>
      );
    }

    if (stage.status === "scheduled") {
      // Don't show any action buttons if stage is already completed/passed
      if (
        stage.completed_at ||
        stage.status === "completed" ||
        stage.status === "passed"
      ) {
        // Stage is done, just show status
        return actions;
      }

      // If there's already a next stage, this stage is effectively done - don't show action buttons
      if (hasNextStage) {
        return actions;
      }

      // If candidate has accepted, and there is no next stage and no existing recruiter decision, show decision button
      if (stage.candidate_accepted_at && !stage.recruiter_decision) {
        actions.push(
          <Button
            key="decision_scheduled"
            variant="primary"
            size="small"
            onClick={() => {
              setDecisionStage(stage);
              setDecisionAction("accept_application");
              setNextStageData({
                stage_name: "",
                scheduled_at: "",
                location: "",
                duration_minutes: "",
              });
              setShowDecisionModal(true);
            }}
          >
            🧭 Quyết định
          </Button>
        );
      } else if (!stage.candidate_accepted_at) {
        // Only show "Bắt đầu" button if candidate hasn't accepted yet
        actions.push(
          <Button
            key="start_disabled"
            variant="primary"
            size="small"
            onClick={() =>
              alert(
                "Ứng viên chưa xác nhận tham gia. Vui lòng chờ candidate chấp nhận lịch."
              )
            }
            disabled={true}
          >
            ▶️ Bắt đầu
          </Button>
        );
      }
    }

    if (stage.status === "in_progress") {
      actions.push(
        <Button
          key="pass"
          variant="success"
          size="small"
          onClick={() => handleQuickAction(stage, "pass")}
        >
          ✅ Đạt
        </Button>
      );
      actions.push(
        <Button
          key="fail"
          variant="danger"
          size="small"
          onClick={() => handleQuickAction(stage, "fail")}
        >
          ❌ Không đạt
        </Button>
      );
      // Allow recruiter to accept application directly while in_progress (use makeStageDecision)
      actions.push(
        <Button
          key="accept_app"
          variant="success"
          size="small"
          onClick={async () => {
            try {
              await ApplicationService.makeStageDecision(
                applicationId,
                stage.id,
                { action: "accept_application" }
              );
              alert("Đã chấp nhận ứng viên và ghi nhận quyết định.");
              window.location.reload();
            } catch (err) {
              console.error("Accept failed:", err);
              alert(
                err?.message ||
                  "Không thể chấp nhận ứng viên. Vui lòng thử lại."
              );
            }
          }}
        >
          ✅ Chấp nhận ứng viên
        </Button>
      );

      // Reject application while in_progress
      actions.push(
        <Button
          key="reject_app"
          variant="danger"
          size="small"
          onClick={async () => {
            if (!window.confirm("Bạn chắc chắn muốn từ chối ứng viên?")) return;
            try {
              // record recruiter decision on stage and then set application status to rejected
              await ApplicationService.updateStage(applicationId, {
                stage_id: stage.id,
                recruiter_decision: "reject",
                decision_at: new Date().toISOString(),
              });
              await ApplicationService.updateStatus(applicationId, {
                status: APPLICATION_STATUSES.REJECTED,
              });
              alert("Đã từ chối ứng viên.");
              window.location.reload();
            } catch (err) {
              console.error("Reject failed:", err);
              alert(
                err?.message || "Không thể từ chối ứng viên. Vui lòng thử lại."
              );
            }
          }}
        >
          ❌ Từ chối ứng viên
        </Button>
      );

      // Quick create next stage while in_progress
      actions.push(
        <Button
          key="create_next_quick_inprogress"
          variant="outline"
          size="small"
          onClick={() => {
            setDecisionStage(stage);
            setDecisionAction("create_next_stage");
            setNextStageData({
              stage_name: "",
              scheduled_at: "",
              location: "",
              duration_minutes: "",
            });
            setShowDecisionModal(true);
          }}
        >
          ➕ Tạo stage tiếp theo
        </Button>
      );
    }

    // Completed/passed stages: show completion message instead of action buttons
    if (stage.status === "passed" || stage.status === "completed") {
      // Show completion status
      actions.push(
        <span
          key="completed_status"
          style={{ color: "#10b981", fontSize: 14, fontWeight: 500 }}
        >
          ✅ Stage đã hoàn thành
          {stage.completed_at && ` (${formatDate(stage.completed_at)})`}
        </span>
      );

      // show recruiter decision if exists
      if (stage.recruiter_decision) {
        actions.push(
          <span
            key="decision_label"
            style={{ marginLeft: 8, color: "#64748b", fontSize: 13 }}
          >
            | Quyết định: {stage.recruiter_decision}
          </span>
        );
      }

      return actions;
    }

    // Disable editing once candidate has accepted this stage
    actions.push(
      <Button
        key="edit"
        variant="ghost"
        size="small"
        onClick={() => {
          if (stage.candidate_accepted_at) {
            alert(
              "Không thể chỉnh sửa thông tin sau khi ứng viên đã xác nhận tham gia."
            );
            return;
          }
          handleQuickAction(stage, "edit");
        }}
        disabled={!!stage.candidate_accepted_at}
      >
        ✏️ Chỉnh sửa
      </Button>
    );

    return actions;
  };

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <h3>Quy trình tuyển dụng</h3>
        <Button
          variant="outline"
          size="small"
          onClick={() => setShowScheduleModal(true)}
        >
          ➕ Thêm stage
        </Button>
      </div>

      <div className="timeline">
        {stages.length === 0 ? (
          <div className="timeline-empty">
            <p>Chưa có stage nào. Nhấn "Thêm stage" để bắt đầu.</p>
          </div>
        ) : (
          stages
            .sort((a, b) => (a.stage_order || 0) - (b.stage_order || 0))
            .map((stage, index) => (
              <div key={stage.id || index} className="timeline-item">
                <div className="timeline-indicator">
                  <div
                    className={`timeline-dot ${stage.status || "pending"}`}
                  />
                  {index < stages.length - 1 && (
                    <div className="timeline-line" />
                  )}
                </div>
                <div className="timeline-content">
                  <div className="timeline-stage-header">
                    <h4 className="stage-name">{stage.stage_name}</h4>
                    <Badge
                      variant={getStageStatusColor(stage.status)}
                      size="small"
                    >
                      {stage.status || "pending"}
                    </Badge>
                  </div>

                  <div className="timeline-stage-meta">
                    {stage.scheduled_at && (
                      <div className="meta-item">
                        <span className="meta-label">📅 Dự kiến:</span>
                        <span>{formatDate(stage.scheduled_at)}</span>
                      </div>
                    )}
                    {stage.completed_at && (
                      <div className="meta-item">
                        <span className="meta-label">✅ Hoàn thành:</span>
                        <span>{formatDate(stage.completed_at)}</span>
                      </div>
                    )}
                    {stage.location && (
                      <div className="meta-item">
                        <span className="meta-label">📍 Địa điểm:</span>
                        <span>{stage.location}</span>
                      </div>
                    )}
                    {stage.duration_minutes !== undefined &&
                      stage.duration_minutes !== null && (
                        <div className="meta-item">
                          <span className="meta-label">⏱ Thời lượng:</span>
                          <span>{stage.duration_minutes} phút</span>
                        </div>
                      )}
                    {/* interviewer_id not shown — recruiter is unique per company */}
                    {stage.recruiter_decision && (
                      <div className="meta-item">
                        <span className="meta-label">
                          📝 Quyết định tuyển dụng:
                        </span>
                        <span>{stage.recruiter_decision}</span>
                        {stage.decision_at && (
                          <span style={{ marginLeft: 8, color: "#64748b" }}>
                            ({formatDate(stage.decision_at)})
                          </span>
                        )}
                      </div>
                    )}
                    {stage.candidate_response_deadline && (
                      <div className="meta-item">
                        <span className="meta-label">
                          ⏳ Hạn phản hồi ứng viên:
                        </span>
                        <span>
                          {formatDate(stage.candidate_response_deadline)}
                        </span>
                      </div>
                    )}
                    {/* If a next stage exists, show that info instead of decision button */}
                    {(() => {
                      const nextStage = stages.find(
                        (s) =>
                          (s.stage_order || 0) === (stage.stage_order || 0) + 1
                      );
                      if (nextStage) {
                        return (
                          <div className="meta-item">
                            <span className="meta-label">
                              🔁 Đã chuyển sang:
                            </span>
                            <span>{nextStage.stage_name}</span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    {(stage.candidate_accepted_at ||
                      stage.candidate_declined_at) && (
                      <div className="meta-item">
                        <span className="meta-label">
                          📣 Phản hồi ứng viên:
                        </span>
                        <span>
                          {stage.candidate_accepted_at
                            ? `Chấp nhận ${formatDate(
                                stage.candidate_accepted_at
                              )}`
                            : `Từ chối ${formatDate(
                                stage.candidate_declined_at
                              )}`}
                        </span>
                        {stage.decline_reason && (
                          <div style={{ color: "#94a3b8", marginTop: 4 }}>
                            Lý do: {stage.decline_reason}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="timeline-actions">
                    {getQuickActions(stage)}
                  </div>
                </div>
              </div>
            ))
        )}
      </div>

      {/* Schedule Interview Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
      >
        <h3 style={{ marginTop: 0 }}>Lên lịch phỏng vấn</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Input
            placeholder="Tên stage (VD: Technical Interview)"
            value={scheduleData.stage_name}
            onChange={(e) =>
              setScheduleData({ ...scheduleData, stage_name: e.target.value })
            }
          />
          <Input
            type="datetime-local"
            placeholder="Thời gian dự kiến"
            value={scheduleData.scheduled_at}
            onChange={(e) =>
              setScheduleData({ ...scheduleData, scheduled_at: e.target.value })
            }
          />
          <Input
            placeholder="Địa điểm (tùy chọn)"
            value={scheduleData.location}
            onChange={(e) =>
              setScheduleData({ ...scheduleData, location: e.target.value })
            }
          />
          <Input
            placeholder="Thời lượng (phút, tùy chọn)"
            type="number"
            value={scheduleData.duration_minutes}
            onChange={(e) =>
              setScheduleData({
                ...scheduleData,
                duration_minutes: e.target.value,
              })
            }
          />

          <div
            style={{
              marginTop: 16,
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            <Button
              variant="outline"
              onClick={() => setShowScheduleModal(false)}
            >
              Hủy
            </Button>
            <Button variant="primary" onClick={handleScheduleInterview}>
              Lên lịch
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Stage Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        <h3 style={{ marginTop: 0 }}>Cập nhật stage</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Select
            value={editData.status}
            onChange={(e) =>
              setEditData({ ...editData, status: e.target.value })
            }
          >
            <option value="">Chọn trạng thái</option>
            {STAGE_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
          <Input
            type="datetime-local"
            placeholder="Thời gian hoàn thành"
            value={editData.completed_at}
            onChange={(e) =>
              setEditData({ ...editData, completed_at: e.target.value })
            }
          />
          <div
            style={{
              marginTop: 16,
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleEditStage}>
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </Modal>

      {/* Decision Modal */}
      <Modal
        isOpen={showDecisionModal}
        onClose={() => setShowDecisionModal(false)}
      >
        <h3 style={{ marginTop: 0 }}>Quyết định sau stage</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label>
              <input
                type="radio"
                name="decision"
                value="accept_application"
                checked={decisionAction === "accept_application"}
                onChange={() => setDecisionAction("accept_application")}
              />{" "}
              Chấp nhận ứng viên
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="decision"
                value="create_next_stage"
                checked={decisionAction === "create_next_stage"}
                onChange={() => setDecisionAction("create_next_stage")}
              />{" "}
              Tạo stage tiếp theo
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="decision"
                value="reject_application"
                checked={decisionAction === "reject_application"}
                onChange={() => setDecisionAction("reject_application")}
              />{" "}
              Từ chối ứng viên
            </label>
          </div>
          {decisionAction === "reject_application" && (
            <Textarea
              placeholder="Lý do từ chối (tùy chọn)"
              value={nextStageData.decline_reason || ""}
              onChange={(e) =>
                setNextStageData({
                  ...nextStageData,
                  decline_reason: e.target.value,
                })
              }
              rows={3}
            />
          )}

          {decisionAction === "create_next_stage" && (
            <>
              <Input
                placeholder="Tên stage (VD: Technical Interview)"
                value={nextStageData.stage_name}
                onChange={(e) =>
                  setNextStageData({
                    ...nextStageData,
                    stage_name: e.target.value,
                  })
                }
              />
              <Input
                type="datetime-local"
                placeholder="Thời gian dự kiến"
                value={nextStageData.scheduled_at}
                onChange={(e) =>
                  setNextStageData({
                    ...nextStageData,
                    scheduled_at: e.target.value,
                  })
                }
              />
              <Input
                placeholder="Địa điểm (tùy chọn)"
                value={nextStageData.location}
                onChange={(e) =>
                  setNextStageData({
                    ...nextStageData,
                    location: e.target.value,
                  })
                }
              />
              <Input
                placeholder="Thời lượng (phút, tùy chọn)"
                type="number"
                value={nextStageData.duration_minutes}
                onChange={(e) =>
                  setNextStageData({
                    ...nextStageData,
                    duration_minutes: e.target.value,
                  })
                }
              />
            </>
          )}

          <div
            style={{
              marginTop: 16,
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            <Button
              variant="outline"
              onClick={() => setShowDecisionModal(false)}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (!decisionStage) return;
                try {
                  if (decisionAction === "accept_application") {
                    // Record decision and accept application via makeStageDecision (backend updates status)
                    await ApplicationService.makeStageDecision(
                      applicationId,
                      decisionStage.id,
                      { action: "accept_application" }
                    );
                    alert("Đã chấp nhận ứng viên và ghi nhận quyết định.");
                    window.location.reload();
                    return;
                  }

                  if (decisionAction === "create_next_stage") {
                    if (!nextStageData.stage_name) {
                      alert("Vui lòng nhập tên stage mới.");
                      return;
                    }

                    // Validate scheduled_at: must be >= current stage's scheduled_at
                    if (
                      nextStageData.scheduled_at &&
                      decisionStage.scheduled_at
                    ) {
                      const newDate = new Date(nextStageData.scheduled_at);
                      const currentDate = new Date(decisionStage.scheduled_at);

                      if (newDate < currentDate) {
                        alert(
                          `Thời gian phỏng vấn stage mới phải sau hoặc bằng stage hiện tại (${formatDate(
                            decisionStage.scheduled_at
                          )})`
                        );
                        return;
                      }
                    }

                    // Use makeStageDecision to create next stage (backend handles creation and notification)
                    await ApplicationService.makeStageDecision(
                      applicationId,
                      decisionStage.id,
                      {
                        action: "create_next_stage",
                        next_stage: {
                          stage_name: nextStageData.stage_name.trim(),
                          scheduled_at: nextStageData.scheduled_at || undefined,
                          location: nextStageData.location || undefined,
                          duration_minutes: nextStageData.duration_minutes
                            ? Number(nextStageData.duration_minutes)
                            : undefined,
                          interviewer_id:
                            nextStageData.interviewer_id || undefined,
                        },
                      }
                    );
                    alert("Đã tạo stage mới và ghi nhận quyết định.");
                    window.location.reload();
                    return;
                  }

                  if (decisionAction === "reject_application") {
                    // Send decision with reason to backend via makeStageDecision; backend will mark stage decision and set application status
                    await ApplicationService.makeStageDecision(
                      applicationId,
                      decisionStage.id,
                      {
                        action: "reject_application",
                        reason: nextStageData.decline_reason || undefined,
                      }
                    );
                    alert("Đã từ chối ứng viên và ghi nhận quyết định.");
                    window.location.reload();
                    return;
                  }
                } catch (err) {
                  console.error("Decision failed:", err);
                  alert(
                    err?.message ||
                      "Không thể ghi nhận quyết định. Vui lòng thử lại."
                  );
                }
              }}
            >
              Ghi nhận
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
