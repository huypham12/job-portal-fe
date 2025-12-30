export default function EmptyState({ 
  title = 'Chưa có CV nào', 
  description = 'Bắt đầu bằng cách tạo CV mới hoặc tải CV lên.',
  actions 
}) {
  return (
    <div className="empty-state">
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__description muted">{description}</p>
      {actions && (
        <div className="empty-state__actions">
          {actions}
        </div>
      )}
    </div>
  )
}

