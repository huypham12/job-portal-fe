export default function SkeletonLoader({ count = 3 }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-card__header">
            <div className="skeleton skeleton--title" />
            <div className="skeleton skeleton--badge" />
          </div>
          <div className="skeleton-card__body">
            <div className="skeleton skeleton--line" />
            <div className="skeleton skeleton--line skeleton--short" />
          </div>
          <div className="skeleton-card__footer">
            <div className="skeleton skeleton--button" />
            <div className="skeleton skeleton--button" />
          </div>
        </div>
      ))}
    </div>
  )
}

