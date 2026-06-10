import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({ baseURL: `${API_URL}/api` })

api.interceptors.request.use((config) => {
  const token = Cookies.get('token') || (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (
      err.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !err.config?.url?.includes('/auth/me') &&  // ← ignore me endpoint
      !err.config?.url?.includes('/auth/login')   // ← ignore login endpoint
    ) {
      Cookies.remove('token')
      localStorage.removeItem('token')
      window.location.href = '/auth/login'
    }
    return Promise.reject(err)
  }
)

export function setAuthToken(token: string) {
  Cookies.set('token', token, { expires: 7 })
  localStorage.setItem('token', token)
}

export function clearAuthToken() {
  Cookies.remove('token')
  localStorage.removeItem('token')
}
