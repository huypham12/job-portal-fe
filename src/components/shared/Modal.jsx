import React, { useEffect } from 'react'
import './Modal.css'
import { Button } from './Button'

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'medium',
  className = '',
  closeOnOverlayClick = true,
  showCloseButton = true,
  ...props
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClass = `modal-${size}`

  return (
    <div
      className="modal-overlay-shared"
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        className={`modal-shared ${sizeClass} ${className}`}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {(title || showCloseButton) && (
          <div className="modal-header">
            {title && <h3 className="modal-title">{title}</h3>}
            {showCloseButton && (
              <button
                className="modal-close"
                onClick={onClose}
                aria-label="Close modal"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận',
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'primary',
  ...props
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      {...props}
    >
      <p className="modal-message">{message}</p>
      <div className="modal-footer">
        <Button variant="ghost" onClick={onClose}>
          {cancelText}
        </Button>
        <Button variant={variant} onClick={onConfirm}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}

