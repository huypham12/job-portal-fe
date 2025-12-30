export default function SummarySection({ summary = '', onChange }) {
  return (
    <div className="resume-section">
      <div className="resume-section__header">
        <h3 className="resume-section__title">Tóm tắt / Mục tiêu nghề nghiệp</h3>
      </div>
      <div className="form-group">
        <textarea
          className="form-input"
          rows={6}
          value={summary}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Viết một đoạn tóm tắt ngắn gọn về bản thân và mục tiêu nghề nghiệp của bạn..."
          style={{ 
            resize: 'vertical',
            minHeight: '120px',
            fontFamily: 'inherit'
          }}
        />
        <p className="form-hint muted small" style={{ marginTop: '8px' }}>
          {summary.length} ký tự
        </p>
      </div>
    </div>
  )
}

















