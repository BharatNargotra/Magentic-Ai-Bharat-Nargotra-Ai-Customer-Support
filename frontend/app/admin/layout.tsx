'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import {
  LayoutDashboard, BookOpen, MessageSquare, Ticket,
  BarChart2, Settings, LogOut, Zap, PlayCircle
} from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { href: '/admin/dashboard',      label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/admin/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
  { href: '/admin/conversations',  label: 'Conversations',  icon: MessageSquare },
  { href: '/admin/tickets',        label: 'Tickets',        icon: Ticket },
  { href: '/admin/analytics',      label: 'Analytics',      icon: BarChart2 },
  { href: '/admin/settings',       label: 'Settings',       icon: Settings },
  { href: '/admin/demo',           label: 'Try it',         icon: PlayCircle },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, business, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-1">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <div className="w-5 h-5 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
        </div>
      </div>
    )
  }

  if (!user) return null

  const initials = user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="flex h-screen bg-surface-1 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-surface-3 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-surface-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-sm">
              <Zap size={15} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-1 truncate leading-tight">{business?.name}</p>
              <p className="text-[11px] text-ink-4 leading-tight">AI Support</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href}
                className={clsx(
                  active ? 'nav-item-active' : 'nav-item-inactive'
                )}>
                <Icon size={16} className={active ? 'text-brand-600' : 'text-ink-4'} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t border-surface-3">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-surface-1 transition-colors group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-ink-1 truncate leading-tight">{user.name}</p>
              <p className="text-[11px] text-ink-4 capitalize leading-tight">{user.role.toLowerCase()}</p>
            </div>
            <button onClick={logout}
              className="text-ink-5 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              title="Sign out">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  )
}
