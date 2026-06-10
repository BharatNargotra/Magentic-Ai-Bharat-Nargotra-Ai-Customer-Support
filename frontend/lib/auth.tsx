'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api, setAuthToken, clearAuthToken } from './api'

interface User { id: string; name: string; email: string; role: string }
interface Business { id: string; name: string; slug: string }

interface AuthContextType {
  user: User | null
  business: Business | null
  loading: boolean
  login: (data: { token: string; user: User; business: Business }) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/auth/me')
      .then(res => {
        setUser(res.data.user)
        setBusiness(res.data.business)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const login = (data: { token: string; user: User; business: Business }) => {
    setAuthToken(data.token)
    setUser(data.user)
    setBusiness(data.business)
  }

  const logout = () => {
    clearAuthToken()
    setUser(null)
    setBusiness(null)
    window.location.href = '/auth/login'
  }

  return (
    <AuthContext.Provider value={{ user, business, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
