import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { AuthClient } from "../services/authClient";
import {
  getAuthUser,
  getRefreshToken,
  logout as clearAuth,
  getRole,
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
    const loadStats = async () => {
      const role = getRole();
      if (!role || role !== "recruiter") {
        console.warn("User not authenticated or not a recruiter, role:", role);
        return;
      }

      setJobsLoading(true);
      try {
        console.log("Calling getDashboardStats...");
        const result = await ApplicationService.getDashboardStats();
        console.log(
          "Dashboard stats full response:",
          JSON.stringify(result, null, 2)
        );

        if (active) {
          if (result.success && result.data) {
            console.log("Setting stats:", {
              active: result.data.active_jobs || 0,
              draft: result.data.draft_jobs || 0,
              totalApplications: result.data.total_applications || 0,
            });
            setStats({
              active: result.data.active_jobs || 0,
              draft: result.data.draft_jobs || 0,
              totalApplications: result.data.total_applications || 0,
            });
          } else {
            console.warn("Response structure unexpected:", result);
            setStats({
              active: 0,
              draft: 0,
              totalApplications: 0,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
        console.error("Error details:", err.message, err.status, err.data);
        if (active) {
          setStats({
            active: 0,
            draft: 0,
            totalApplications: 0,
          });
        }
      } finally {
        if (active) setJobsLoading(false);
      }
    };
    loadStats();
    return () => {
      active = false;
    };
  }, []);

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
                <p className="rd-label">Số lượng đơn ứng tuyển</p>
                <p className="rd-value">
                  {jobsLoading ? "..." : stats.totalApplications}
                </p>
              </article>
            </section>
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
  );
}
