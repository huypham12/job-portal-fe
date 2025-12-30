import { companies } from '../data/mock.js'
import CompanyCard from '../components/CompanyCard.jsx'
import { useMemo, useState } from 'react'

export default function Companies(){
  const [q, setQ] = useState('')
  const [minSize, setMinSize] = useState(0)

  const list = useMemo(()=>{
    const query = q.trim().toLowerCase()
    return companies.filter(c =>
      (!query || c.name.toLowerCase().includes(query) || c.description.toLowerCase().includes(query)) &&
      (!minSize || c.size >= minSize)
    )
  },[q, minSize])

  return (
    <div className="section">
      <div className="hero-banner companies-hero">
        <div className="hero-col">
          <span className="eyebrow">Khám phá nhà tuyển dụng</span>
          <h1 style={{margin:'10px 0 8px'}}>Nhà tuyển dụng hàng đầu</h1>
          <p className="lead">Tìm công ty phù hợp với con đường sự nghiệp của bạn. Lọc theo tên, quy mô và lĩnh vực để khám phá môi trường lý tưởng.</p>

          <div className="hero-search">
            <label className="field large">
              <span role="img" aria-label="search">🔎</span>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Tìm theo tên, mô tả công ty..." />
            </label>
            <label className="field large" style={{maxWidth:220}}>
              <span role="img" aria-label="size">👥</span>
              <input inputMode="numeric" value={minSize} onChange={e=>setMinSize(Number((e.target.value||'').replace(/[^\d]/g,'')))} placeholder="Quy mô tối thiểu" />
            </label>
          </div>

          <div className="hero-stats">
            <div className="stat">🏢 {companies.length} công ty</div>
            <div className="stat">⭐ Đánh giá cao bởi ứng viên</div>
            <div className="stat">🚀 Cơ hội tăng trưởng mạnh</div>
          </div>
        </div>
        <div className="hero-col visual">
          <div className="hero-blob a" />
          <div className="hero-blob b" />
          <div className="logo-grid-hero">
            {companies.slice(0,6).map(c => (
              <img key={c.id} src={c.logo_url} alt={c.name} />
            ))}
          </div>
        </div>
      </div>

      <h2 style={{marginTop:18}}>Tất cả công ty</h2>

      <div className="grid cols-3" style={{marginTop:14}}>
        {list.map(c => <CompanyCard key={c.id} company={c} />)}
      </div>
    </div>
  )
}
