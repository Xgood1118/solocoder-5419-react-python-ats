import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

export const jobApi = {
  list: (status) => api.get('/jobs', { params: { status } }).then(r => r.data),
  get: (id) => api.get(`/jobs/${id}`).then(r => r.data),
  create: (data) => api.post('/jobs', data).then(r => r.data),
  update: (id, data) => api.put(`/jobs/${id}`, data).then(r => r.data),
  close: (id) => api.post(`/jobs/${id}/close`).then(r => r.data),
  archive: (id) => api.post(`/jobs/${id}/archive`).then(r => r.data),
  reopen: (id) => api.post(`/jobs/${id}/reopen`).then(r => r.data),
}

export const candidateApi = {
  list: () => api.get('/candidates').then(r => r.data),
  get: (id) => api.get(`/candidates/${id}`).then(r => r.data),
  create: (data) => api.post('/candidates', data).then(r => r.data),
  update: (id, data) => api.put(`/candidates/${id}`, data).then(r => r.data),
  getApplications: (id) => api.get(`/candidates/${id}/applications`).then(r => r.data),
}

export const resumeApi = {
  list: (candidateId) => api.get('/resumes', { params: { candidate_id: candidateId } }).then(r => r.data),
  get: (id) => api.get(`/resumes/${id}`).then(r => r.data),
  upload: (candidateId, file) => {
    const formData = new FormData()
    formData.append('candidate_id', candidateId)
    formData.append('file', file)
    return api.post('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
  parse: (id) => api.post(`/resumes/${id}/parse`).then(r => r.data),
  getParsed: (id) => api.get(`/resumes/${id}/parsed`).then(r => r.data),
}

export const applicationApi = {
  list: (params) => api.get('/applications', { params }).then(r => r.data),
  get: (id) => api.get(`/applications/${id}`).then(r => r.data),
  create: (data) => api.post('/applications', data).then(r => r.data),
  screen: (id, result, note) => api.post(`/applications/${id}/screen`, null, {
    params: { result, note },
  }).then(r => r.data),
  updateStatus: (id, status, note) => api.put(`/applications/${id}/status`, null, {
    params: { status, note },
  }).then(r => r.data),
}

export const interviewApi = {
  list: (params) => api.get('/interviews', { params }).then(r => r.data),
  get: (id) => api.get(`/interviews/${id}`).then(r => r.data),
  create: (data) => api.post('/interviews', data).then(r => r.data),
  update: (id, data) => api.put(`/interviews/${id}`, data).then(r => r.data),
  submitScore: (id, score) => api.post(`/interviews/${id}/score`, score).then(r => r.data),
  getWeightedScore: (appId) => api.get(`/interviews/application/${appId}/weighted-score`).then(r => r.data),
}

export const offerApi = {
  list: (params) => api.get('/offers', { params }).then(r => r.data),
  get: (id) => api.get(`/offers/${id}`).then(r => r.data),
  create: (data) => api.post('/offers', data).then(r => r.data),
  update: (id, data) => api.put(`/offers/${id}`, data).then(r => r.data),
  send: (id) => api.post(`/offers/${id}/send`).then(r => r.data),
  accept: (id) => api.post(`/offers/${id}/accept`).then(r => r.data),
  decline: (id, reason) => api.post(`/offers/${id}/decline`, null, {
    params: { reason },
  }).then(r => r.data),
  counter: (id, data) => api.post(`/offers/${id}/counter`, data).then(r => r.data),
  acceptCounter: (id) => api.post(`/offers/${id}/counter/accept`).then(r => r.data),
  rejectCounter: (id) => api.post(`/offers/${id}/counter/reject`).then(r => r.data),
  lock: (id) => api.post(`/offers/${id}/lock`).then(r => r.data),
}

export const hireApi = {
  listHires: () => api.get('/hire/hires').then(r => r.data),
  getHire: (id) => api.get(`/hire/hires/${id}`).then(r => r.data),
  createHire: (data) => api.post('/hire/hires', data).then(r => r.data),
  completeOnboarding: (id) => api.post(`/hire/hires/${id}/complete`).then(r => r.data),
  listTalentPool: () => api.get('/hire/talent-pool').then(r => r.data),
  getTalentCandidate: (id) => api.get(`/hire/talent-pool/${id}`).then(r => r.data),
}

export const statsApi = {
  overview: () => api.get('/stats/overview').then(r => r.data),
  monthly: (month) => api.get(`/stats/monthly/${month}`).then(r => r.data),
  interviewers: () => api.get('/stats/interviewers').then(r => r.data),
}

export default api
