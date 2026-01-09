import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { AuthClient } from "../services/authClient";
import {
  getAuthUser,
  getRefreshToken,
  logout as clearAuth,
} from "../auth/auth";
import { companyApi } from "../services/companyApi";
import MyJobs from "./MyJobs.jsx";
import TalentPool from "./TalentPool.jsx";
import { JobService, ApplicationService } from "../lib/api.js";
import { useSocket } from "../hooks/useSocket";
import "./recruiter-dashboard.css";

// Keep in sync with RecruiterCompanyPage to avoid mismatched completion %
const profileFieldsCompany = [
  "name",
  "description",
  "size",
  "contact_email",
  "contact_phone",
  "contact_address",
  "linkedin_url",
  "facebook_url",
  "twitter_url",
  "tax_code",
  "business_license",
];
const profileFieldsDetails = [
  "industry",
  "company_type",
  "founded_year",
  "employee_count_min",
  "employee_count_max",
  "website_url",
  "revenue_range",
  "stock_symbol",
  "culture_description",
  "headquarters_location_id",
];
const computeProfileCompletion = (company, details) => {
  let filled = 0;
  const total = profileFieldsCompany.length + profileFieldsDetails.length;
  const det = details || company?.company_details || {};

  profileFieldsCompany.forEach((key) => {
    const val = company?.[key];
    if (val !== undefined && val !== null && String(val).trim() !== "")
      filled += 1;
  });
  profileFieldsDetails.forEach((key) => {
    const val = det?.[key];
    if (val !== undefined && val !== null && String(val).trim() !== "")
      filled += 1;
  });

  const percent = total > 0 ? Math.round((filled / total) * 100) : 0;
  return { filled, total, percent };
};

// sidebar/navigation is provided by RecruiterLayout; no local navItems here.

// statCards will be computed from API data

const pipelineStatuses = [
  { key: "pending", label: "Đang chờ" },
  { key: "reviewed", label: "Đã xem" },
  { key: "accepted", label: "Chấp nhận" },
  { key: "rejected", label: "Từ chối" },
];

const STATUS_LABELS = {
  pending: "Đang chờ",
  reviewed: "Đã xem",
  accepted: "Chấp nhận",
  rejected: "Từ chối",
  withdrawn: "Đã rút",
};

// jobRows, pipeline, recent applications sẽ load từ API

// Remove fake demo candidate data — data should come from API.

