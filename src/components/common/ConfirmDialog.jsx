import React from 'react'
import { Button, Modal } from '../shared'

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận',
  message = 'Bạn có chắc chắn muốn thực hiện hành động này?',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  confirmVariant = 'primary',
  loading = false,
  dangerous = false
}) => {
  const handleConfirm = () => {
    onConfirm()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleConfirm()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="small">
      <div className="p-6" onKeyDown={handleKeyDown}>
        <div className="flex items-center mb-4">
          {dangerous && (
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          )}
          <h3 className="text-lg font-medium text-gray-900">
            {title}
          </h3>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600">
            {message}
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            loading={loading}
            disabled={loading}
            className={dangerous ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : ''}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
