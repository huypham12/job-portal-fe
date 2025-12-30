import React, { useState } from 'react'
import { ApplicationService } from '../lib/api.js'
import { Modal, Button, Input, Textarea, Select } from './shared'
import './ContactCandidateModal.css'

const CONTACT_METHODS = [
  { value: 'email', label: 'Email' },
  { value: 'notification', label: 'Thông báo trong app' },
  { value: 'both', label: 'Cả email và thông báo' }
]

const EMAIL_TEMPLATES = [
  {
    value: 'interview_invitation',
    label: 'Mời phỏng vấn',
    subject: 'Mời phỏng vấn vị trí [Vị trí] tại [Công ty]',
    message: `Kính gửi [Tên ứng viên],

Chúng tôi rất ấn tượng với hồ sơ của bạn và muốn mời bạn tham gia buổi phỏng vấn cho vị trí [Vị trí] tại [Công ty].

Thời gian: [Thời gian]
Địa điểm: [Địa điểm]
Người phỏng vấn: [Người phỏng vấn]

Vui lòng xác nhận tham gia bằng cách trả lời email này.

Trân trọng,
[Nhà tuyển dụng]
[Công ty]`
  },
  {
    value: 'offer',
    label: 'Gửi offer',
    subject: 'Đề nghị làm việc cho vị trí [Vị trí] tại [Công ty]',
    message: `Kính gửi [Tên ứng viên],

Chúng tôi rất vui mừng được đề nghị bạn gia nhập đội ngũ của chúng tôi với vai trò [Vị trí] tại [Công ty].

Mức lương: [Mức lương]
Thời gian bắt đầu: [Thời gian bắt đầu]
Các quyền lợi khác: [Quyền lợi]

Vui lòng xem xét và phản hồi trong vòng [Thời hạn] ngày.

Trân trọng,
[Nhà tuyển dụng]
[Công ty]`
  },
  {
    value: 'rejection',
    label: 'Từ chối ứng tuyển',
    subject: 'Cập nhật trạng thái ứng tuyển vị trí [Vị trí]',
    message: `Kính gửi [Tên ứng viên],

Cảm ơn bạn đã quan tâm đến vị trí [Vị trí] tại [Công ty] và dành thời gian ứng tuyển.

Sau khi xem xét kỹ lưỡng, chúng tôi rất tiếc phải thông báo rằng hồ sơ của bạn chưa phù hợp với yêu cầu của vị trí này.

Chúng tôi đánh giá cao sự quan tâm của bạn và chúc bạn thành công trong những cơ hội sắp tới.

Trân trọng,
[Nhà tuyển dụng]
[Công ty]`
  },
  {
    value: 'custom',
    label: 'Tùy chỉnh',
    subject: '',
    message: ''
  }
]

export default function ContactCandidateModal({ isOpen, onClose, applicationId, candidateName, jobTitle, companyName }) {
  const [contactMethod, setContactMethod] = useState('email')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleTemplateChange = (templateValue) => {
    setSelectedTemplate(templateValue)
    const template = EMAIL_TEMPLATES.find(t => t.value === templateValue)

    if (template && template.value !== 'custom') {
      let templateSubject = template.subject
      let templateMessage = template.message

      // Replace placeholders
      const replacements = {
        '[Tên ứng viên]': candidateName || '[Tên ứng viên]',
        '[Vị trí]': jobTitle || '[Vị trí]',
        '[Công ty]': companyName || '[Công ty]',
        '[Thời gian]': '[Thời gian]',
        '[Địa điểm]': '[Địa điểm]',
        '[Người phỏng vấn]': '[Người phỏng vấn]',
        '[Mức lương]': '[Mức lương]',
        '[Thời gian bắt đầu]': '[Thời gian bắt đầu]',
        '[Quyền lợi]': '[Quyền lợi]',
        '[Thời hạn]': '[Thời hạn]',
        '[Nhà tuyển dụng]': '[Nhà tuyển dụng]'
      }

      Object.entries(replacements).forEach(([placeholder, value]) => {
        templateSubject = templateSubject.replace(new RegExp(placeholder, 'g'), value)
        templateMessage = templateMessage.replace(new RegExp(placeholder, 'g'), value)
      })

      setSubject(templateSubject)
      setMessage(templateMessage)
    } else {
      setSubject('')
      setMessage('')
    }
  }

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      alert('Vui lòng nhập tiêu đề và nội dung tin nhắn.')
      return
    }

    setSending(true)
    try {
      await ApplicationService.contact({
        application_id: applicationId,
        method: contactMethod,
        subject: subject.trim(),
        message: message.trim()
      })

      alert('Đã gửi tin nhắn thành công!')
      handleClose()
    } catch (err) {
      alert(err?.message || 'Không thể gửi tin nhắn. Vui lòng thử lại.')
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    setContactMethod('email')
    setSelectedTemplate('')
    setSubject('')
    setMessage('')
    setSending(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} style={{ maxWidth: '700px' }}>
      <div style={{ padding: '20px' }}>
        <h2 style={{ marginTop: 0, marginBottom: '24px' }}>Liên hệ với ứng viên</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Contact Method */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Phương thức liên hệ
            </label>
            <Select
              value={contactMethod}
              onChange={(e) => setContactMethod(e.target.value)}
              style={{ width: '100%' }}
            >
              {CONTACT_METHODS.map(method => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Email Template */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Mẫu email
            </label>
            <Select
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">Chọn mẫu email...</option>
              {EMAIL_TEMPLATES.map(template => (
                <option key={template.value} value={template.value}>
                  {template.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Subject */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Tiêu đề
            </label>
            <Input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Nhập tiêu đề email/thông báo"
              style={{ width: '100%' }}
            />
          </div>

          {/* Message */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Nội dung
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập nội dung tin nhắn..."
              rows={12}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          {/* Preview Info */}
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151' }}>Thông tin người nhận:</h4>
            <p style={{ margin: '0', fontSize: '14px', color: '#4b5563' }}>
              <strong>{candidateName || 'Ứng viên'}</strong> - Vị trí: {jobTitle || 'N/A'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button variant="outline" onClick={handleClose} disabled={sending}>
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={sending || !subject.trim() || !message.trim()}
          >
            {sending ? 'Đang gửi...' : 'Gửi'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
