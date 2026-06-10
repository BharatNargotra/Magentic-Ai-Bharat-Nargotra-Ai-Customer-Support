'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Zap, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', businessName: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/register', form)
      login(res.data)
      toast.success('Account created! Welcome aboard.')
      router.push('/admin/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-surface-1 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-100 rounded-full opacity-30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-100 rounded-full opacity-20 blur-3xl" />
      </div>

      <div className="w-full max-w-[400px] relative">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl items-center justify-center mb-4 shadow-lg">
            <Zap size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-ink-1 tracking-tight">Create your account</h1>
          <p className="text-sm text-ink-3 mt-1">Set up your AI support platform in minutes</p>
        </div>

        <div className="card p-6 shadow-panel">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Your name</label>
                <input className="input" type="text" placeholder="Jane Doe" value={form.name}
                  onChange={f('name')} required minLength={2} />
              </div>
              <div>
                <label className="label">Company name</label>
                <input className="input" type="text" placeholder="Acme Inc." value={form.businessName}
                  onChange={f('businessName')} required minLength={2} />
              </div>
            </div>
            <div>
              <label className="label">Work email</label>
              <input className="input" type="email" placeholder="jane@acme.com" value={form.email}
                onChange={f('email')} required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input pr-10" type={showPw ? 'text' : 'password'} placeholder="Min 8 characters"
                  value={form.password} onChange={f('password')} required minLength={8} />
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
                  Creating account…
                </span>
              ) : 'Create account'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-surface-3 text-center">
            <p className="text-sm text-ink-3">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-brand-600 hover:text-brand-700 font-semibold">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
