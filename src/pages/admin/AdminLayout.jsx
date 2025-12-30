import { useEffect, useState, useRef } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { getAuthUser, getRefreshToken, logout as clearAuth } from '../../auth/auth'
import { AuthClient } from '../../services/authClient'
import { ProfileClient } from '../../services/profileClient'
import './styles/admin-layout.css'

const navItems = [
  { label: 'Bảng điều khiển', path: '/admin/dashboard' },
  { label: 'Quản lý người dùng', path: '/admin/users' },
  { label: 'Quản lý công việc', path: '/admin/jobs' },
  { label: 'Duyệt công việc', path: '/admin/jobs/pending' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileMeta, setProfileMeta] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await ProfileClient.getMe()
        setProfileMeta(res?.data || res)
      } catch (error) {
        console.warn('Không thể tải profile:', error?.message)
      }
    }
    loadProfile()
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const handleLogout = async () => {
    setProfileOpen(false)
    try {
      const refresh = getRefreshToken()
      if (refresh) {
        await AuthClient.logout(refresh)
      }
    } catch (error) {
      console.warn('Đăng xuất admin thất bại:', error?.message)
    } finally {
      clearAuth()
      navigate('/login', { replace: true })
    }
  }

  const authUser = getAuthUser() || {}
  const displayName = profileMeta?.profile?.display_name || profileMeta?.profile?.full_name || authUser?.name || 'Admin'
  const avatarUrl = profileMeta?.profile?.avatar_url || authUser?.avatar || ''
  const avatarFallback = (displayName || 'A').trim().charAt(0).toUpperCase()

  return (
    <div className="admin-shell">
      <header className="admin-navbar">
        <div className="admin-logo-block">
          <button
            className="admin-hamburger"
            type="button"
            aria-label="Toggle menu"
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
          <div className="admin-logo">
            <span className="admin-logo-badge">AD</span>
            <div>
              <strong>JobFinder Admin</strong>
              <p>Khu vực quản trị</p>
            </div>
          </div>
        </div>
        <div className="admin-nav-actions">
          <div className="admin-user-menu" ref={menuRef}>
            <div className="admin-user-pill" onClick={() => setProfileOpen((open) => !open)}>
              <div className="admin-avatar">
                {avatarUrl ? <img src={avatarUrl} alt={displayName} /> : <span>{avatarFallback}</span>}
              </div>
              <div>
                <strong>{displayName}</strong>
                <small>Quản trị viên</small>
              </div>
              <span className="admin-chevron">▼</span>
            </div>
            {profileOpen && (
              <div className="admin-profile-menu">
                <button type="button" className="danger" onClick={handleLogout}>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="admin-layout">
        <aside className={`admin-sidebar${sidebarOpen ? ' is-open' : ''}`}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
                           (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path))
            return (
              <button
                key={item.label}
                className={`admin-nav-item${isActive ? ' active' : ''}`}
                type="button"
                onClick={() => {
                  navigate(item.path)
                  setSidebarOpen(false)
                }}
              >
                <span>{item.label}</span>
              </button>
            )
          })}
        </aside>

        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
