import { api } from '../lib/api'

export const ProfileClient = {
  getMe: () => api.get('/api/user/me'),
  get: () => api.get('/api/user/me/profile'),
  create: (payload) => api.post('/api/user/me/profile', payload),
  update: (payload) => api.put('/api/user/me/profile', payload),
  experiences: {
    create: (payload) => api.post('/api/user/me/profile/experiences', payload),
    update: (id, payload) => api.put(`/api/user/me/profile/experiences/${id}`, payload),
    delete: (id) => api.del(`/api/user/me/profile/experiences/${id}`),
  },
  educations: {
    create: (payload) => api.post('/api/user/me/profile/educations', payload),
    update: (id, payload) => api.put(`/api/user/me/profile/educations/${id}`, payload),
    delete: (id) => api.del(`/api/user/me/profile/educations/${id}`),
  },
  skills: {
    create: (payload) => api.post('/api/user/me/profile/skills', payload),
    update: (id, payload) => api.put(`/api/user/me/profile/skills/${id}`, payload),
    delete: (id) => api.del(`/api/user/me/profile/skills/${id}`),
  },
  certifications: {
    create: (payload) => api.post('/api/user/me/profile/certifications', payload),
    update: (id, payload) => api.put(`/api/user/me/profile/certifications/${id}`, payload),
    delete: (id) => api.del(`/api/user/me/profile/certifications/${id}`),
  },
  awards: {
    create: (payload) => api.post('/api/user/me/profile/awards', payload),
    update: (id, payload) => api.put(`/api/user/me/profile/awards/${id}`, payload),
    delete: (id) => api.del(`/api/user/me/profile/awards/${id}`),
  },
}
