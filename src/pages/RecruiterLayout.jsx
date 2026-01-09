import React, { useState } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import NotificationDropdown from "../components/NotificationDropdown"
import { getRefreshToken, logout as clearAuth, getAuthUser } from "../auth/auth.js"
import { AuthClient } from "../services/authClient"
import { companyApi } from "../services/companyApi"
import "../pages/recruiter-dashboard.css"
import { useEffect } from "react"

export default function RecruiterLayout() {
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  const [company, setCompany] = useState(null)

  const navItems = [
    { label: "Bảng điều khiển", icon: "", path: "/recruiter/dashboard" },
    { label: "Tin tuyển dụng", icon: "", path: "/recruiter/jobs" },
    { label: "Shortlisted", icon: "", path: "/recruiter/shortlisted" },
    { label: "Talent pool", icon: "", path: "/recruiter/talent-pool" },
    // company profile intentionally omitted from sidebar (kept in profile menu)
  ]

  // Minimal header + sidebar shell reused from existing styles.
  useEffect(() => {
    let active = true
    const loadCompany = async () => {
      try {
        const data = await companyApi.getMyCompany()
        if (active) setCompany(data)
      } catch {
        if (active) setCompany(null)
      }
    }
    loadCompany()
    return () => {
      active = false
    }
  }, [])
  return (
    <div className="rd-shell">
      <header className="rd-navbar">
        <div className="rd-logo-block">
          <button
            className="rd-hamburger"
            type="button"
            aria-label="Thu gọn menu"
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
          <div className="rd-logo">
            <span className="rd-logo-badge">JP</span>
            <div>
              <strong>JobFinder Recruiter</strong>
              <p>Khu vực nhà tuyển dụng</p>
            </div>
          </div>
        </div>

        <div className="rd-nav-actions">
          <button className="rd-icon-btn" aria-label="Trợ giúp">
            ?
          </button>

          <NotificationDropdown
            isOpen={notificationOpen}
            onToggle={setNotificationOpen}
          />

          <div className="rd-user-menu">
            <div
              className="rd-user-pill"
              onClick={() => setProfileOpen((open) => !open)}
              role="button"
              tabIndex={0}
            >
              <div className="rd-avatar">
                {company?.logo_url ? (
                  <img src={company.logo_url} alt={company?.name || "Company logo"} />
                ) : (
                  <span>
                    {(company?.name || getAuthUser()?.name || "R")
                      .toString()
                      .trim()
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <strong>{company?.name || getAuthUser()?.name || "Nhà tuyển dụng"}</strong>
                <small>{getAuthUser()?.role || "recruiter"}</small>
              </div>
              <span className="rd-chevron">▼</span>
            </div>
            {profileOpen && (
              <div className="rd-profile-menu">
                <button type="button" onClick={() => navigate("/recruiter/company")}>
                  Hồ sơ công ty
                </button>
                <button type="button" onClick={() => navigate("/recruiter/change-password")}>
                  Đổi mật khẩu
                </button>
                <div style={{ height: 1, background: "rgba(15,23,42,0.06)", margin: "8px 0" }} />
                <button
                  type="button"
                  className="danger"
                  onClick={async () => {
                    setProfileOpen(false)
                    try {
                      const refresh = getRefreshToken()
                      if (refresh) {
                        await AuthClient.logout(refresh)
                      }
                    } catch (err) {
                      console.warn("Đăng xuất recruiter (server) thất bại:", err?.message)
                    } finally {
                      clearAuth()
                      navigate("/login", { replace: true })
                    }
                  }}
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="rd-layout">
        <aside className={`rd-sidebar${sidebarOpen ? " is-open" : ""}`}>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path)
            return (
              <button
                key={item.label}
                className={`rd-nav-item${isActive ? " active" : ""}`}
                type="button"
                onClick={() => navigate(item.path)}
              >
                <span className="rd-nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </aside>

        <main className="rd-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}


