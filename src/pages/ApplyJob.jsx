import { useParams, Link } from 'react-router-dom'
import { jobs } from '../data/mock.js'

export default function ApplyJob(){
  const { id } = useParams()
  const job = jobs.find(j => j.id === id)
  if(!job) return (
    <div className="section">
      <h2>Không tìm thấy công việc</h2>
      <Link to="/search" className="btn">Quay lại danh sách</Link>
    </div>
  )

  const onSubmit = (e) => {
    e.preventDefault()
    alert('Đã gửi ứng tuyển (demo). Chúc bạn may mắn!')
  }

  return (
    <div className="section">
      <div className="card">
        <h2 style={{marginTop:0}}>Ứng tuyển: {job.title}</h2>
        <div className="muted">{job.company} • {job.location}</div>

        <form onSubmit={onSubmit} style={{display:'grid', gap:12, marginTop:16}}>
          <label className="field">
            <span>Họ và tên</span>
            <input placeholder="Nguyễn Văn A" required />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" placeholder="you@example.com" required />
          </label>
          <label className="field">
            <span>Ghi chú</span>
            <input placeholder="Tin nhắn tới nhà tuyển dụng (tuỳ chọn)" />
          </label>
          <div style={{display:'flex', gap:10}}>
            <Link to={`/search/${job.id}`} className="btn">← Xem chi tiết</Link>
            <button type="submit" className="btn primary">Gửi ứng tuyển</button>
          </div>
        </form>
      </div>
    </div>
  )
}

