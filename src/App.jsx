import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { getRole, getAuthUser, logout, getRefreshToken } from "./auth/auth.js";
import { AuthClient } from "./services/authClient";
import { ProfileClient } from "./services/profileClient";
import SimpleModal from "./components/Modal.jsx";

export default function App() {
  const [role, setRole] = useState(getRole());
  const [user, setUser] = useState(getAuthUser());
  const [profileMeta, setProfileMeta] = useState(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isProfileScreen = location.pathname.startsWith("/profile");
  const isRecruiterScreen = location.pathname.startsWith("/recruiter");
  const isPostJobPage = location.pathname === "/post-job";
  const isRecruiterPage = isRecruiterScreen || isPostJobPage;

  const fetchProfileMeta = async () => {
    if (!getRole()) {
      setProfileMeta(null);
      return;
    }
    try {
      const res = await ProfileClient.getMe();
      setProfileMeta(res?.data || res);
    } catch (error) {
      console.warn("Không thể tải avatar:", error?.message);
    }
  };

  useEffect(() => {
    const update = async () => {
      setRole(getRole());
      setUser(getAuthUser());
      await fetchProfileMeta();
    };
    update();
    window.addEventListener("auth-changed", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("auth-changed", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const onLogout = () => setConfirmLogout(true);

  const doLogout = async () => {
    setMenuOpen(false);
    try {
      const refresh = getRefreshToken();
      if (refresh) {
        await AuthClient.logout(refresh);
      }
    } catch (error) {
      console.warn("Logout API failed:", error?.message);
    } finally {
      logout();
      setProfileMeta(null);
      setConfirmLogout(false);
      navigate("/");
    }
  };

  const recruiterAllowedPaths = [
    "/change-password",
    "/recruiter/change-password",
    "/onboarding/company",
    "/post-job",
  ];
  const employerRoles = ["recruiter"];

  useEffect(() => {
    const isEmployer = employerRoles.includes(role);
    const isRecruiterRoute = location.pathname.startsWith("/recruiter");
    const isAllowedRoute = recruiterAllowedPaths.some((path) =>
      location.pathname.startsWith(path)
    );
    if (isEmployer && !isRecruiterRoute && !isAllowedRoute) {
      navigate("/recruiter/dashboard", { replace: true });
    }
    if (!isEmployer && isRecruiterRoute) {
      navigate("/", { replace: true });
    }
  }, [role, location.pathname, navigate]);

  const displayName =
    profileMeta?.profile?.display_name ||
    profileMeta?.profile?.full_name ||
    user?.name ||
    (role === "recruiter" ? "Nhà tuyển dụng" : "Người tìm việc");
  const roleLabel = profileMeta?.role || role || "";
  const avatarUrl = profileMeta?.profile?.avatar_url || user?.avatar || "";
  const avatarFallback = (displayName || "U").trim().charAt(0).toUpperCase();

  if (isRecruiterPage) {
    return <Outlet />;
  }

  return (
    <div>
      <header className="app-header">
        <div className="container nav">
          <Link to="/" className="brand">
            <span className="brand-badge">JF</span>
            <span>JobFinder</span>
          </Link>
          <nav className="nav-links">
            <NavLink to="/search">Tìm việc</NavLink>
            <a href="#">Về chúng tôi</a>
            <a href="#">Blog</a>
          </nav>
          <div className="nav-actions">
            {role ? (
              <>
                <div
                  className="user-menu"
                  ref={menuRef}
                  style={{ position: "relative" }}
                >
                  <button
                    className="user-pill"
                    onClick={() => setMenuOpen((o) => !o)}
                    aria-haspopup="true"
                    aria-expanded={menuOpen}
                  >
                    <div className="avatar">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={displayName} />
                      ) : (
                        avatarFallback
                      )}
                    </div>
                    <div className="user-meta">
                      <div className="name" style={{ color: "#0f172a" }}>
                        {displayName}
                      </div>
                      <div
                        className="muted"
                        style={{ fontSize: 12, color: "rgba(71,85,105,0.9)" }}
                      >
                        {roleLabel}
                      </div>
                    </div>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      style={{
                        flexShrink: 0,
                        transition: "transform 0.2s",
                        transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    >
                      <path
                        d="M4 6L8 10L12 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {menuOpen && (
                    <div
                      className="card"
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "110%",
                        minWidth: 200,
                        padding: 8,
                        zIndex: 20,
                        background: "#fff",
                        border: "1px solid rgba(15,23,42,0.08)",
                        boxShadow: "0 20px 40px rgba(15,23,42,0.15)",
                        borderRadius: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        <button
                          className="btn ghost"
                          style={{
                            width: "100%",
                            textAlign: "left",
                            justifyContent: "flex-start",
                          }}
                          onClick={() => {
                            setMenuOpen(false);
                            navigate("/profile");
                          }}
                        >
                          Hồ sơ của tôi
                        </button>
                        {role === "candidate" && (
                          <>
                            <button
                              className="btn ghost"
                              style={{
                                width: "100%",
                                textAlign: "left",
                                justifyContent: "flex-start",
                              }}
                              onClick={() => {
                                setMenuOpen(false);
                                navigate("/resumes");
                              }}
                            >
                              CV của tôi
                            </button>
                            <button
                              className="btn ghost"
                              style={{
                                width: "100%",
                                textAlign: "left",
                                justifyContent: "flex-start",
                              }}
                              onClick={() => {
                                setMenuOpen(false);
                                navigate("/applications");
                              }}
                            >
                              Đơn ứng tuyển
                            </button>
                            <button
                              className="btn ghost"
                              style={{
                                width: "100%",
                                textAlign: "left",
                                justifyContent: "flex-start",
                              }}
                              onClick={() => {
                                setMenuOpen(false);
                                navigate("/saved-jobs");
                              }}
                            >
                              Việc làm đã lưu
                            </button>
                          </>
                        )}
                        {role === "recruiter" && (
                          <>
                            <button
                              className="btn ghost"
                              style={{
                                width: "100%",
                                textAlign: "left",
                                justifyContent: "flex-start",
                              }}
                              onClick={() => {
                                setMenuOpen(false);
                                navigate(
                                  "/recruiter/candidate-recommendations"
                                );
                              }}
                            >
                              👥 Ứng viên đề xuất
                            </button>
                          </>
                        )}
                        <button
                          className="btn ghost"
                          style={{
                            width: "100%",
                            textAlign: "left",
                            justifyContent: "flex-start",
                          }}
                          onClick={() => {
                            setMenuOpen(false);
                            navigate("/change-password");
                          }}
                        >
                          Đổi mật khẩu
                        </button>
                        <div
                          style={{
                            height: 1,
                            background: "rgba(255,255,255,0.08)",
                          }}
                        />
                        <button
                          className="btn ghost"
                          style={{
                            width: "100%",
                            textAlign: "left",
                            justifyContent: "flex-start",
                            color: "var(--danger, #f87171)",
                          }}
                          onClick={onLogout}
                        >
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {employerRoles.includes(role) && (
                  <NavLink
                    className="btn primary"
                    to="/post-job"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Đăng tin tuyển dụng
                  </NavLink>
                )}
              </>
            ) : (
              <>
                <NavLink className="btn" to="/login">
                  Đăng nhập
                </NavLink>
                <NavLink
                  className="btn primary"
                  to="/login?role=recruiter&redirect=/post-job"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Đăng tin tuyển dụng
                </NavLink>
              </>
            )}
          </div>
        </div>
      </header>

      <main className={`container${isProfileScreen ? " container-wide" : ""}`}>
        <Outlet />
      </main>

      <footer className="app-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <div className="brand">
              <span className="brand-badge">JF</span>
              <span>JobFinder</span>
            </div>
            <p className="muted" style={{ margin: "8px 0 12px" }}>
              Kết nối ứng viên và nhà tuyển dụng nhanh hơn, minh bạch hơn.
            </p>
            <div className="social">
              <a href="#" aria-label="Facebook">
                f
              </a>
              <a href="#" aria-label="LinkedIn">
                in
              </a>
              <a href="#" aria-label="Twitter">
                t
              </a>
            </div>
          </div>

          <div className="footer-col">
            <div className="footer-title">Nhà tuyển dụng</div>
            <NavLink to="/login?role=recruiter&redirect=/post-job">
              Đăng tin tuyển dụng
            </NavLink>
            <a href="#">Giải pháp & Bảng giá</a>
          </div>

          <div className="footer-col">
            <div className="footer-title">Người tìm việc</div>
            <NavLink to="/search">Tìm việc</NavLink>
            <NavLink to="/login?role=candidate">Đăng nhập</NavLink>
          </div>

          <div className="footer-col">
            <div className="footer-title">Nhận tin mới</div>
            <form
              className="subscribe"
              onSubmit={(e) => {
                e.preventDefault();
                alert("Đã đăng ký nhận tin!");
              }}
            >
              <input placeholder="Email của bạn" aria-label="Email" />
              <button className="btn primary" type="submit">
                Đăng ký
              </button>
            </form>
            <div className="muted small">
              Bằng việc đăng ký, bạn đồng ý với Điều khoản & Bảo mật.
            </div>
          </div>
        </div>

        <div className="container footer-bottom">
          <div className="muted">© 2025 JobFinder. All rights reserved.</div>
          <div className="footer-links">
            <a href="#">Điều khoản</a>
            <a href="#">Bảo mật</a>
            <a href="#">Liên hệ</a>
          </div>
        </div>
      </footer>

      <SimpleModal open={confirmLogout} onClose={() => setConfirmLogout(false)}>
        <h3 style={{ marginTop: 0 }}>Đăng xuất</h3>
        <div className="muted">
          Bạn chắc chắn muốn đăng xuất khỏi JobFinder?
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={() => setConfirmLogout(false)}>
            Hủy
          </button>
          <button className="btn primary" onClick={doLogout}>
            Đăng xuất
          </button>
        </div>
      </SimpleModal>
    </div>
  );
}
