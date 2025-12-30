import { getAuthToken } from '../auth/auth'

const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export const UploadClient = {
  uploadAvatar: async (file) => {
    if(!file) throw new Error('Chưa chọn ảnh.')
    const formData = new FormData()
    formData.append('file', file)
    const token = getAuthToken()
    const res = await fetch(`${BASE}/api/uploads/avatar`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    const data = await res.json().catch(() => ({}))
    if(!res.ok){
      const err = new Error(data?.message || 'Tải ảnh đại diện thất bại.')
      err.status = res.status
      err.data = data
      throw err
    }
    return data
  }
}
