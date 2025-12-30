import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../../services/adminApi'
import './styles/admin-dashboard.css'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJobs: 0,
    pendingJobs: 0,
    activeJobs: 0,
    unverifiedUsers: 0,
    deletedJobs: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const [usersRes, jobsRes, pendingRes, unverifiedRes] = await Promise.all([
        adminApi.getAllUsers({ page: 1, limit: 1 }),
        adminApi.getAllJobs({ page: 1, limit: 100 }),
        adminApi.getPendingJobs({ page: 1, limit: 1 }),
        adminApi.getAllUsers({ page: 1, limit: 100, verified: false }),
      ])

      const jobsData = jobsRes?.data?.jobs || []
      const activeJobsCount = jobsData.filter(j => j.status === 'approved' && !j.deleted).length
      const deletedJobsCount = jobsData.filter(j => j.deleted).length

      setStats({
        totalUsers: usersRes?.data?.pagination?.total || 0,
        totalJobs: jobsRes?.data?.pagination?.total || 0,
        pendingJobs: pendingRes?.data?.pagination?.total || 0,
        activeJobs: activeJobsCount,
        unverifiedUsers: unverifiedRes?.data?.pagination?.total || 0,
        deletedJobs: deletedJobsCount,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Tổng người dùng',
      value: stats.totalUsers,
      link: '/admin/users',
      color: '#3b82f6',
    },
    {
      title: 'Tổng công việc',
      value: stats.totalJobs,
      link: '/admin/jobs',
      color: '#10b981',
    },
    {
      title: 'Chờ duyệt',
      value: stats.pendingJobs,
      link: '/admin/jobs/pending',
      color: '#f59e0b',
      highlight: stats.pendingJobs > 0,
    },
    {
      title: 'Công việc đang hoạt động',
      value: stats.activeJobs,
      link: '/admin/jobs?status=approved',
      color: '#8b5cf6',
    },
    {
      title: 'Người dùng chưa xác thực',
      value: stats.unverifiedUsers,
      link: '/admin/users?verified=false',
      color: '#ef4444',
      highlight: stats.unverifiedUsers > 0,
    },
    {
      title: 'Công việc đã xóa',
      value: stats.deletedJobs,
      link: '/admin/jobs?deleted=true',
      color: '#64748b',
    },
  ]

  const quickActions = [
    { label: 'Quản lý người dùng', path: '/admin/users' },
    { label: 'Quản lý công việc', path: '/admin/jobs' },
    { label: 'Duyệt công việc', path: '/admin/jobs/pending' },
  ]

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
                <div className="admin-stat-content">
                  <div className="admin-stat-value">{card.value.toLocaleString('vi-VN')}</div>
                  <div className="admin-stat-title">{card.title}</div>
                </div>
                {card.highlight && <div className="admin-stat-badge">Cần xử lý</div>}
              </Link>
            ))}
          </div>

          <div className="admin-quick-actions">
            <h2>Thao tác nhanh</h2>
            <div className="admin-actions-grid">
              {quickActions.map((action, idx) => (
                <Link key={idx} to={action.path} className="admin-action-card">
                  <div className="admin-action-label">{action.label}</div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
