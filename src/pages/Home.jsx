import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CategoryCard from '../components/CategoryCard.jsx'
import JobCard from '../components/JobCard.jsx'
import Chips from '../components/Chips.jsx'
import LogosGrid from '../components/LogosGrid.jsx'
import Carousel from '../components/Carousel.jsx'
import { chips, categories, jobs, partners } from '../data/mock.js'
import { getRole } from '../auth/auth.js'
import { companyApi } from '../services/companyApi'
import { JobService } from '../lib/api.js'
import { mapJobData } from '../utils/jobUtils.js'

const employerHighlights = [
  { title: 'Đăng tin không giới hạn', desc: 'Tạo landing tuyển dụng và xuất bản chỉ trong 2 phút.' },
  { title: 'Theo dõi tiến độ minh bạch', desc: 'Bảng điều khiển pipeline giúp đánh giá ứng viên rõ ràng.' },
  { title: 'Kết nối ứng viên mỗi sáng', desc: 'Sử dụng gói kết nối từ nguồn talent có sẵn.' },
  { title: 'Kết nối trực tiếp ứng viên tiềm năng', desc: 'Gửi lời mời kết nối và phỏng vấn nhanh chóng.' }
]

const heroStats = [
  { value: '15.000+', label: 'Việc làm đang tuyển' },
  { value: '1.200+', label: 'Nhà tuyển dụng tin dùng' },
  { value: '48h', label: 'Nhận offer trung bình' }
]

const connectedRecruiters = [
  {
    id: 'r1',
    companyName: 'Luma Tech',
    recruiterName: 'Nguyễn Anh',
    location: 'Hà Nội, Việt Nam',
    logoUrl: '',
    connectedAt: '2 ngày trước'
  },
  {
    id: 'r2',
    companyName: 'OceanSoft',
    recruiterName: 'Trần Minh',
    location: 'Đà Nẵng, Việt Nam',
    logoUrl: '',
    connectedAt: '5 ngày trước'
  }
]

