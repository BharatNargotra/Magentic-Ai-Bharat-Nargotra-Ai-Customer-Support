import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
})

// safer token getter
function getToken() {
  if (typeof window === 'undefined') return null

  return Cookies.get('token') || localStorage.getItem('token')
}

api.interceptors.request.use((config) => {
  const token = getToken()

  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isBrowser = typeof window !== 'undefined'

    const url = err.config?.url || ''

    if (
      err.response?.status === 401 &&
      isBrowser &&
      !url.includes('/auth/me') &&
      !url.includes('/auth/login')
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

  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token)
  }
}

export function clearAuthToken() {
  Cookies.remove('token')

  if (typeof window !== 'undefined') {
    localStorage.removeItem('token')
  }
}
