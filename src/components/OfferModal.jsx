import React, { useState } from 'react'
import { ApplicationService } from '../lib/api.js'
import { Modal, Button, Input, Textarea } from './shared'
import './OfferModal.css'

export default function OfferModal({ isOpen, onClose, applicationId, candidateName, jobTitle }) {
  const [offerData, setOfferData] = useState({
    salary_min: '',
    salary_max: '',
    currency: 'VND',
    expiration_date: '',
    notes: '',
    benefits: ''
  })
  const [creating, setCreating] = useState(false)

  const handleCreateOffer = async () => {
    if (!offerData.salary_min || !offerData.expiration_date) {
      alert('Vui lòng nhập mức lương và ngày hết hạn.')
      return
    }

    setCreating(true)
    try {
      // For now, we'll update the application status to 'offered' with metadata
      // In the future, this could be a dedicated offer endpoint
      await ApplicationService.updateStatus(applicationId, {
        status: 'offered',
        metadata: {
          offer_details: {
            salary_min: Number(offerData.salary_min),
            salary_max: offerData.salary_max ? Number(offerData.salary_max) : null,
            currency: offerData.currency,
            expiration_date: offerData.expiration_date,
            notes: offerData.notes,
            benefits: offerData.benefits
          }
        }
      })

      alert('Đã gửi offer thành công!')
      handleClose()
      // Refresh the page to show updated status
      window.location.reload()
    } catch (err) {
      alert(err?.message || 'Không thể tạo offer. Vui lòng thử lại.')
    } finally {
      setCreating(false)
    }
  }

  const handleClose = () => {
    setOfferData({
      salary_min: '',
      salary_max: '',
      currency: 'VND',
      expiration_date: '',
      notes: '',
      benefits: ''
    })
    setCreating(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} style={{ maxWidth: '600px' }}>
      <div style={{ padding: '20px' }}>
        <h2 style={{ marginTop: 0, marginBottom: '24px' }}>Tạo Offer</h2>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151' }}>Thông tin ứng viên:</h4>
            <p style={{ margin: 0, fontSize: '14px', color: '#4b5563' }}>
              <strong>{candidateName || 'Ứng viên'}</strong> - Vị trí: {jobTitle || 'N/A'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Salary Range */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Mức lương
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Input
                type="number"
                placeholder="Mức lương tối thiểu"
                value={offerData.salary_min}
                onChange={(e) => setOfferData({ ...offerData, salary_min: e.target.value })}
                style={{ flex: 1 }}
              />
              <span style={{ color: '#6b7280' }}>-</span>
              <Input
                type="number"
                placeholder="Mức lương tối đa (tùy chọn)"
                value={offerData.salary_max}
                onChange={(e) => setOfferData({ ...offerData, salary_max: e.target.value })}
                style={{ flex: 1 }}
              />
              <select
                value={offerData.currency}
                onChange={(e) => setOfferData({ ...offerData, currency: e.target.value })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  background: 'white',
                  minWidth: '80px'
                }}
              >
                <option value="VND">VND</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          {/* Expiration Date */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Ngày hết hạn offer
            </label>
            <Input
              type="date"
              value={offerData.expiration_date}
              onChange={(e) => setOfferData({ ...offerData, expiration_date: e.target.value })}
              min={new Date().toISOString().split('T')[0]} // Today or later
            />
          </div>

          {/* Benefits */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Quyền lợi và phúc lợi
            </label>
            <Textarea
              placeholder="Mô tả các quyền lợi, phúc lợi kèm theo..."
              value={offerData.benefits}
              onChange={(e) => setOfferData({ ...offerData, benefits: e.target.value })}
              rows={3}
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Ghi chú thêm
            </label>
            <Textarea
              placeholder="Các thông tin bổ sung về offer..."
              value={offerData.notes}
              onChange={(e) => setOfferData({ ...offerData, notes: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button variant="outline" onClick={handleClose} disabled={creating}>
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateOffer}
            disabled={creating || !offerData.salary_min || !offerData.expiration_date}
          >
            {creating ? 'Đang tạo...' : 'Tạo Offer'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
