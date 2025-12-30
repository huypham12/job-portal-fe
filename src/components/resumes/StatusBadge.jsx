export default function StatusBadge({ status, className = '' }) {
  const variants = {
    draft: {
      label: 'Nháp',
      className: 'status-badge--draft',
    },
    active: {
      label: 'Hoạt động',
      className: 'status-badge--active',
    },
    archived: {
      label: 'Lưu trữ',
      className: 'status-badge--archived',
    },
  }

  const variant = variants[status] || variants.draft

  return (
    <span className={`status-badge ${variant.className} ${className}`}>
      <span className="status-badge__label">{variant.label}</span>
    </span>
  )
}

