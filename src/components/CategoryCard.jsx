export default function CategoryCard({icon, name, jobs}){
  return (
    <div className="card category">
      <div className="cat-icon">{icon}</div>
      <div>
        <div style={{fontWeight:600}}>{name}</div>
        <div className="muted">{jobs}+ việc làm</div>
      </div>
    </div>
  )
}

