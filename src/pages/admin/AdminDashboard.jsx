import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../services/adminApi";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJobs: 0,
    pendingJobs: 0,
    activeJobs: 0,
    unverifiedUsers: 0,
    deletedJobs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [usersRes, jobsRes, pendingRes, unverifiedRes] = await Promise.all([
        adminApi.getAllUsers({ page: 1, limit: 1 }),
        adminApi.getAllJobs({ page: 1, limit: 100 }),
        adminApi.getPendingJobs({ page: 1, limit: 1 }),
        adminApi.getAllUsers({ page: 1, limit: 100, verified: false }),
      ]);

      const jobsData = jobsRes?.data?.jobs || [];
      const activeJobsCount = jobsData.filter(
        (j) => j.status === "approved" && !j.deleted
      ).length;
      const deletedJobsCount = jobsData.filter((j) => j.deleted).length;

      setStats({
        totalUsers: usersRes?.data?.pagination?.total || 0,
        totalJobs: jobsRes?.data?.pagination?.total || 0,
        pendingJobs: pendingRes?.data?.pagination?.total || 0,
        activeJobs: activeJobsCount,
        unverifiedUsers: unverifiedRes?.data?.pagination?.total || 0,
        deletedJobs: deletedJobsCount,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Tổng người dùng",
      value: stats.totalUsers,
      subtitle: "Người dùng đã đăng ký",
      link: "/admin/users",
      color: "#3b82f6",
      icon: "👥",
    },
    {
      title: "Tổng công việc",
      value: stats.totalJobs,
      subtitle: "Công việc trong hệ thống",
      link: "/admin/jobs",
      color: "#10b981",
      icon: "💼",
    },
    {
      title: "Chờ duyệt",
      value: stats.pendingJobs,
      subtitle: "Cần xử lý ngay",
      link: "/admin/jobs/pending",
      color: "#f59e0b",
      highlight: stats.pendingJobs > 0,
      icon: "⏳",
    },
    {
      title: "Công việc đang hoạt động",
      value: stats.activeJobs,
      subtitle: "Đang hiển thị",
      link: "/admin/jobs?status=approved",
      color: "#8b5cf6",
      icon: "✅",
    },
    {
      title: "Người dùng chưa xác thực",
      value: stats.unverifiedUsers,
      subtitle: "Cần xác thực email",
      link: "/admin/users?verified=false",
      color: "#ef4444",
      highlight: stats.unverifiedUsers > 0,
      icon: "⚠️",
    },
    {
      title: "Công việc đã xóa",
      value: stats.deletedJobs,
      subtitle: "Đã ẩn khỏi hệ thống",
      link: "/admin/jobs?deleted=true",
      color: "#64748b",
      icon: "🗑️",
    },
  ];

  const quickActions = [
    {
      label: "Quản lý người dùng",
      path: "/admin/users",
      description: "Xem, chỉnh sửa và xóa người dùng",
      icon: "👥",
      color: "#3b82f6",
    },
    {
      label: "Quản lý công việc",
      path: "/admin/jobs",
      description: "Quản lý tất cả công việc trong hệ thống",
      icon: "💼",
      color: "#10b981",
    },
    {
      label: "Duyệt công việc",
      path: "/admin/jobs/pending",
      description: "Xem xét và phê duyệt công việc mới",
      icon: "⏳",
      color: "#f59e0b",
    },
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <h1>Bảng điều khiển Admin</h1>
        <p className="admin-muted">Quản lý hệ thống JobFinder</p>
      </div>

      {loading ? (
        <div className="admin-loading-state">Đang tải...</div>
      ) : (
        <>
          <div className="admin-stats-grid">
            {statCards.map((card, idx) => (
              <Link key={idx} to={card.link} className="admin-stat-card">
                <div
                  className="admin-stat-icon"
                  style={{ backgroundColor: `${card.color}15` }}
                >
                  <span style={{ fontSize: "24px" }}>{card.icon}</span>
                </div>
                <div className="admin-stat-content">
                  <div
                    className="admin-stat-value"
                    style={{ color: card.color }}
                  >
                    {card.value.toLocaleString("vi-VN")}
                  </div>
                  <div className="admin-stat-title">{card.title}</div>
                  <div className="admin-stat-subtitle">{card.subtitle}</div>
                </div>
                {card.highlight && (
                  <div className="admin-stat-badge">Cần xử lý</div>
                )}
              </Link>
            ))}
          </div>

          <div className="admin-quick-actions">
            <h2>Thao tác nhanh</h2>
            <div className="admin-actions-grid">
              {quickActions.map((action, idx) => (
                <Link key={idx} to={action.path} className="admin-action-card">
                  <div
                    className="admin-action-icon"
                    style={{ backgroundColor: `${action.color}15` }}
                  >
                    <span style={{ fontSize: "20px" }}>{action.icon}</span>
                  </div>
                  <div className="admin-action-content">
                    <div className="admin-action-label">{action.label}</div>
                    <div className="admin-action-description">
                      {action.description}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
