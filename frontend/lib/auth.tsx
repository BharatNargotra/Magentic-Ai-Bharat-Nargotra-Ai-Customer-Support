'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { api, setAuthToken, clearAuthToken } from './api'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface Business {
  id: string
  name: string
  slug: string
}

interface AuthContextType {
  user: User | null
  business: Business | null
  loading: boolean
  initialized: boolean
  login: (data: { token: string; user: User; business: Business }) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    let mounted = true

    api
      .get('/auth/me')
      .then((res) => {
        if (!mounted) return

        const { user, business } = res.data || {}

        setUser(user ?? null)
        setBusiness(business ?? null)
      })
      .catch(() => {
        if (!mounted) return
        setUser(null)
        setBusiness(null)
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
        setInitialized(true)
      })

    return () => {
      mounted = false
    }
  }, [])

  const login = (data: {
    token: string
    user: User
    business: Business
  }) => {
    setAuthToken(data.token)
    setUser(data.user)
    setBusiness(data.business)
  }

  const logout = () => {
    clearAuthToken()
    setUser(null)
    setBusiness(null)
    router.push('/auth/login')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        loading,
        initialized,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return ctx
}
