'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Zap, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', slug: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      login(res.data)
      router.push('/admin/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-surface-1 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-100 rounded-full opacity-30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-100 rounded-full opacity-20 blur-3xl" />
      </div>

      <div className="w-full max-w-[400px] relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl items-center justify-center mb-4 shadow-lg">
            <Zap size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-ink-1 tracking-tight">Welcome back</h1>
          <p className="text-sm text-ink-3 mt-1">Sign in to your support dashboard</p>
        </div>

        <div className="card p-6 shadow-panel">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Company slug</label>
              <input className="input" type="text" placeholder="my-company" value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} required />
              <p className="text-[11px] text-ink-4 mt-1.5">The slug assigned when you registered</p>
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="admin@company.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input pr-10" type={showPw ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink-2 transition-colors">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-2.5 mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-surface-3 text-center">
            <p className="text-sm text-ink-3">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-brand-600 hover:text-brand-700 font-semibold">Create one</Link>
            </p>
          </div>

          {/* Demo box */}
          <div className="mt-4 p-3 bg-surface-1 border border-surface-3 rounded-xl">
            <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-wide mb-1.5">Demo credentials</p>
            <div className="space-y-1 text-xs text-ink-2 font-mono">
              <p>slug: <span className="text-brand-600">demo-company</span></p>
              <p>email: <span className="text-brand-600">admin@demo.com</span></p>
              <p>password: <span className="text-brand-600">admin123</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
