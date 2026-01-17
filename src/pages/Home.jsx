import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Chips from "../components/Chips.jsx";
import Carousel from "../components/Carousel.jsx";
import { chips, jobs } from "../data/mock.js";
import { getRole } from "../auth/auth.js";
import { companyApi } from "../services/companyApi";
import { JobService } from "../lib/api.js";
import { mapJobData } from "../utils/jobUtils.js";

const employerHighlights = [
  {
    title: "Đăng tin không giới hạn",
    desc: "Tạo landing tuyển dụng và xuất bản chỉ trong 2 phút.",
  },
  {
    title: "Theo dõi tiến độ minh bạch",
    desc: "Bảng điều khiển pipeline giúp đánh giá ứng viên rõ ràng.",
  },
  {
    title: "Kết nối ứng viên mỗi sáng",
    desc: "Sử dụng gói kết nối từ nguồn talent có sẵn.",
  },
  {
    title: "Kết nối trực tiếp ứng viên tiềm năng",
    desc: "Gửi lời mời kết nối và phỏng vấn nhanh chóng.",
  },
];

export default function Home() {
  const [kw, setKw] = useState("");
  const [loc, setLoc] = useState("");
  const [heroTab, setHeroTab] = useState("jobs");
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(false);
  const [errorFeatured, setErrorFeatured] = useState("");
  const [connectedRecruiters, setConnectedRecruiters] = useState([]);
  const [loadingConnected, setLoadingConnected] = useState(false);
  const useMocks =
    process.env.NODE_ENV !== "production" ||
    process.env.REACT_APP_USE_MOCKS === "true";
  const navigate = useNavigate();
  const connectedCount = connectedRecruiters.length;

  // Nếu là nhà tuyển dụng, chuyển sang khu vực recruiter
  // CHỈ redirect khi đang ở trang Home (pathname === '/')
  useEffect(() => {
    const role = getRole();
    const currentPath = window.location.pathname;
    // Chỉ redirect khi đang ở trang chủ, không redirect khi đang ở các trang khác
    if (role === "recruiter" && currentPath === "/") {
      let active = true;
      const moveRecruiter = async () => {
        try {
          await companyApi.getMyCompany();
          if (active) navigate("/recruiter/dashboard", { replace: true });
        } catch (err) {
          if (!active) return;
          const target =
            err?.status === 404
              ? "/onboarding/company"
              : "/recruiter/dashboard";
          navigate(target, { replace: true });
        }
      };
      moveRecruiter();
      return () => {
        active = false;
      };
    }
    return undefined;
  }, [navigate]);

  // Fetch connected recruiters
  useEffect(() => {
    let active = true;
    const fetchConnected = async () => {
      setLoadingConnected(true);
      try {
        const response = await companyApi.getConnections?.();
        if (!active) return;
        const connections = Array.isArray(response?.data) ? response.data : [];
        setConnectedRecruiters(connections);
      } catch (err) {
        if (!active) return;
        console.error("Error fetching connected recruiters:", err);
        setConnectedRecruiters([]);
      } finally {
        if (active) setLoadingConnected(false);
      }
    };
    fetchConnected();
    return () => {
      active = false;
    };
  }, []);

  // Fetch featured jobs
  useEffect(() => {
    const fetchFeaturedJobs = async () => {
      setLoadingFeatured(true);
      setErrorFeatured("");
      try {
        const response = await JobService.featured();
        // Handle response format: { message, data } or { data }
        const jobsList = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : [];
        const mappedJobs = jobsList.map(mapJobData);
        setFeaturedJobs(mappedJobs);
      } catch (err) {
        console.error("Error fetching featured jobs:", err);
        setErrorFeatured(err?.message || "Không thể tải việc làm nổi bật");
        // Fallback to mock data on error
        setFeaturedJobs(jobs.slice(0, 6));
      } finally {
        setLoadingFeatured(false);
      }
    };
    fetchFeaturedJobs();
  }, []);

  const suggestions = useMemo(() => {
    // Only use mock suggestions in non-production or when explicitly enabled
    if (!useMocks) return [];
    const q = kw.trim().toLowerCase();
    const l = loc.trim().toLowerCase();
    const filtered = jobs.filter((job) => {
      const keywordMatch =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.tags.join(" ").toLowerCase().includes(q);
      const locationMatch = !l || job.location.toLowerCase().includes(l);
      return keywordMatch && locationMatch;
    });
    return filtered.slice(0, 5);
  }, [kw, loc, useMocks]);

  const handleSearch = (event) => {
    event?.preventDefault();
    const q = encodeURIComponent(kw.trim());
    const l = encodeURIComponent(loc.trim());
    navigate(`/search?q=${q}&location=${l}`);
  };

  return (
    <div className="home-shell">
      <section className="home-hero">
        <div className="home-hero__content">
          <p className="eyebrow">Kết nối nhân tài & doanh nghiệp</p>
          <h1>Khởi động sự nghiệp mới cùng JobFinder</h1>
          <p className="home-hero__lead">
            Nền tảng tuyển dụng giúp bạn tìm việc phù hợp chỉ với vài thao tác.
            Tìm theo kỹ năng, mức lương hoặc hybrid/remote.
          </p>
          <form className="home-search" onSubmit={handleSearch}>
            <div className="home-search__field">
              <span aria-hidden="true">🔍</span>
              <input
                value={kw}
                onChange={(e) => setKw(e.target.value)}
                placeholder="Vị trí, kỹ năng, công ty..."
              />
            </div>
            <div className="home-search__field">
              <span aria-hidden="true">📍</span>
              <input
                value={loc}
                onChange={(e) => setLoc(e.target.value)}
                placeholder="Thành phố, quốc gia"
              />
            </div>
            <button type="submit" className="btn primary">
              Tìm việc
            </button>
          </form>
          <Chips items={chips} onPick={setKw} />
        </div>
        <div className="home-hero__panel">
          <div className="home-panel__head">
            <div className="home-hero__tabs">
              <button
                className={`home-hero__tab ${
                  heroTab === "jobs" ? "active" : ""
                }`}
                onClick={() => setHeroTab("jobs")}
              >
                <span className="tab-icon">💼</span>
                <span className="tab-label">Việc làm cho bạn</span>
              </button>
              <button
                className={`home-hero__tab ${
                  heroTab === "recruiters" ? "active" : ""
                }`}
                onClick={() => setHeroTab("recruiters")}
              >
                <span className="tab-icon">🤝</span>
                <span className="tab-label">Nhà tuyển dụng quan tâm</span>
              </button>
            </div>
            <Link to="/search" className="home-panel__link">
              <span style={{ whiteSpace: "nowrap" }}>Xem tất cả →</span>
            </Link>
          </div>

          {heroTab === "jobs" ? (
            <div className="home-panel__list">
              {suggestions.map((job) => (
                <Link
                  to={`/search/${job.id}`}
                  className="home-panel__card"
                  key={job.id}
                >
                  <div className="job-card-header">
                    <div className="job-icon">💼</div>
                    <div className="job-content">
                      <p className="home-panel__title">{job.title}</p>
                      <p className="job-meta muted">
                        <span className="job-company">🏢 {job.company}</span>
                        <span className="job-divider">•</span>
                        <span className="job-location">📍 {job.location}</span>
                      </p>
                    </div>
                  </div>
                  {job.tags && job.tags.length > 0 && (
                    <div className="home-panel__tags">
                      {job.tags.slice(0, 2).map((tag) => (
                        <span className="tag-pill" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
              {!suggestions.length && (
                <div className="home-panel__empty">
                  <div className="empty-icon">🔍</div>
                  <p className="empty-text">
                    {useMocks
                      ? "Nhập từ khóa để xem gợi ý."
                      : "Gợi ý sẽ hiển thị khi có dữ liệu thật — vui lòng tìm kiếm."}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="home-hero__recruiter-list">
              {loadingConnected ? (
                <div className="loading-state">
                  <div className="loading-spinner">⏳</div>
                  <p className="muted">Đang tải...</p>
                </div>
              ) : connectedRecruiters.length ? (
                connectedRecruiters.map((rec) => {
                  const initial = (rec.companyName || "C")[0].toUpperCase();
                  return (
                    <div className="home-hero__recruiter-card" key={rec.id}>
                      <div className="recruiter-logo">
                        {rec.logoUrl ? (
                          <img src={rec.logoUrl} alt={rec.companyName} />
                        ) : (
                          <div className="logo-initial">{initial}</div>
                        )}
                      </div>
                      <div className="recruiter-body">
                        <div className="recruiter-row">
                          <strong className="company-name">
                            {rec.companyName}
                          </strong>
                          <span className="recruiter-time">
                            {rec.connectedAt}
                          </span>
                        </div>
                        <p className="recruiter-info muted">
                          {rec.recruiterName && (
                            <>
                              <span className="recruiter-icon">👤</span>
                              <span>{rec.recruiterName}</span>
                              <span className="info-divider">·</span>
                            </>
                          )}
                          <span>Recruiter</span>
                          <span className="info-divider">·</span>
                          <span className="location-info">
                            📍 {rec.location}
                          </span>
                        </p>
                        <div className="recruiter-actions">
                          <Link
                            to={`/companies/${rec.id || ""}`}
                            className="link small action-link"
                          >
                            <span className="action-icon">🏢</span>
                            <span>Xem công ty</span>
                          </Link>
                          <Link
                            to={`/search?companyId=${rec.id || ""}`}
                            className="link small action-link"
                          >
                            <span className="action-icon">📋</span>
                            <span>Xem tin tuyển dụng</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="home-panel__empty">
                  <div className="empty-icon">🔔</div>
                  <p className="empty-text">
                    Chưa có nhà tuyển dụng nào kết nối với bạn. Hoàn thiện hồ sơ
                    để được chú ý hơn.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="home-section home-section--split">
        <div className="home-benefits">
          <p className="eyebrow">Nhà tuyển dụng</p>
          <h2>Trung tâm quản lý tuyển dụng miễn phí</h2>
          <p className="muted">
            Đăng tin, quản lý hồ sơ và trao đổi với ứng viên trên một nền tảng
            đơn giản. Miễn phí cho doanh nghiệp nhỏ.
          </p>

          <ul className="home-benefits__list compact">
            {employerHighlights.map((item) => (
              <li className="home-benef__item" key={item.title}>
                <div className="home-benef__text">
                  <strong className="home-benef__title">{item.title}</strong>
                  <span className="home-benef__desc">{item.desc}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="home-actions">
            <Link
              className="btn primary"
              to="/login?role=recruiter&redirect=/post-job"
            >
              Đăng tin miễn phí
            </Link>
            <Link className="btn ghost" to="/companies">
              Câu chuyện thành công
            </Link>
          </div>
        </div>

        <Carousel
          className="home-benefits__carousel"
          images={[
            "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1522881451255-f59ad836fdfb?q=80&w=1200&auto=format&fit=crop",
          ]}
          auto
          interval={4000}
        />
      </section>

      <section className="home-cta">
        <div>
          <p className="eyebrow">Sẵn sàng thay đổi?</p>
          <h2>Bắt đầu hồ sơ JobFinder chỉ với 2 phút</h2>
          <p className="muted">
            Nhận gợi ý phù hợp hơn và theo dõi tiến trình ứng tuyển trong thời
            gian thực.
          </p>
        </div>
        <div className="home-cta__actions">
          <Link className="btn primary" to="/register">
            Tạo hồ sơ ngay
          </Link>
          <Link className="btn ghost" to="/search">
            Khám phá việc làm
          </Link>
        </div>
        <p className="home-cta__subtext">
          Đã có tài khoản?{" "}
          <Link to="/search" className="link">
            Khám phá việc làm
          </Link>
        </p>
      </section>
    </div>
  );
}