function formatDate(value) {
  if (!value) return "--";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "--";
  }
}

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [company, setCompany] = useState(null);
  const [details, setDetails] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobStatusTab, setJobStatusTab] = useState("all"); // all | active | draft
  const [selectedJobId, setSelectedJobId] = useState("");
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [pipelineStatusFilter, setPipelineStatusFilter] = useState(""); // '' = tất cả
  const [pipelineDateFilter, setPipelineDateFilter] = useState(""); // yyyy-MM-dd
  const [stats, setStats] = useState({
    active: 0,
    draft: 0,
    totalApplications: 0,
    totalAccepted: 0,
  });

  // Socket connection for real-time updates
  const { isConnected, onNotification } = useSocket();

  // Lọc dữ liệu cho pipeline theo filter trạng thái & ngày
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (pipelineStatusFilter && app.status !== pipelineStatusFilter) {
        return false;
      }
      if (pipelineDateFilter) {
        const appliedAt = app.applied_at ? new Date(app.applied_at) : null;
        if (!appliedAt || Number.isNaN(appliedAt.getTime())) return false;
        const filterDate = new Date(pipelineDateFilter);
        // so sánh theo ngày (bỏ qua giờ)
        const appliedDay = new Date(
          appliedAt.getFullYear(),
          appliedAt.getMonth(),
          appliedAt.getDate()
        );
        const filterDay = new Date(
          filterDate.getFullYear(),
          filterDate.getMonth(),
          filterDate.getDate()
        );
        if (appliedDay < filterDay) return false;
      }
      return true;
    });
  }, [applications, pipelineStatusFilter, pipelineDateFilter]);

  const pipelineBuckets = useMemo(
    () =>
      pipelineStatuses.reduce((acc, status) => {
        acc[status.key] = filteredApplications.filter(
          (app) => app.status === status.key
        );
        return acc;
      }, {}),
    [filteredApplications]
  );

  // Lọc danh sách job theo tab trạng thái
  const filteredJobsByTab = useMemo(() => {
    if (jobStatusTab === "active") {
      return jobs.filter((j) => j.status === "approved");
    }
    if (jobStatusTab === "draft") {
      return jobs.filter((j) => j.status === "draft");
    }
    return jobs;
  }, [jobs, jobStatusTab]);

  const displayedJobs = useMemo(
    () => filteredJobsByTab.slice(0, 5),
    [filteredJobsByTab]
  );

  const recentApplications = useMemo(
    () =>
      filteredApplications
        .slice()
        .sort(
          (a, b) =>
            new Date(b.applied_at || 0).getTime() -
            new Date(a.applied_at || 0).getTime()
        )
        .slice(0, 5),
    [filteredApplications]
  );

  const authUser = getAuthUser() || {};
  useEffect(() => {
    let active = true;
    const loadCompany = async () => {
      try {
        const data = await companyApi.getMyCompany();
        if (active) setCompany(data);
      } catch {
        if (active) setCompany(null);
      }
      try {
        const det = await companyApi.getMyCompanyDetails();
        if (active) setDetails(det);
      } catch {
        if (active) setDetails(null);
      }
    };
    loadCompany();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadJobs = async () => {
      // Only load jobs if user is authenticated and is a recruiter
      const user = getAuthUser();
      if (!user || user.role !== "recruiter") {
        return;
      }

      setJobsLoading(true);
      try {
        const response = await JobService.myJobs({ page: 1, limit: 100 });
        const jobsData = response?.data || response || [];
        if (active) {
          setJobs(jobsData);

          // Validate selectedJobId - chỉ cho phép job thuộc về recruiter hiện tại
          const isSelectedJobValid =
            selectedJobId && jobsData.some((job) => job.id === selectedJobId);

          // Job đầu tiên cho pipeline mặc định hoặc reset nếu job hiện tại không hợp lệ
          if (jobsData.length > 0 && (!selectedJobId || !isSelectedJobValid)) {
            setSelectedJobId(jobsData[0].id);
          } else if (!jobsData.length || !isSelectedJobValid) {
            // Reset nếu không có jobs hoặc job hiện tại không thuộc về recruiter
            setSelectedJobId("");
          }

          // Calculate stats
          const activeCount = jobsData.filter(
            (j) => j.status === "approved"
          ).length;
          const draftCount = jobsData.filter(
            (j) => j.status === "draft"
          ).length;
          const totalApplications = jobsData.reduce(
            (sum, j) =>
              sum + (j._count?.applications || j.applications_count || 0),
            0
          );

          setStats({
            active: activeCount,
            draft: draftCount,
            totalApplications: totalApplications,
            totalAccepted: 0, // TODO: Calculate from applications data when available
          });
        }
      } catch (err) {
        console.error("Failed to load jobs:", err);
        // Reset selectedJobId nếu có lỗi load jobs
        setSelectedJobId("");
      } finally {
        if (active) setJobsLoading(false);
      }
    };
    loadJobs();
    return () => {
      active = false;
    };
  }, [selectedJobId]);

  // Validate selectedJobId mỗi khi jobs thay đổi - đảm bảo chỉ job thuộc về recruiter
  useEffect(() => {
    if (jobs.length > 0 && selectedJobId) {
      const isJobOwnedByRecruiter = jobs.some(
        (job) => job.id === selectedJobId
      );
      if (!isJobOwnedByRecruiter) {
        console.warn(
          `Job ${selectedJobId} không thuộc về recruiter hiện tại. Reset selectedJobId.`
        );
        setSelectedJobId(jobs[0]?.id || "");
      }
    } else if (jobs.length === 0 && selectedJobId) {
      // Không có jobs nào, reset selectedJobId
      setSelectedJobId("");
    }
  }, [jobs, selectedJobId]);

  // Load danh sách ứng viên cho job được chọn (pipeline + recent)
  useEffect(() => {
    if (!selectedJobId) {
      setApplications([]);
      return;
    }

    // Validate selectedJobId thuộc về recruiter trước khi gọi API
    const isJobOwnedByRecruiter = jobs.some((job) => job.id === selectedJobId);
    if (!isJobOwnedByRecruiter) {
      console.warn(
        `Không thể load applications: Job ${selectedJobId} không thuộc về recruiter hiện tại`
      );
      setApplications([]);
      return;
    }

    let active = true;

    const loadApplications = async () => {
      setApplicationsLoading(true);
      try {
        const res = await ApplicationService.listByJob(selectedJobId, {
          page: 1,
          limit: 50,
          sort_by: "applied_at",
          order: "desc",
        });
        const payload = res?.data || res || {};
        const list = payload.data || payload || [];
        if (active) setApplications(list);
      } catch (err) {
        console.error("Failed to load applications for dashboard:", err);
        if (active) setApplications([]);
      } finally {
        if (active) setApplicationsLoading(false);
      }
    };

    loadApplications();

    return () => {
      active = false;
    };
  }, [selectedJobId, jobs]);

  const completion = computeProfileCompletion(company, details);
  const completionPercent = completion.percent;

  const displayName = company?.name || authUser?.name || "Nhà tuyển dụng";
  const roleLabel =
    authUser?.role === "recruiter"
      ? "Nhà tuyển dụng"
      : authUser?.role || "Nhà tuyển dụng";
  const avatarUrl = company?.logo_url || authUser?.avatar;
  const avatarFallback =
    (company?.name || displayName || "R")?.trim()?.charAt(0)?.toUpperCase() ||
    "R";

  // Xác định xem đang ở trang nào
  const isTalentPoolPage = location.pathname === "/recruiter/talent-pool";
  const isDashboardPage = location.pathname === "/recruiter/dashboard";
  const isJobsPage = location.pathname === "/recruiter/jobs";

  const goToChangePassword = () => {
    setProfileOpen(false);
    navigate("/recruiter/change-password");
  };

  const goToRecentApplications = () => {
    if (selectedJobId) {
      navigate(`/recruiter/jobs/${selectedJobId}/applications`);
    } else {
      navigate("/recruiter/jobs");
    }
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    // Immediately clear local auth state and navigate, then attempt server logout in background.
    try {
      clearAuth();
      navigate("/login", { replace: true });
    } catch (err) {
      // ensure we still attempt to clear auth
      try {
        clearAuth();
      } catch (e) {}
    }

    // Fire-and-forget server logout to invalidate refresh token if present.
    (async () => {
      try {
        const refresh = getRefreshToken();
        if (refresh) {
          await AuthClient.logout(refresh);
        }
      } catch (error) {
        console.warn("Đăng xuất recruiter (server) thất bại:", error?.message);
      }
    })();
  };

  return (
    <div className="rd-dashboard-content">
      <main className="rd-main">
        {isDashboardPage && (
          <>
            <section className="rd-card rd-hero-card">
              <div>
                <p className="rd-eyebrow">Xin chào</p>
                <h1>
                  {displayName} <span aria-hidden="true">👋</span>
                </h1>
                <p>Theo dõi tiến độ tuyển dụng và quản lý pipeline của bạn.</p>
                <div className="rd-chip-row">
                  <button
                    className="rd-secondary-btn"
                    onClick={() => navigate("/recruiter/company")}
                  >
                    Quản lý hồ sơ công ty
                  </button>
                  <button
                    className="rd-secondary-btn"
                    onClick={() => navigate("/onboarding/company")}
                  >
                    Tạo hồ sơ công ty
                  </button>
                </div>
              </div>
              <Link
                to="/post-job"
                className="rd-primary-btn"
                style={{
                  textDecoration: "none",
                  display: "inline-block",
                  cursor: "pointer",
                  position: "relative",
                  zIndex: 10,
                  pointerEvents: "auto",
                }}
                onClick={(e) => {
                  console.log("Link clicked, navigating to /post-job");
                }}
              >
                Đăng tin mới
              </Link>
            </section>

            <section className="rd-grid rd-grid--stats">
              <article className="rd-card">
                <p className="rd-label">Tin đang hoạt động</p>
                <p className="rd-value">{jobsLoading ? "..." : stats.active}</p>
              </article>
              <article className="rd-card">
                <p className="rd-label">Tin nháp</p>
                <p className="rd-value">{jobsLoading ? "..." : stats.draft}</p>
              </article>
              <article className="rd-card">
                <p className="rd-label">Ứng tuyển đang mở</p>
                <p className="rd-value">
                  {jobsLoading ? "..." : stats.totalApplications}
                </p>
              </article>
              <article className="rd-card">
                <p className="rd-label">Đơn được chấp nhận (30 ngày)</p>
                <p className="rd-value">
                  {jobsLoading ? "..." : stats.totalAccepted}
                </p>
              </article>
            </section>
          </>
        )}

        {isDashboardPage && (
          <>
            <section className="rd-card">
              <div className="rd-card__head">
                <div>
                  <h2>Pipeline ứng tuyển</h2>
                  <p className="rd-muted">
                    Theo dõi trạng thái ứng viên theo từng giai đoạn.
                  </p>
                </div>
                <div className="rd-filters">
                  <select
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                  >
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title}
                      </option>
                    ))}
                  </select>
                  <select
                    value={pipelineStatusFilter}
                    onChange={(e) => setPipelineStatusFilter(e.target.value)}
                  >
                    <option value="">Tất cả trạng thái</option>
                    {pipelineStatuses.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={pipelineDateFilter}
                    onChange={(e) => setPipelineDateFilter(e.target.value)}
                  />
                </div>
              </div>

              <div className="rd-pipeline">
                {pipelineStatuses.map((status) => (
                  <div key={status.key} className="rd-column">
                    <div className="rd-column__head">
                      <span>{status.label}</span>
                      <strong>{pipelineBuckets[status.key]?.length ?? 0}</strong>
                    </div>
                    <div className="rd-column__body">
                      {applicationsLoading ? (
                        <p className="rd-empty">Đang tải...</p>
                      ) : pipelineBuckets[status.key]?.length ? (
                        pipelineBuckets[status.key].map((app) => (
                          <div key={app.id} className="rd-pill-card">
                            <p className="rd-pill-card__title">
                              {app.candidate?.full_name || "Chưa có tên"}
                            </p>
                            <p className="rd-muted">
                              {app.candidate?.headline ||
                                app.job_title ||
                                "Ứng viên ứng tuyển"}
                            </p>
                            <small>{formatDate(app.applied_at)}</small>
                          </div>
                        ))
                      ) : (
                        <p className="rd-empty">Chưa có ứng viên.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rd-table-wrapper">
                <div className="rd-table-head">
                  <h3>Ứng tuyển gần đây</h3>
                  <button className="rd-link" onClick={goToRecentApplications}>
                    Xem tất cả
                  </button>
                </div>
                <div className="rd-table rd-table--recent">
                  <div className="rd-table__row rd-table__row--head">
                    <span>Ứng viên</span>
                    <span>Vị trí</span>
                    <span>Trạng thái</span>
                    <span>Ngày nộp</span>
                    <span>Giai đoạn</span>
                    <span>Hành động</span>
                  </div>
                  {applicationsLoading ? (
                    <div className="rd-table__row">
                      <span
                        style={{ gridColumn: "1 / -1", textAlign: "center" }}
                      >
                        Đang tải...
                      </span>
                    </div>
                  ) : recentApplications.length === 0 ? (
                    <div className="rd-table__row">
                      <span
                        style={{ gridColumn: "1 / -1", textAlign: "center" }}
                      >
                        Chưa có ứng viên.
                      </span>
                    </div>
                  ) : (
                    recentApplications.map((app) => (
                      <div className="rd-table__row" key={app.id}>
                        <span>{app.candidate?.full_name || "Chưa có tên"}</span>
                        <span>
                          {app.job_title ||
                            app.job?.title ||
                            jobs.find((j) => j.id === app.job_id)?.title ||
                            "Không rõ vị trí"}
                        </span>
                        <span className="rd-status">
                          {STATUS_LABELS[app.status] || app.status}
                        </span>
                        <span>{formatDate(app.applied_at)}</span>
                        <span>{app.current_stage?.stage_name || "--"}</span>
                        <span className="rd-row-actions">
                          <button
                            onClick={() =>
                              navigate(`/recruiter/applications/${app.id}`)
                            }
                          >
                            Xem
                          </button>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="rd-card">
              <div className="rd-card__head">
                <div>
                  <h2>Tin tuyển dụng của tôi</h2>
                  <p className="rd-muted">
                    Quản lý trạng thái tin đăng và hiệu suất tiếp cận ứng viên.
                  </p>
                </div>
                <div className="rd-tabs">
                  <button
                    className={jobStatusTab === "all" ? "active" : ""}
                    onClick={() => setJobStatusTab("all")}
                  >
                    Tất cả
                  </button>
                  <button
                    className={jobStatusTab === "active" ? "active" : ""}
                    onClick={() => setJobStatusTab("active")}
                  >
                    Đang hoạt động
                  </button>
                  <button
                    className={jobStatusTab === "draft" ? "active" : ""}
                    onClick={() => setJobStatusTab("draft")}
                  >
                    Nháp
                  </button>
                </div>
              </div>

              <div className="rd-table rd-table--jobs">
                <div className="rd-table__row rd-table__row--head">
                  <span>Vị trí</span>
                  <span>Trạng thái</span>
                  <span>Loại hình</span>
                  <span>Địa điểm</span>
                  <span>Ngày đăng</span>
                  <span>Hết hạn</span>
                  <span>Ứng tuyển</span>
                  <span>Lượt xem</span>
                  <span>Hành động</span>
                </div>
                {jobsLoading ? (
                  <div className="rd-table__row">
                    <span
                      colSpan={9}
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      Đang tải...
                    </span>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="rd-table__row">
                    <span
                      colSpan={9}
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      Chưa có tin tuyển dụng nào.
                    </span>
                  </div>
                ) : (
                  displayedJobs.map((job) => {
                    const status = job.status || "draft";
                    const statusLabel =
                      status === "approved"
                        ? "Đã duyệt"
                        : status === "draft"
                        ? "Nháp"
                        : "Đã đóng";
                    const statusClass =
                      status === "approved"
                        ? "success"
                        : status === "draft"
                        ? "warning"
                        : "info";
                    const jobType =
                      job.job_type === "full_time"
                        ? "Toàn thời gian"
                        : job.job_type === "part_time"
                        ? "Bán thời gian"
                        : "Hợp đồng";
                    const location =
                      job.locations?.name || job.location?.name || "--";
                    const posted = job.posted_at
                      ? new Date(job.posted_at).toLocaleDateString("vi-VN")
                      : "--";
                    const expires = job.expires_at
                      ? new Date(job.expires_at).toLocaleDateString("vi-VN")
                      : "--";
                    const applications =
                      job._count?.applications || job.applications_count || 0;
                    const views =
                      job._count?.job_views ||
                      job.views_count ||
                      job._count?.views ||
                      0;

                    return (
                      <div className="rd-table__row" key={job.id}>
                        <span>{job.title || "Chưa có tiêu đề"}</span>
                        <span className={`rd-status ${statusClass}`}>
                          {statusLabel}
                        </span>
                        <span>{jobType}</span>
                        <span>{location}</span>
                        <span>{posted}</span>
                        <span>{expires}</span>
                        <span>{applications}</span>
                        <span>{views}</span>
                        <span className="rd-manage-cell">
                          <button
                            className="rd-secondary-btn"
                            onClick={() =>
                              navigate(`/recruiter/jobs/${job.id}/manage`)
                            }
                          >
                            Quản lý
                          </button>
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Candidate previews removed — use real API-driven components here */}
          </>
        )}

        {isJobsPage && (
          <section
            className="rd-card"
            style={{
              padding: 0,
              boxShadow: "none",
              background: "transparent",
            }}
          >
            {/* Tái sử dụng trang MyJobs nhưng vẫn giữ sidebar recruiter */}
            <MyJobs />
          </section>
        )}

        {isTalentPoolPage && <TalentPool />}
      </main>
    </div>
  )
}
