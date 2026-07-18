import axios from 'axios'

const api = axios.create({
  baseURL: process.env.API_URL || '/api',
  timeout: 20_000,
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('iman_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('iman_access_token')
      window.dispatchEvent(new Event('iman:unauthorized'))
    }
    return Promise.reject(error)
  },
)

export const getPage = async (path, params) => (await api.get(path, { params })).data
export const getList = async (path, params) => (await api.get(path, { params })).data
export const getOne = async (path) => (await api.get(path)).data

export const downloadFile = async (path, fallbackName = 'download') => {
  const response = await api.get(path, { responseType: 'blob' })
  const disposition = response.headers['content-disposition'] || ''
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  const quoted = disposition.match(/filename="?([^";]+)"?/i)?.[1]
  const name = encoded ? decodeURIComponent(encoded) : quoted || fallbackName
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const submitBusinessPlan = async ({ plan, documents }) => {
  const form = new FormData()
  form.append('plan', new Blob([JSON.stringify(plan)], { type: 'application/json' }))
  documents.forEach((file) => form.append('documents', file))
  return (await api.post('/public/business-plans', form, { params: { submit: true } })).data
}

export const submitApplication = async ({ jobId, application, resume, coverLetter }) => {
  const form = new FormData()
  form.append('application', new Blob([JSON.stringify(application)], { type: 'application/json' }))
  form.append('resume', resume)
  if (coverLetter) form.append('coverLetter', coverLetter)
  return (await api.post(`/public/jobs/${jobId}/applications`, form)).data
}

export default api
