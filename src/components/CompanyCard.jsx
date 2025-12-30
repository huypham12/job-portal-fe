import { Link } from 'react-router-dom'

export default function CompanyCard({company}){
  return (
    <div className="card" style={{display:'grid', gridTemplateColumns:'56px 1fr', gap:12, alignItems:'center'}}>
      <img src={company.logo_url} alt={company.name} style={{width:56, height:56, borderRadius:12, objectFit:'contain', background:'#0d1429', border:'1px solid var(--border)'}} />
      <div>
        <div style={{display:'flex', justifyContent:'space-between', gap:8}}>
          <strong>{company.name}</strong>
          <span className="badge">{company.size} nhân sự</span>
        </div>
        <div className="muted" style={{marginTop:4, overflow:'hidden', textOverflow:'ellipsis'}}>{company.description}</div>
        <div style={{display:'flex', gap:8, marginTop:8, alignItems:'center', flexWrap:'wrap'}}>
          {company.metadata?.location && <span className="tag">📍 {company.metadata.location}</span>}
          {company.metadata?.domains?.map((d,i)=>(<span className="tag" key={i}>#{d}</span>))}
          <Link to={`/companies/${company.id}`} className="btn" style={{marginLeft:'auto'}}>Xem công ty</Link>
        </div>
      </div>
    </div>
  )
}

