import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ApplicationService } from "../lib/api.js";
import { JobService } from "../lib/api.js";
import {
  Button,
  Card,
  CardBody,
  Badge,
  Input,
  Select,
  ConfirmModal,
  Modal,
} from "../components/shared";
import CompareModal from "../components/CompareModal";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  APPLICATION_STATUSES,
  normalizeStatus,
} from "../constants/applicationStatuses";
import { useSocket } from "../hooks/useSocket";
import "../styles/shared.css";
import "./ApplicationsList.css";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả" },
  {
    value: APPLICATION_STATUSES.APPLIED,
    label: STATUS_LABELS[APPLICATION_STATUSES.APPLIED],
  },
  {
    value: APPLICATION_STATUSES.REVIEWED,
    label: STATUS_LABELS[APPLICATION_STATUSES.REVIEWED],
  },
  {
    value: APPLICATION_STATUSES.INTERVIEWING,
    label: STATUS_LABELS[APPLICATION_STATUSES.INTERVIEWING],
  },
  {
    value: APPLICATION_STATUSES.ACCEPTED,
    label: STATUS_LABELS[APPLICATION_STATUSES.ACCEPTED],
  },
  {
    value: APPLICATION_STATUSES.REJECTED,
    label: STATUS_LABELS[APPLICATION_STATUSES.REJECTED],
  },
  {
    value: APPLICATION_STATUSES.WITHDRAWN,
    label: STATUS_LABELS[APPLICATION_STATUSES.WITHDRAWN],
  },
];

const SORT_OPTIONS = [
  { value: "applied_at", label: "Mới nhất" },
  { value: "name", label: "Theo tên" },
];

