import React, { useState } from 'react'
import { Button, Modal } from '../shared'

/**
 * Bulk Actions Toolbar for recruiter application management
 * Provides bulk operations like status updates, shortlisting, and export
 */
export default function BulkActionsToolbar({
  selectedIds = [],
  onClearSelection,
  onBulkUpdate,
  onBulkShortlist,
  onBulkExport,
  loading = false
}) {
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [pendingPayload, setPendingPayload] = useState(null)

  const selectedCount = selectedIds.length

  const handleAction = (action, payload = {}) => {
    setPendingAction(action)
    setPendingPayload(payload)
    setShowConfirmModal(true)
  }

  const handleConfirm = async () => {
    try {
      if (pendingAction === 'updateStatus') {
        await onBulkUpdate(selectedIds, pendingPayload)
      } else if (pendingAction === 'shortlist') {
        await onBulkShortlist(selectedIds, pendingPayload.action)
      } else if (pendingAction === 'export') {
        onBulkExport(selectedIds)
      }

      onClearSelection()
    } catch (error) {
      console.error('Bulk action failed:', error)
      // Error handling is done in parent component
    } finally {
      setShowConfirmModal(false)
      setPendingAction(null)
      setPendingPayload(null)
    }
  }

  const handleCancel = () => {
    setShowConfirmModal(false)
    setPendingAction(null)
    setPendingPayload(null)
  }

  const getConfirmMessage = () => {
    if (!pendingAction) return ''

    switch (pendingAction) {
      case 'updateStatus':
        return `Bạn có chắc muốn cập nhật trạng thái của ${selectedCount} ứng viên thành "${pendingPayload.status}"?`
      case 'shortlist':
        const actionText = pendingPayload.action === 'add' ? 'thêm vào' : 'bỏ khỏi'
        return `Bạn có chắc muốn ${actionText} shortlist ${selectedCount} ứng viên?`
      case 'export':
        return `Xuất danh sách ${selectedCount} ứng viên đã chọn?`
      default:
        return 'Bạn có chắc muốn thực hiện hành động này?'
    }
  }

  if (selectedCount === 0) {
    return null
  }

  return (
    <>
      <div className="bulk-actions-toolbar" role="toolbar" aria-label="Bulk actions for selected candidates">
        <div className="bulk-actions-header">
          <span className="selection-count" aria-live="polite" aria-atomic="true">
            Đã chọn {selectedCount} ứng viên
          </span>
          <button
            className="clear-selection-btn"
            onClick={onClearSelection}
            disabled={loading}
            aria-label="Bỏ chọn tất cả ứng viên"
            title="Bỏ chọn tất cả ứng viên"
          >
            ✕ Bỏ chọn
          </button>
        </div>

        <div className="bulk-actions-buttons">
          <Button
            variant="outline"
            size="small"
            onClick={() => handleAction('updateStatus', { status: 'reviewed' })}
            disabled={loading}
            aria-label={`Đánh dấu ${selectedCount} ứng viên đã xem`}
          >
            Đánh dấu đã xem
          </Button>

          <Button
            variant="outline"
            size="small"
            onClick={() => handleAction('updateStatus', { status: 'interviewing' })}
            disabled={loading}
            aria-label={`Chuyển ${selectedCount} ứng viên sang trạng thái phỏng vấn`}
          >
            Chuyển sang Phỏng vấn
          </Button>

          <Button
            variant="outline"
            size="small"
            onClick={() => handleAction('updateStatus', { status: 'accepted' })}
            disabled={loading}
            aria-label={`Chấp nhận ${selectedCount} ứng viên`}
          >
            Chấp nhận
          </Button>

          <Button
            variant="outline"
            size="small"
            onClick={() => handleAction('updateStatus', { status: 'rejected' })}
            disabled={loading}
            aria-label={`Từ chối ${selectedCount} ứng viên`}
          >
            Từ chối
          </Button>

          <div className="divider" aria-hidden="true" />

          <Button
            variant="outline"
            size="small"
            onClick={() => handleAction('shortlist', { action: 'add' })}
            disabled={loading}
            aria-label={`Thêm ${selectedCount} ứng viên vào shortlist`}
          >
            ★ Thêm vào Shortlist
          </Button>

          <Button
            variant="outline"
            size="small"
            onClick={() => handleAction('shortlist', { action: 'remove' })}
            disabled={loading}
            aria-label={`Bỏ ${selectedCount} ứng viên khỏi shortlist`}
          >
            ☆ Bỏ khỏi Shortlist
          </Button>

          <div className="divider" aria-hidden="true" />

          <Button
            variant="outline"
            size="small"
            onClick={() => handleAction('export')}
            disabled={loading}
            aria-label={`Xuất danh sách ${selectedCount} ứng viên đã chọn`}
          >
            📄 Xuất danh sách
          </Button>
        </div>

        {loading && (
          <div className="bulk-loading">
            <span>Đang xử lý...</span>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        open={showConfirmModal}
        onClose={handleCancel}
        title="Xác nhận hành động hàng loạt"
      >
        <div style={{ padding: '20px' }}>
          <p style={{ marginBottom: '20px' }}>{getConfirmMessage()}</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={handleCancel}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleConfirm}>
              Xác nhận
            </Button>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        .bulk-actions-toolbar {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .bulk-actions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .selection-count {
          font-weight: 600;
          color: #1e293b;
        }

        .clear-selection-btn {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          font-size: 14px;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .clear-selection-btn:hover:not(:disabled) {
          background: #e2e8f0;
        }

        .clear-selection-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .bulk-actions-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .divider {
          width: 1px;
          height: 24px;
          background: #e2e8f0;
          margin: 0 4px;
        }

        .bulk-loading {
          margin-top: 12px;
          text-align: center;
          color: #64748b;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .bulk-actions-buttons {
            flex-direction: column;
            align-items: stretch;
          }

          .divider {
            display: none;
          }
        }
      `}</style>
    </>
  )
}
