import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { JobService } from "../lib/api.js";
import { jobsApi } from "../services/jobsApi";
import { useMyJobs, useBulkJobActions } from "../hooks/useJobs";
import {
  Button,
  Card,
  CardBody,
  Badge,
  Input,
  ConfirmModal,
} from "../components/shared";
import "../styles/shared.css";
import "./MyJobs.css";

const PAGE_SIZE = 20;
const JOB_STATUSES = [
  { value: "", label: "Tất cả" },
  { value: "draft", label: "Nháp" },
  { value: "approved", label: "Đã duyệt" },
  { value: "closed", label: "Đã đóng" },
];

const JOB_TYPE_LABELS = {
  full_time: "Toàn thời gian",
  part_time: "Bán thời gian",
  contract: "Hợp đồng",
};

const STATUS_LABELS = {
  draft: "Nháp",
  approved: "Đã duyệt",
  closed: "Đã đóng",
};

const STATUS_COLORS = {
  draft: "gray",
  approved: "green",
  closed: "red",
};

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

export default function MyJobs() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'card'
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Use the new hook for jobs management
  const {
    jobs,
    loading,
    error,
    pagination,
    filters,
    fetchJobs,
    updateFilters,
    goToPage,
    refresh,
  } = useMyJobs({
    page: 1,
    limit: PAGE_SIZE,
    status: statusFilter || undefined,
    sort_by: "posted_at",
    sort_order: "desc",
  });

  // Bulk actions hook
  const {
    bulkClose,
    bulkDelete,
    bulkPublish,
    loading: bulkLoading,
    bulkOpen,
  } = useBulkJobActions();

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateFilters({ search: searchQuery || undefined });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, updateFilters]);

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    updateFilters({ status: value || undefined });
  };

  const handleEdit = (jobId) => {
    // Navigate to edit-job page with jobId in URL params
    navigate(`/edit-job/${jobId}`);
  };

  const handleDelete = async (jobId, title) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tin tuyển dụng "${title}"?`)) {
      return;
    }
    try {
      await jobsApi.deleteJob(jobId);
      alert("Đã xóa tin tuyển dụng thành công.");
      refresh();
    } catch (err) {
      alert(err?.message || "Không thể xóa tin tuyển dụng. Vui lòng thử lại.");
    }
  };

  const handleStatusToggle = async (jobId, currentStatus) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) {
      alert("Không tìm thấy tin tuyển dụng.");
      return;
    }

    // If job was rejected by admin (closed && not admin_approved), recruiter must edit & publish again
    if (currentStatus === "closed" && job.admin_approved === false) {
      if (
        confirm(
          "Tin này đã bị admin từ chối. Bạn cần sửa và gửi lại để admin duyệt. Mở trang chỉnh sửa bây giờ?"
        )
      ) {
        navigate(`/edit-job/${jobId}`);
      }
      return;
    }

    const newStatus = currentStatus === "approved" ? "closed" : "approved";
    try {
      await jobsApi.updateJobStatus(jobId, { status: newStatus });
      refresh();
      setSelectedJobs([]);
    } catch (err) {
      alert(err?.message || "Không thể thay đổi trạng thái. Vui lòng thử lại.");
    }
  };

  const handleSelectJob = (jobId) => {
    setSelectedJobs((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleSelectAll = () => {
    if (selectedJobs.length === jobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(jobs.map((job) => job.id));
    }
  };

  const handleBulkDelete = async () => {
    try {
      await bulkDelete(selectedJobs);
      refresh();
      setSelectedJobs([]);
      setShowBulkDeleteConfirm(false);
    } catch (err) {
      alert(
        err?.message || "Không thể xóa một số tin tuyển dụng. Vui lòng thử lại."
      );
    }
  };

  const handleBulkOpen = async () => {
    try {
      // Only try to open jobs that are currently closed
      const closedIds = selectedJobs.filter((id) => {
        const job = jobs.find((j) => j.id === id);
        return job && job.status === "closed";
      });

      if (closedIds.length === 0) {
        alert("Không có tin đóng để mở lại.");
        return;
      }

      await bulkOpen(closedIds);
      refresh();
      setSelectedJobs([]);
      alert(`Đã mở lại ${closedIds.length} tin.`);
    } catch (err) {
      alert(
        err?.message || "Không thể mở các tin tuyển dụng. Vui lòng thử lại."
      );
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    try {
      if (newStatus === "publish") {
        const result = await bulkPublish(selectedJobs);
        refresh();
        setSelectedJobs([]);
        if (
          result &&
          result.skipped_job_ids &&
          result.skipped_job_ids.length > 0
        ) {
          alert(
            `Đã gửi ${result.published_count || 0} tin để admin duyệt. ${
              result.skipped_job_ids.length
            } tin bị bỏ qua vì không ở trạng thái nháp.`
          );
        } else {
          alert(`Đã gửi ${result.published_count || 0} tin để admin duyệt.`);
        }
        return;
      }

      // fallback: close
      await bulkClose(selectedJobs);
      refresh();
      setSelectedJobs([]);
    } catch (err) {
      alert(err?.message || "Không thể thay đổi trạng thái. Vui lòng thử lại.");
    }
  };

  return (
    <div className="section my-jobs-page">
      <div className="my-jobs-header">
        <div>
          <h1 className="my-jobs-title">Quản lý tin tuyển dụng</h1>
          <p className="my-jobs-subtitle">
            Quản lý và theo dõi tất cả tin tuyển dụng của bạn
          </p>
        </div>
        <Button
          variant="primary"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = "/post-job";
          }}
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          }
        >
          Đăng tin mới
        </Button>
      </div>

      {/* Filters and Search */}
      <Card padding="medium" className="my-jobs-filters">
        <div className="filters-row">
          <div className="search-wrapper">
            <Input
              placeholder="Tìm kiếm theo tiêu đề..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="M21 21l-4.35-4.35"></path>
                </svg>
              }
            />
          </div>
          <div className="filter-chips">
            {JOB_STATUSES.map((status) => (
              <button
                key={status.value}
                className={`filter-chip ${
                  statusFilter === status.value ? "active" : ""
                }`}
                onClick={() => handleStatusChange(status.value)}
              >
                {status.label}
              </button>
            ))}
          </div>
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${
                viewMode === "table" ? "active" : ""
              }`}
              onClick={() => setViewMode("table")}
              title="Xem dạng bảng"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"></path>
              </svg>
            </button>
            <button
              className={`view-toggle-btn ${
                viewMode === "card" ? "active" : ""
              }`}
              onClick={() => setViewMode("card")}
              title="Xem dạng thẻ"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedJobs.length > 0 && (
          <div className="bulk-actions">
            <span className="bulk-actions-label">
              Đã chọn {selectedJobs.length} tin
            </span>
            <div className="bulk-actions-buttons">
              <Button
                variant="outline"
                size="small"
                onClick={() => handleBulkStatusChange("publish")}
                title="Gửi tất cả tin nháp để admin duyệt"
              >
                Gửi duyệt
              </Button>
              <Button variant="outline" size="small" onClick={handleBulkOpen}>
                Mở tất cả
              </Button>
              <Button
                variant="outline"
                size="small"
                onClick={() => handleBulkStatusChange("closed")}
              >
                Đóng tất cả
              </Button>
              <Button
                variant="danger"
                size="small"
                onClick={() => setShowBulkDeleteConfirm(true)}
              >
                Xóa đã chọn
              </Button>
              <Button
                variant="ghost"
                size="small"
                onClick={() => setSelectedJobs([])}
              >
                Bỏ chọn
              </Button>
            </div>
          </div>
        )}
      </Card>

      {loading && (
        <div className="card" style={{ padding: "40px", textAlign: "center" }}>
          <p>Đang tải...</p>
        </div>
      )}

      {error && (
        <div
          className="card"
          style={{
            padding: "20px",
            background: "#fee",
            border: "1px solid #fcc",
          }}
        >
          <p style={{ color: "#c00", margin: 0 }}>{error}</p>
          <button
            className="btn"
            onClick={fetchJobs}
            style={{ marginTop: "12px" }}
          >
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && jobs.length === 0 && (
        <Card padding="large" className="empty-state-card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ opacity: 0.3 }}
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <h3 className="empty-state-title">Chưa có tin tuyển dụng nào</h3>
            <p className="empty-state-description">
              Bắt đầu bằng cách đăng tin tuyển dụng đầu tiên của bạn
            </p>
            <Button
              variant="primary"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "/post-job";
              }}
              icon={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              }
            >
              Đăng tin đầu tiên
            </Button>
          </div>
        </Card>
      )}

      {!loading && !error && jobs.length > 0 && (
        <>
          {viewMode === "table" ? (
            <div className="jobs-table-wrapper">
              <table className="jobs-table">
                <thead>
                  <tr>
                    <th style={{ width: "40px" }}>
                      <input
                        type="checkbox"
                        checked={
                          selectedJobs.length === jobs.length && jobs.length > 0
                        }
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>Tiêu đề</th>
                    <th>Trạng thái</th>
                    <th>Hết hạn</th>
                    <th style={{ textAlign: "center" }}>Ứng tuyển</th>
                    <th style={{ textAlign: "center" }}>Lượt xem</th>
                    <th style={{ textAlign: "center" }}>Xem</th>
                    <th style={{ textAlign: "center" }}>Sửa</th>
                    <th style={{ textAlign: "center" }}>Xóa</th>
                    <th style={{ textAlign: "center" }}>Đóng</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => {
                    const location =
                      job.locations?.name ||
                      job.location?.name ||
                      job.location_text ||
                      "--";
                    const status = job.status || "draft";
                    const statusLabel = STATUS_LABELS[status] || status;
                    const isSelected = selectedJobs.includes(job.id);

                    return (
                      <tr key={job.id} className={isSelected ? "selected" : ""}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectJob(job.id)}
                          />
                        </td>
                        <td>
                          <strong>{job.title || "Chưa có tiêu đề"}</strong>
                          {job.status === "closed" &&
                            job.admin_approved === false &&
                            job.metadata?.rejection_reason && (
                              <div
                                style={{
                                  marginTop: 6,
                                  color: "#b91c1c",
                                  fontSize: 12,
                                }}
                              >
                                Lý do bị từ chối:{" "}
                                {job.metadata.rejection_reason}
                              </div>
                            )}
                        </td>
                        <td>
                          <Badge
                            variant={
                              status === "approved"
                                ? "success"
                                : status === "closed"
                                ? "danger"
                                : "default"
                            }
                            size="small"
                          >
                            {statusLabel}
                          </Badge>
                        </td>
                        <td>{formatDate(job.expires_at)}</td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            onClick={() =>
                              navigate(`/recruiter/jobs/${job.id}/applications`)
                            }
                            style={{
                              background: "none",
                              border: "none",
                              color: "#2563eb",
                              cursor: "pointer",
                              textDecoration: "underline",
                              fontSize: "14px",
                              fontWeight: "500",
                            }}
                          >
                            {job._count?.applications ||
                              job.applications_count ||
                              0}
                          </button>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {job._count?.job_views ||
                            job.views_count ||
                            job._count?.views ||
                            0}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <Link
                            to={`/recruiter/jobs/${job.id}/view`}
                            className="btn-shared btn-ghost btn-small"
                          >
                            Xem
                          </Link>
                        </td>
                        {/* removed duplicate 'Xem chi tiết' column to keep only 'Xem' */}
                        <td style={{ textAlign: "center" }}>
                          <Button
                            variant="ghost"
                            size="small"
                            onClick={() => handleEdit(job.id)}
                          >
                            Sửa
                          </Button>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <Button
                            variant="ghost"
                            size="small"
                            onClick={() => handleDelete(job.id, job.title)}
                          >
                            Xóa
                          </Button>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {status === "approved" && (
                            <Button
                              variant="outline"
                              size="small"
                              onClick={() => handleStatusToggle(job.id, status)}
                            >
                              Đóng
                            </Button>
                          )}
                          {status === "closed" && (
                            <>
                              {job.admin_approved ? (
                                <Button
                                  variant="outline"
                                  size="small"
                                  onClick={() =>
                                    handleStatusToggle(job.id, status)
                                  }
                                >
                                  Mở lại
                                </Button>
                              ) : (
                                <Button
                                  variant="primary"
                                  size="small"
                                  onClick={() =>
                                    navigate(`/edit-job/${job.id}`)
                                  }
                                >
                                  Sửa & Gửi duyệt
                                </Button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="jobs-card-grid">
              {jobs.map((job) => {
                const location =
                  job.locations?.name ||
                  job.location?.name ||
                  job.location_text ||
                  "--";
                const status = job.status || "draft";
                const statusLabel = STATUS_LABELS[status] || status;
                const isSelected = selectedJobs.includes(job.id);

                return (
                  <Card
                    key={job.id}
                    variant="elevated"
                    padding="medium"
                    className={`job-card ${isSelected ? "selected" : ""}`}
                    hover
                  >
                    <div className="job-card-header">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectJob(job.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Badge
                        variant={
                          status === "approved"
                            ? "success"
                            : status === "closed"
                            ? "danger"
                            : "default"
                        }
                        size="small"
                      >
                        {statusLabel}
                      </Badge>
                    </div>
                    <h3 className="job-card-title">
                      {job.title || "Chưa có tiêu đề"}
                    </h3>
                    {job.status === "closed" &&
                      job.admin_approved === false &&
                      job.metadata?.rejection_reason && (
                        <div
                          style={{
                            marginTop: 6,
                            color: "#b91c1c",
                            fontSize: 13,
                          }}
                        >
                          Lý do bị từ chối: {job.metadata.rejection_reason}
                        </div>
                      )}

                    <div className="job-card-stats">
                      <div className="job-stat">
                        <span className="stat-label">Ứng tuyển</span>
                        <button
                          onClick={() =>
                            navigate(`/recruiter/jobs/${job.id}/applications`)
                          }
                          style={{
                            background: "none",
                            border: "none",
                            color: "#2563eb",
                            cursor: "pointer",
                            textDecoration: "underline",
                            fontSize: "16px",
                            fontWeight: "600",
                            padding: 0,
                          }}
                        >
                          {job._count?.applications ||
                            job.applications_count ||
                            0}
                        </button>
                      </div>
                      <div className="job-stat">
                        <span className="stat-label">Lượt xem</span>
                        <span className="stat-value">
                          {job._count?.job_views ||
                            job.views_count ||
                            job._count?.views ||
                            0}
                        </span>
                      </div>
                      <div className="job-stat">
                        <span className="stat-label">Đăng ngày</span>
                        <span className="stat-value">
                          {formatDate(job.posted_at)}
                        </span>
                      </div>
                    </div>
                    <div className="job-card-actions">
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() =>
                          navigate(`/recruiter/jobs/${job.id}/view`)
                        }
                        icon={
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m16.24-3.76l-4.24 4.24m-6-6L2.76 6.24m16.24 11.52l-4.24-4.24m-6 6L2.76 17.76"></path>
                          </svg>
                        }
                      >
                        Xem
                      </Button>
                      <Button
                        variant="default"
                        size="small"
                        onClick={() => handleEdit(job.id)}
                        icon={
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        }
                      >
                        Sửa
                      </Button>
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => handleDelete(job.id, job.title)}
                        icon={
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        }
                      >
                        Xóa
                      </Button>
                      {status === "approved" && (
                        <Button
                          variant="outline"
                          size="small"
                          onClick={() => handleStatusToggle(job.id, status)}
                        >
                          Đóng
                        </Button>
                      )}
                      {status === "closed" && (
                        <>
                          {job.admin_approved ? (
                            <Button
                              variant="outline"
                              size="small"
                              onClick={() => handleStatusToggle(job.id, status)}
                            >
                              Mở lại
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="small"
                              onClick={() =>
                                navigate(
                                  `/edit-job/${job.id}?submitForApproval=true`
                                )
                              }
                            >
                              Sửa & Gửi duyệt
                            </Button>
                          )}
                        </>
                      )}
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
                disabled={filters.page === 1}
                onClick={() => goToPage(filters.page - 1)}
                icon={
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                }
              >
                Trước
              </Button>
              <div className="pagination-info">
                Trang {filters.page} / {pagination.total_pages}
              </div>
              <Button
                variant="outline"
                disabled={filters.page >= pagination.total_pages}
                onClick={() => goToPage(filters.page + 1)}
                iconPosition="right"
                icon={
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                }
              >
                Sau
              </Button>
            </div>
          )}
        </>
      )}

      {/* Bulk Delete Confirmation */}
      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa ${selectedJobs.length} tin tuyển dụng đã chọn? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
      />
    </div>
  );
}