function formatDate(dateString) {
  if (!dateString) return "--";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
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

export default function ApplicationsList() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAccess, setHasAccess] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("applied_at");
  const [order, setOrder] = useState("desc");
  const [viewMode, setViewMode] = useState("table");
  const [selectedApps, setSelectedApps] = useState([]);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkAction, setBulkAction] = useState(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareCandidates, setCompareCandidates] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    total_pages: 1,
  });
  const [shortlistedIds, setShortlistedIds] = useState(new Set());
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(true);

  // Socket connection for real-time updates
  const { isConnected, onNotification } = useSocket();

  const fetchJob = useCallback(async () => {
    if (!jobId) return;
    try {
      const response = await JobService.getManage(jobId);
      const data = response?.data || response;
      setJob(data);
      setHasAccess(true);
    } catch (err) {
      console.error("Failed to fetch job:", err);
      if (err?.status === 403) {
        setHasAccess(false);
        setError(
          err?.data?.message ||
            err?.message ||
            "Bạn không có quyền truy cập tài nguyên này"
        );
      }
    }
  }, [jobId]);

  const fetchStats = useCallback(async () => {
    if (!jobId) return;
    try {
      const response = await ApplicationService.getStats(jobId);
      const data = response?.data || response;
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, [jobId]);

  const fetchApplications = useCallback(async () => {
    if (!jobId) return;
    if (!hasAccess) return;
    setLoading(true);
    setError(null);
    try {
      const filters = {
        page: currentPage,
        limit: PAGE_SIZE,
        status:
          statusFilter && statusFilter.trim() !== "" ? statusFilter : undefined,
        stage:
          stageFilter && stageFilter.trim() !== "" ? stageFilter : undefined,
        // search: searchQuery || undefined, // Not supported by backend yet
        sort_by: sortBy,
        order: order,
      };
      const response = await ApplicationService.listByJob(jobId, filters);
      const data = response?.data || response || [];
      const pag = response?.pagination || {
        page: currentPage,
        limit: PAGE_SIZE,
        total: data.length,
        total_pages: 1,
      };

      setApplications(data);
      setPagination(pag);

      // Check if onboarding banner should be shown
      const dismissed = localStorage.getItem(
        `onboarding_banner_dismissed_${jobId}`
      );
      setShowOnboardingBanner(!dismissed);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      console.error("Error details:", err?.data || err?.response || err);
      const errorMessage =
        err?.data?.message ||
        err?.message ||
        "Không thể tải danh sách ứng viên. Vui lòng thử lại.";
      setError(errorMessage);
      if (err?.status === 401) {
        navigate(
          "/login?role=recruiter&redirect=" +
            encodeURIComponent(window.location.pathname)
        );
      }
    } finally {
      setLoading(false);
    }
  }, [
    jobId,
    currentPage,
    statusFilter,
    stageFilter,
    searchQuery,
    sortBy,
    order,
    navigate,
  ]);

  useEffect(() => {
    fetchJob();
    fetchStats();
  }, [fetchJob, fetchStats]);

  useEffect(() => {
    if (hasAccess) {
      fetchApplications();
    }
  }, [fetchApplications, hasAccess]);

  // Listen for real-time updates via Socket.IO
  useEffect(() => {
    if (!isConnected || !jobId) return;

    onNotification((notification) => {
      // Check if notification is related to current job
      const notificationJobId = notification.metadata?.job_id;

      if (
        notification.type === "application_received" &&
        notificationJobId === jobId
      ) {
        console.log("🔔 Ứng viên mới:", notification.content);
        fetchApplications();
        fetchStats();
      }

      if (
        (notification.type === "application_status_changed" ||
          notification.type === "application_stage_updated" ||
          notification.type === "interview_scheduled") &&
        notificationJobId === jobId
      ) {
        console.log("🔔 Trạng thái ứng viên thay đổi:", notification.content);
        fetchApplications();
        fetchStats();
      }
    });
  }, [isConnected, jobId, onNotification, fetchApplications, fetchStats]);

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleSelectApp = (appId) => {
    setSelectedApps((prev) =>
      prev.includes(appId)
        ? prev.filter((id) => id !== appId)
        : [...prev, appId]
    );
  };

  const handleSelectAll = () => {
    if (selectedApps.length === applications.length) {
      setSelectedApps([]);
    } else {
      setSelectedApps(applications.map((app) => app.id));
    }
  };

  const handleBulkAction = (action) => {
    setBulkAction(action);
    setShowBulkConfirm(true);
  };

  const confirmBulkAction = async () => {
    if (!bulkAction || selectedApps.length === 0) return;

    try {
      // Note: Backend bulk update still uses legacy action values
      // TODO: Update backend to use new workflow status values
      const actionMap = {
        accept: "accept", // Maps to application_status.accepted
        reject: "reject", // Maps to application_status.rejected
        review: "review", // Maps to application_status.reviewed
      };

      await ApplicationService.bulkUpdate({
        application_ids: selectedApps,
        action: actionMap[bulkAction],
      });

      // Show success message (could be replaced with toast notification)
      const successMessage = `Đã ${
        bulkAction === "accept"
          ? "chấp nhận"
          : bulkAction === "reject"
          ? "từ chối"
          : "đánh dấu đã xem"
      } ${selectedApps.length} ứng viên thành công.`;
      console.log("Success:", successMessage); // Replace with toast notification

      fetchApplications();
      fetchStats();
      setSelectedApps([]);
      setShowBulkConfirm(false);
      setBulkAction(null);
    } catch (err) {
      const errorMessage =
        err?.data?.message ||
        err?.message ||
        "Không thể thực hiện thao tác. Vui lòng thử lại.";
      console.error("Bulk action error:", errorMessage); // Replace with error toast
    }
  };

  const handleShortlistToggle = async (appId) => {
    const isShortlisted = shortlistedIds.has(appId);
    const action = isShortlisted ? "remove" : "add";

    try {
      await ApplicationService.shortlistCandidate({
        application_id: appId,
        action: action,
      });

      setShortlistedIds((prev) => {
        const newSet = new Set(prev);
        if (action === "add") {
          newSet.add(appId);
        } else {
          newSet.delete(appId);
        }
        return newSet;
      });

      // Show success message
      const message =
        action === "add" ? "Đã thêm vào shortlist" : "Đã bỏ khỏi shortlist";
      // You might want to use a toast notification here instead of alert
      console.log(message);
    } catch (err) {
      alert(err?.message || "Không thể cập nhật shortlist. Vui lòng thử lại.");
    }
  };

  const handleBulkShortlist = async (action) => {
    if (selectedApps.length === 0) return;

    try {
      // Process all selected applications
      const promises = selectedApps.map((appId) =>
        ApplicationService.shortlistCandidate({
          application_id: appId,
          action: action,
        })
      );

      await Promise.all(promises);

      // Update local state
      setShortlistedIds((prev) => {
        const newSet = new Set(prev);
        selectedApps.forEach((appId) => {
          if (action === "add") {
            newSet.add(appId);
          } else {
            newSet.delete(appId);
          }
        });
        return newSet;
      });

      alert(
        `Đã ${action === "add" ? "thêm" : "bỏ"} ${
          selectedApps.length
        } ứng viên ${action === "add" ? "vào" : "khỏi"} shortlist thành công.`
      );
      setSelectedApps([]);
    } catch (err) {
      alert(err?.message || "Không thể thực hiện thao tác. Vui lòng thử lại.");
    }
  };

  // Handler 1: Move applications to interviewing status (no stage creation)
  const handleMoveToInterviewing = async () => {
    if (selectedApps.length === 0) {
      alert("Vui lòng chọn ít nhất một ứng viên");
      return;
    }

    try {
      await ApplicationService.bulkUpdate({
        application_ids: selectedApps,
        action: "interview",
      });

      alert(
        `Đã chuyển ${selectedApps.length} ứng viên sang trạng thái "Đang phỏng vấn" thành công!`
      );

      setSelectedApps([]);
      fetchApplications();
      fetchStats();
    } catch (err) {
      console.error("Move to interviewing error:", err);
      alert(
        err?.data?.message ||
          err?.message ||
          "Không thể chuyển trạng thái. Vui lòng thử lại."
      );
    }
  };

  const handleCompare = () => {
    if (selectedApps.length >= 2 && selectedApps.length <= 4) {
      setCompareCandidates(selectedApps);
      setShowCompareModal(true);
    }
  };

  const handleViewDetail = (appId) => {
    navigate(`/recruiter/applications/${appId}`);
  };

  const statsData = stats || {
    total: 0,
    by_status: {
      [APPLICATION_STATUSES.APPLIED]: 0,
      [APPLICATION_STATUSES.REVIEWED]: 0,
      [APPLICATION_STATUSES.INTERVIEWING]: 0,
      [APPLICATION_STATUSES.ACCEPTED]: 0,
      [APPLICATION_STATUSES.REJECTED]: 0,
      [APPLICATION_STATUSES.WITHDRAWN]: 0,
    },
  };

  return (
    <div className="section applications-list-page">
      <div className="applications-header">
        <div>
          <div className="breadcrumb">
            <Link to="/recruiter/jobs">Tin tuyển dụng</Link>
            <span> / </span>
            {job && (
              <Link to={`/recruiter/jobs/${jobId}/manage`}>
                {job.title || "Job"}
              </Link>
            )}
            <span> / </span>
            <span>Ứng viên</span>
          </div>
          <h1 className="applications-title">Quản lý ứng viên</h1>
          {job && (
            <p className="applications-subtitle">Tin tuyển dụng: {job.title}</p>
          )}
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Button
            variant="outline"
            onClick={() => navigate(`/recruiter/jobs/${jobId}/rounds`)}
            title="Xem tổng quan các vòng phỏng vấn"
          >
            📊 Dashboard PV
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/recruiter/jobs/${jobId}/manage`)}
          >
            Quay lại
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      {stats && (
        <Card padding="medium" className="stats-card">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{statsData.total || 0}</div>
              <div className="stat-label">Tổng số</div>
            </div>
            <div className="stat-item stat-applied">
              <div className="stat-value">
                {statsData.by_status?.[APPLICATION_STATUSES.APPLIED] || 0}
              </div>
              <div className="stat-label">
                {STATUS_LABELS[APPLICATION_STATUSES.APPLIED]}
              </div>
            </div>
            <div className="stat-item stat-under-review">
              <div className="stat-value">
                {statsData.by_status?.[APPLICATION_STATUSES.REVIEWED] || 0}
              </div>
              <div className="stat-label">
                {STATUS_LABELS[APPLICATION_STATUSES.REVIEWED]}
              </div>
            </div>
            <div className="stat-item stat-interviewing">
              <div className="stat-value">
                {statsData.by_status?.[APPLICATION_STATUSES.INTERVIEWING] || 0}
              </div>
              <div className="stat-label">
                {STATUS_LABELS[APPLICATION_STATUSES.INTERVIEWING]}
              </div>
            </div>
            <div className="stat-item stat-final-decision"></div>
            <div className="stat-item stat-accepted">
              <div className="stat-value">
                {statsData.by_status?.[APPLICATION_STATUSES.ACCEPTED] || 0}
              </div>
              <div className="stat-label">
                {STATUS_LABELS[APPLICATION_STATUSES.ACCEPTED]}
              </div>
            </div>
            <div className="stat-item stat-rejected">
              <div className="stat-value">
                {statsData.by_status?.[APPLICATION_STATUSES.REJECTED] || 0}
              </div>
              <div className="stat-label">
                {STATUS_LABELS[APPLICATION_STATUSES.REJECTED]}
              </div>
            </div>
            <div className="stat-item stat-withdrawn">
              <div className="stat-value">
                {statsData.by_status?.[APPLICATION_STATUSES.WITHDRAWN] || 0}
              </div>
              <div className="stat-label">
                {STATUS_LABELS[APPLICATION_STATUSES.WITHDRAWN]}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Onboarding Banner */}
      {showOnboardingBanner &&
        statsData.by_status?.[APPLICATION_STATUSES.INTERVIEWING] > 0 &&
        applications.some(
          (a) =>
            a.status === APPLICATION_STATUSES.INTERVIEWING && !a.current_stage
        ) && (
          <Card
            padding="medium"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div style={{ fontSize: "48px", flexShrink: 0 }}>📋</div>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "18px",
                    fontWeight: 600,
                  }}
                >
                  Bước tiếp theo: Tạo giai đoạn phỏng vấn
                </h3>
                <p
                  style={{
                    margin: "0 0 16px 0",
                    fontSize: "14px",
                    opacity: 0.95,
                  }}
                >
                  Bạn có{" "}
                  <strong>
                    {statsData.by_status?.[APPLICATION_STATUSES.INTERVIEWING]}{" "}
                    ứng viên
                  </strong>{" "}
                  đang ở trạng thái phỏng vấn. Hãy tạo các giai đoạn phỏng vấn
                  (schedule) để tiếp tục quy trình tuyển dụng.
                </p>
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate(`/recruiter/jobs/${jobId}/stage-management`)
                  }
                  style={{
                    background: "white",
                    color: "#667eea",
                    border: "none",
                    fontWeight: 600,
                  }}
                >
                  🎯 Đến trang quản lý Stage →
                </Button>
              </div>
              <button
                onClick={() => {
                  localStorage.setItem(
                    `onboarding_banner_dismissed_${jobId}`,
                    "true"
                  );
                  setShowOnboardingBanner(false);
                }}
                style={{
                  alignSelf: "flex-start",
                  background: "transparent",
                  border: "none",
                  color: "white",
                  fontSize: "24px",
                  cursor: "pointer",
                  padding: "4px 8px",
                  opacity: 0.8,
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.opacity = "1")}
                onMouseLeave={(e) => (e.target.style.opacity = "0.8")}
                title="Ẩn banner này"
              >
                ✕
              </button>
            </div>
          </Card>
        )}

      {/* Filters Section */}
      <Card padding="medium" className="filters-card">
        <div className="filters-row">
          <div className="search-wrapper">
            <Input
              placeholder="Tìm kiếm theo tên ứng viên..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="filter-chips">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status.value}
                className={`filter-chip ${
                  statusFilter === status.value ? "active" : ""
                }`}
                onClick={() => handleStatusFilter(status.value)}
              >
                {status.label}
              </button>
            ))}
          </div>
          <div className="filter-controls">
            <Select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              style={{ minWidth: "150px" }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <button
              className={`sort-order-btn ${order === "desc" ? "desc" : "asc"}`}
              onClick={() => setOrder(order === "desc" ? "asc" : "desc")}
              title={order === "desc" ? "Giảm dần" : "Tăng dần"}
            >
              {order === "desc" ? "↓" : "↑"}
            </button>
          </div>
          <div className="view-toggle">
            <button
              className="manage-stage-btn"
              onClick={() =>
                navigate(`/recruiter/jobs/${jobId}/stage-management`)
              }
              title="Tạo và quản lý giai đoạn phỏng vấn cho nhiều ứng viên cùng lúc"
              style={{
                padding: "8px 16px",
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 500,
                marginRight: "12px",
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              🎯 Quản lý Stage
              {statsData.by_status?.[APPLICATION_STATUSES.INTERVIEWING] > 0 && (
                <span
                  style={{
                    background: "#ef4444",
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {statsData.by_status[APPLICATION_STATUSES.INTERVIEWING]}
                </span>
              )}
            </button>
            <button
              className={`view-toggle-btn ${
                viewMode === "table" ? "active" : ""
              }`}
              onClick={() => setViewMode("table")}
              title="Xem dạng bảng"
            >
              Bảng
            </button>
            <button
              className={`view-toggle-btn ${
                viewMode === "card" ? "active" : ""
              }`}
              onClick={() => setViewMode("card")}
              title="Xem dạng thẻ"
            >
              Thẻ
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedApps.length > 0 && (
          <div className="bulk-actions">
            <span className="bulk-actions-label">
              Đã chọn {selectedApps.length} ứng viên
            </span>
            <div className="bulk-actions-buttons">
              <Button
                variant="outline"
                size="small"
                onClick={() => handleBulkShortlist("add")}
              >
                Thêm vào shortlist
              </Button>
              <Button
                variant="outline"
                size="small"
                onClick={() => handleBulkShortlist("remove")}
              >
                Bỏ khỏi shortlist
              </Button>
              <Button
                variant="outline"
                size="small"
                onClick={() => handleBulkAction("review")}
              >
                Đánh dấu đã xem
              </Button>
              <Button
                variant="primary"
                size="small"
                onClick={handleMoveToInterviewing}
              >
                ➡️ Chuyển sang phỏng vấn
              </Button>
              <Button
                variant="outline"
                size="small"
                onClick={() => handleBulkAction("accept")}
              >
                Chấp nhận
              </Button>
              <Button
                variant="outline"
                size="small"
                onClick={() => handleBulkAction("accept")}
              >
                Chấp nhận
              </Button>
              <Button
                variant="outline"
                size="small"
                onClick={() => handleBulkAction("reject")}
              >
                Từ chối
              </Button>
              {selectedApps.length >= 2 && selectedApps.length <= 4 && (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={handleCompare}
                >
                  So sánh ({selectedApps.length})
                </Button>
              )}
              <Button
                variant="ghost"
                size="small"
                onClick={() => setSelectedApps([])}
              >
                Bỏ chọn
              </Button>
            </div>
          </div>
        )}
      </Card>

      {loading && (
        <Card
          padding="large"
          role="status"
          aria-label="Đang tải danh sách ứng viên"
        >
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div aria-hidden="true">Đang tải...</div>
            <div className="loading-spinner" aria-hidden="true"></div>
          </div>
        </Card>
      )}

      {error && (
        <Card
          padding="medium"
          style={{ background: "#fee", border: "1px solid #fcc" }}
        >
          <p style={{ color: "#c00", margin: 0 }}>{error}</p>
          <Button
            variant="outline"
            onClick={fetchApplications}
            style={{ marginTop: "12px" }}
          >
            Thử lại
          </Button>
        </Card>
      )}

      {!loading && !error && applications.length === 0 && (
        <Card padding="large" className="empty-state-card">
          <div className="empty-state">
            <h3 className="empty-state-title">Chưa có ứng viên nào</h3>
            <p className="empty-state-description">
              Chưa có ứng viên nào ứng tuyển cho tin tuyển dụng này
            </p>
          </div>
        </Card>
      )}

      {!loading && !error && applications.length > 0 && (
        <>
          {viewMode === "table" ? (
            <div className="applications-table-wrapper">
              <table
                className="applications-table"
                role="table"
                aria-label="Danh sách ứng viên"
              >
                <thead>
                  <tr role="row">
                    <th
                      style={{ width: "40px" }}
                      role="columnheader"
                      aria-label="Chọn tất cả"
                    >
                      <input
                        type="checkbox"
                        checked={
                          selectedApps.length === applications.length &&
                          applications.length > 0
                        }
                        onChange={handleSelectAll}
                        aria-label="Chọn tất cả ứng viên"
                      />
                    </th>
                    <th role="columnheader">Ứng viên</th>
                    <th role="columnheader">Trạng thái</th>
                    <th role="columnheader">Stage</th>
                    <th role="columnheader">Ngày ứng tuyển</th>
                    <th role="columnheader" style={{ textAlign: "center" }}>
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => {
                    // API trả về app.candidate (backend format) hoặc app.profiles (legacy)
                    const profile =
                      app.profiles ||
                      app.candidate ||
                      app.candidate?.profile ||
                      {};
                    const name =
                      profile.full_name ||
                      profile.display_name ||
                      profile.name ||
                      "Chưa có tên";
                    const status = normalizeStatus(app.status);
                    const isSelected = selectedApps.includes(app.id);

                    return (
                      <tr
                        key={app.id}
                        className={isSelected ? "selected" : ""}
                        role="row"
                      >
                        <td role="cell">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectApp(app.id)}
                            aria-label={`Chọn ứng viên ${name}`}
                          />
                        </td>
                        <td>
                          <div className="candidate-info">
                            <div className="candidate-avatar">
                              {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={name} />
                              ) : (
                                <span>{getInitials(name)}</span>
                              )}
                            </div>
                            <div>
                              <strong>{name}</strong>
                              {profile.headline && (
                                <div className="candidate-headline">
                                  {profile.headline}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge
                            variant={STATUS_COLORS[status] || "default"}
                            size="small"
                          >
                            {STATUS_LABELS[status] || status}
                          </Badge>
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            {app.current_stage?.stage_name || "--"}
                            {app.current_stage?.metadata
                              ?.is_group_interview && (
                              <Badge
                                variant="info"
                                size="small"
                                title="Group Interview Round"
                              >
                                👥
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td>{formatDate(app.applied_at)}</td>
                        <td>
                          <div className="application-actions">
                            <Button
                              variant={
                                shortlistedIds.has(app.id)
                                  ? "primary"
                                  : "outline"
                              }
                              size="small"
                              onClick={() => handleShortlistToggle(app.id)}
                              title={
                                shortlistedIds.has(app.id)
                                  ? "Bỏ khỏi shortlist"
                                  : "Thêm vào shortlist"
                              }
                            >
                              {shortlistedIds.has(app.id) ? "★" : "☆"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="small"
                              onClick={() => handleViewDetail(app.id)}
                            >
                              Xem chi tiết
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="applications-card-grid">
              {applications.map((app) => {
                const profile =
                  app.profiles || app.candidate || app.candidate?.profile || {};
                const name =
                  profile.full_name ||
                  profile.display_name ||
                  profile.name ||
                  "Chưa có tên";
                const status = app.status || "pending";
                const isSelected = selectedApps.includes(app.id);

                return (
                  <Card
                    key={app.id}
                    variant="elevated"
                    padding="medium"
                    className={`application-card ${
                      isSelected ? "selected" : ""
                    }`}
                    hover
                  >
                    <div className="application-card-header">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectApp(app.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Badge
                        variant={STATUS_COLORS[status] || "default"}
                        size="small"
                      >
                        {STATUS_LABELS[status] || status}
                      </Badge>
                    </div>
                    <div className="application-card-body">
                      <div className="candidate-info">
                        <div className="candidate-avatar">
                          {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={name} />
                          ) : (
                            <span>{getInitials(name)}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="candidate-name">{name}</h3>
                          {profile.headline && (
                            <p className="candidate-headline">
                              {profile.headline}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="application-card-meta">
                        <div className="meta-item">
                          <span className="meta-label">Stage:</span>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <span>{app.current_stage?.stage_name || "--"}</span>
                            {app.current_stage?.metadata
                              ?.is_group_interview && (
                              <Badge
                                variant="info"
                                size="small"
                                title="Group Interview Round"
                              >
                                👥
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Ngày ứng tuyển:</span>
                          <span>{formatDate(app.applied_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="application-card-actions">
                      <Button
                        variant={
                          shortlistedIds.has(app.id) ? "primary" : "outline"
                        }
                        size="small"
                        onClick={() => handleShortlistToggle(app.id)}
                        title={
                          shortlistedIds.has(app.id)
                            ? "Bỏ khỏi shortlist"
                            : "Thêm vào shortlist"
                        }
                      >
                        {shortlistedIds.has(app.id)
                          ? "★ Shortlisted"
                          : "☆ Shortlist"}
                      </Button>
                      <Button
                        variant="default"
                        size="small"
                        onClick={() => handleViewDetail(app.id)}
                      >
                        Xem chi tiết
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {pagination.total_pages > 1 && (
            <div className="pagination">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </Button>
              <div className="pagination-info">
                Trang {currentPage} / {pagination.total_pages}
              </div>
              <Button
                variant="outline"
                disabled={currentPage >= pagination.total_pages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(pagination.total_pages, p + 1))
                }
              >
                Sau
              </Button>
            </div>
          )}
        </>
      )}

      {/* Bulk Action Confirmation */}
      <ConfirmModal
        isOpen={showBulkConfirm}
        onClose={() => {
          setShowBulkConfirm(false);
          setBulkAction(null);
        }}
        onConfirm={confirmBulkAction}
        title="Xác nhận thao tác"
        message={`Bạn có chắc chắn muốn ${
          bulkAction === "accept"
            ? "chấp nhận"
            : bulkAction === "reject"
            ? "từ chối"
            : "đánh dấu đã xem"
        } ${selectedApps.length} ứng viên đã chọn?`}
        confirmText="Xác nhận"
        cancelText="Hủy"
        variant={bulkAction === "reject" ? "danger" : "default"}
        ariaLabel="Xác nhận thao tác hàng loạt trên ứng viên"
      />

      {/* Compare Modal */}
      <CompareModal
        isOpen={showCompareModal}
        onClose={() => {
          setShowCompareModal(false);
          setCompareCandidates([]);
        }}
        candidateIds={compareCandidates}
      />
    </div>
  );
}