export default function Home() {
  const [kw, setKw] = useState('')
  const [loc, setLoc] = useState('')
  const [heroTab, setHeroTab] = useState('jobs')
  const [featuredJobs, setFeaturedJobs] = useState([])
  const [loadingFeatured, setLoadingFeatured] = useState(false)
  const [errorFeatured, setErrorFeatured] = useState('')
  const navigate = useNavigate()
  const connectedCount = connectedRecruiters.length

  // Nếu là nhà tuyển dụng, chuyển sang khu vực recruiter
  // CHỈ redirect khi đang ở trang Home (pathname === '/')
  useEffect(() => {
    const role = getRole()
    const currentPath = window.location.pathname
    // Chỉ redirect khi đang ở trang chủ, không redirect khi đang ở các trang khác
    if (role === 'recruiter' && currentPath === '/') {
      let active = true
      const moveRecruiter = async () => {
        try {
          await companyApi.getMyCompany()
          if (active) navigate('/recruiter/dashboard', { replace: true })
        } catch (err) {
          if (!active) return
          const target = err?.status === 404 ? '/onboarding/company' : '/recruiter/dashboard'
          navigate(target, { replace: true })
        }
      }
      moveRecruiter()
      return () => { active = false }
    }
    return undefined
  }, [navigate])

  // Fetch featured jobs
  useEffect(() => {
    const fetchFeaturedJobs = async () => {
      setLoadingFeatured(true)
      setErrorFeatured('')
      try {
        const response = await JobService.featured()
        // Handle response format: { message, data } or { data }
        const jobsList = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : [])
        const mappedJobs = jobsList.map(mapJobData)
        setFeaturedJobs(mappedJobs)
      } catch (err) {
        console.error('Error fetching featured jobs:', err)
        setErrorFeatured(err?.message || 'Không thể tải việc làm nổi bật')
        // Fallback to mock data on error
        setFeaturedJobs(jobs.slice(0, 6))
      } finally {
        setLoadingFeatured(false)
      }
    }
    fetchFeaturedJobs()
  }, [])

  const suggestions = useMemo(() => {
    const q = kw.trim().toLowerCase()
    const l = loc.trim().toLowerCase()
    const filtered = jobs.filter((job) => {
      const keywordMatch =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.tags.join(' ').toLowerCase().includes(q)
      const locationMatch = !l || job.location.toLowerCase().includes(l)
      return keywordMatch && locationMatch
    })
    return filtered.slice(0, 5)
  }, [kw, loc])

  const handleSearch = (event) => {
    event?.preventDefault()
    const q = encodeURIComponent(kw.trim())
    const l = encodeURIComponent(loc.trim())
    navigate(`/jobs?q=${q}&loc=${l}`)
  }

  return (
    <div className="home-shell">
      <section className="home-hero">
        <div className="home-hero__content">
          <p className="eyebrow">Kết nối nhân tài & doanh nghiệp</p>
          <h1>Khởi động sự nghiệp mới cùng JobFinder</h1>
          <p className="home-hero__lead">
            Nền tảng tuyển dụng giúp bạn tìm việc phù hợp chỉ với vài thao tác. Tìm theo kỹ năng, mức lương hoặc hybrid/remote.
          </p>
          <form className="home-search" onSubmit={handleSearch}>
            <div className="home-search__field">
              <span aria-hidden="true">🔍</span>
              <input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="Vị trí, kỹ năng, công ty..." />
            </div>
            <div className="home-search__field">
              <span aria-hidden="true">📍</span>
              <input value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="Thành phố, quốc gia" />
            </div>
            <button type="submit" className="btn primary">
              Tìm việc
            </button>
          </form>
          <Chips items={chips} onPick={setKw} />
          <div className="home-hero__stats">
            {heroStats.map((stat) => (
              <div key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="home-hero__panel">
          <div className="home-panel__head">
            <div className="home-hero__tabs">
              <button className={`home-hero__tab ${heroTab === 'jobs' ? 'active' : ''}`} onClick={() => setHeroTab('jobs')}>
                Việc làm cho bạn
              </button>
              <button
                className={`home-hero__tab ${heroTab === 'recruiters' ? 'active' : ''}`}
                onClick={() => setHeroTab('recruiters')}
              >
                Nhà tuyển dụng quan tâm
              </button>
            </div>
            <Link to={heroTab === 'jobs' ? '/jobs' : '/connections'} className="home-panel__link">
              Xem tất cả
            </Link>
          </div>

          {heroTab === 'jobs' ? (
            <div className="home-panel__list">
              {suggestions.map((job) => (
                <Link to={`/jobs/${job.id}`} className="home-panel__card" key={job.id}>
                  <p className="home-panel__title">{job.title}</p>
                  <p className="muted">
                    {job.company} | {job.location}
                  </p>
                  <div className="home-panel__tags">
                    {job.tags.slice(0, 2).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </Link>
              ))}
              {!suggestions.length && <p className="home-panel__empty">Nhập từ khóa để xem gợi ý.</p>}
            </div>
          ) : (
            <div className="home-hero__recruiter-list">
              {connectedRecruiters.length ? (
                connectedRecruiters.map((rec) => {
                  const initial = (rec.companyName || 'C')[0].toUpperCase()
                  return (
                    <div className="home-hero__recruiter-card" key={rec.id}>
                      <div className="recruiter-logo">{rec.logoUrl ? <img src={rec.logoUrl} alt={rec.companyName} /> : initial}</div>
                      <div className="recruiter-body">
                        <div className="recruiter-row">
                          <strong>{rec.companyName}</strong>
                          <span className="recruiter-time">{rec.connectedAt}</span>
                        </div>
                        <p className="muted">
                          {rec.recruiterName ? `${rec.recruiterName} · ` : ''}Recruiter · {rec.location}
                        </p>
                        <div className="recruiter-actions">
                          <Link to={`/companies/${rec.id || ''}`} className="link small">
                            Xem công ty
                          </Link>
                          <Link to={`/jobs?companyId=${rec.id || ''}`} className="link small">
                            Xem tin tuyển dụng
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="home-panel__empty">
                  Chưa có nhà tuyển dụng nào kết nối với bạn. Hoàn thiện hồ sơ để được chú ý hơn.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {connectedCount > 0 && (
        <div className="home-info-bar">
          <span role="img" aria-label="link">
            🔗
          </span>
          <span>
            Bạn có <strong>{connectedCount} nhà tuyển dụng</strong> đã kết nối với bạn.
          </span>
          <Link to="/connections" className="link">
            Xem danh sách
          </Link>
        </div>
      )}

      <section className="home-trust">
        <div>
          <p className="eyebrow">Được tin dùng bởi</p>
          <p>Hơn 1.200 công ty tại Việt Nam & Khu vực</p>
        </div>
        <LogosGrid items={partners} />
      </section>

      <section className="home-section">
        <header className="home-section__head">
          <div>
            <p className="eyebrow">Khám phá lĩnh vực</p>
            <h2>Danh mục phổ biến</h2>
          </div>
          <Link to="/search" className="home-link">
            Xem tất cả việc làm
          </Link>
        </header>
        <div className="home-grid home-grid--categories">
          {categories.map((category) => (
            <CategoryCard key={category.name} {...category} />
          ))}
        </div>
      </section>

      <section className="home-section">
        <header className="home-section__head">
          <div>
            <p className="eyebrow">Dành cho bạn</p>
            <h2>Việc làm nổi bật</h2>
          </div>
          <Link to="/search" className="home-link">
            Tìm thêm việc làm
          </Link>
        </header>
        {loadingFeatured ? (
          <div className="home-grid home-grid--jobs">
            <p className="muted">Đang tải việc làm nổi bật...</p>
          </div>
        ) : errorFeatured && featuredJobs.length === 0 ? (
          <div className="home-grid home-grid--jobs">
            <p className="muted">{errorFeatured}</p>
          </div>
        ) : (
          <div className="home-grid home-grid--jobs">
            {featuredJobs.length > 0 ? (
              featuredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))
            ) : (
              <p className="muted">Chưa có việc làm nổi bật.</p>
            )}
          </div>
        )}
      </section>

      <section className="home-connection-section">
        <div className="home-connection-head">
          <h2>Kết nối trực tiếp giữa ứng viên & nhà tuyển dụng</h2>
          <p className="muted">
            Ứng viên và nhà tuyển dụng có thể chủ động tiếp cận nhau, gửi lời mời kết nối và phỏng vấn nhanh chóng.
          </p>
        </div>
        <div className="home-connection-grid">
          <div className="home-connection-card">
            <div className="icon">🤝</div>
            <h3>Nhà tuyển dụng chủ động kết nối với bạn</h3>
            <p>Hoàn thiện hồ sơ để nhà tuyển dụng có thể gửi lời mời phỏng vấn ngay cả khi bạn chưa ứng tuyển.</p>
            <Link to="/connections" className="btn primary">
              Xem nhà tuyển dụng đã kết nối
            </Link>
          </div>
          <div className="home-connection-card">
            <div className="icon">🚀</div>
            <h3>Kết nối nhanh với ứng viên phù hợp</h3>
            <p>Duyệt talent pool, xem hồ sơ và gửi yêu cầu kết nối chỉ với một lần nhấp.</p>
            <Link to="/talent-pool" className="btn ghost">
              Tìm ứng viên & kết nối
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section home-section--split">
        <div className="home-benefits">
          <p className="eyebrow">Nhà tuyển dụng</p>
          <h2>Trung tâm quản lý tuyển dụng miễn phí</h2>
          <p className="muted">
            Đăng tin, quản lý hồ sơ, nhắn tin và chia sẻ phản hồi với ứng viên trên một nền tảng. Hoàn toàn miễn phí cho
            doanh nghiệp dưới 200 nhân sự.
          </p>
          <div className="home-benefits__list">
            {employerHighlights.map((item) => (
            <div className="home-benefit__card" key={item.title}>
              <h4>{item.title}</h4>
              <p>{item.desc}</p>
            </div>
          ))}
          </div>
          <div className="home-actions">
            <Link className="btn primary" to="/login?role=recruiter&redirect=/post-job">
              Đăng tin miễn phí
            </Link>
            <Link className="btn ghost" to="/companies">
              Câu chuyện thành công
            </Link>
            <Link className="btn ghost" to="/talent-pool">
              Tìm ứng viên & kết nối
            </Link>
          </div>
        </div>
        <Carousel
          className="home-benefits__carousel"
          images={[
            'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1522881451255-f59ad836fdfb?q=80&w=1200&auto=format&fit=crop'
          ]}
          auto
          interval={4000}
          effect="fade"
        />
      </section>

      <section className="home-cta">
        <div>
          <p className="eyebrow">Sẵn sàng thay đổi?</p>
          <h2>Bắt đầu hồ sơ JobFinder chỉ với 2 phút</h2>
          <p className="muted">Nhận gợi ý phù hợp hơn và theo dõi tiến trình ứng tuyển trong thời gian thực.</p>
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
          Đã có tài khoản? <Link to="/connections" className="link">Xem nhà tuyển dụng đã kết nối với bạn</Link>
        </p>
      </section>
    </div>
  )
}
