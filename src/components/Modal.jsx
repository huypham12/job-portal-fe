import { createPortal } from 'react-dom'

export default function SimpleModal({ open, onClose, children, noWrapper = false }) {
  if (!open) return null

  const content = (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      {noWrapper ? (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}
        >
          {children}
        </div>
      ) : (
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      )}
    </div>
  )

  return createPortal(content, document.body)
}

