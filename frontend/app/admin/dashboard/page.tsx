'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { MessageSquare, Ticket, CheckCircle, AlertTriangle, TrendingUp, ArrowUpRight, Clock, Zap } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const statusColors: any = {
  OPEN:      { dot: 'bg-blue-500',   badge: 'badge-blue' },
  ESCALATED: { dot: 'bg-red-500',    badge: 'badge-red' },
  RESOLVED:  { dot: 'bg-emerald-500',badge: 'badge-green' },
  CLOSED:    { dot: 'bg-gray-400',   badge: 'badge-gray' },
}

function StatCard({ label, value, icon: Icon, color, sub, trend }: any) {
  const palettes: any = {
    blue:   { bg: 'bg-blue-50',    icon: 'text-blue-600',   ring: 'ring-blue-100' },
    amber:  { bg: 'bg-amber-50',   icon: 'text-amber-600',  ring: 'ring-amber-100' },
    emerald:{ bg: 'bg-emerald-50', icon: 'text-emerald-600',ring: 'ring-emerald-100' },
    red:    { bg: 'bg-red-50',     icon: 'text-red-600',    ring: 'ring-red-100' },
    purple: { bg: 'bg-purple-50',  icon: 'text-purple-600', ring: 'ring-purple-100' },
    violet: { bg: 'bg-violet-50',  icon: 'text-violet-600', ring: 'ring-violet-100' },
  }
  const p = palettes[color] || palettes.blue
  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ring-1 ${p.bg} ${p.ring}`}>
          <Icon size={18} className={p.icon} />
        </div>
        {trend !== undefined && (
          <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
            <ArrowUpRight size={12} />{trend}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-ink-1 tabular-nums">{value}</p>
        <p className="text-xs font-medium text-ink-3 mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-ink-4 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

const priorityStyle: any = {
  URGENT: 'bg-red-500',
  HIGH:   'bg-orange-400',
  MEDIUM: 'bg-amber-400',
  LOW:    'bg-emerald-400',
}

export default function DashboardPage() {
  const { business } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/analytics/dashboard').then(r => r.data),
    enabled: !!business,
    refetchInterval: 30000,
  })

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="space-y-1">
          <div className="h-7 bg-surface-3 rounded-lg w-40 animate-pulse" />
          <div className="h-4 bg-surface-2 rounded w-56 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl border border-surface-3 animate-pulse" />)}
        </div>
      </div>
    )
  }

  const o = data?.overview || {}

  return (
    <div className="p-8 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Live overview of your AI support platform</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-ink-4 bg-white rounded-xl border border-surface-3 px-3 py-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </div>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Conversations" value={o.totalConversations ?? 0} icon={MessageSquare} color="blue" />
        <StatCard label="Open Tickets" value={o.openTickets ?? 0} icon={Ticket} color="amber" />
        <StatCard label="Resolved" value={o.resolvedTickets ?? 0} icon={CheckCircle} color="emerald" />
        <StatCard label="Escalated" value={o.escalatedTickets ?? 0} icon={AlertTriangle} color="red" />
      </div>

      {/* Rate cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="AI Resolution Rate"
          value={`${o.resolutionRate ?? 0}%`}
          icon={TrendingUp}
          color="emerald"
          sub="Resolved without human"
        />
        <StatCard
          label="Escalation Rate"
          value={`${o.escalationRate ?? 0}%`}
          icon={AlertTriangle}
          color="red"
          sub="Escalated to human agent"
        />
        <StatCard
          label="Total Tickets"
          value={o.totalTickets ?? 0}
          icon={Ticket}
          color="violet"
          sub="All time"
        />
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* Priority breakdown */}
        {data?.ticketsByPriority?.length > 0 && (
          <div className="card p-5 col-span-2">
            <p className="text-xs font-semibold text-ink-3 uppercase tracking-wide mb-4">Priority Breakdown</p>
            <div className="space-y-3">
              {(['URGENT','HIGH','MEDIUM','LOW'] as const).map(p => {
                const row = data.ticketsByPriority.find((r: any) => r.priority === p)
                const count = row?._count ?? 0
                const max = Math.max(...data.ticketsByPriority.map((r: any) => r._count), 1)
                return (
                  <div key={p} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-ink-3 w-14">{p}</span>
                    <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${priorityStyle[p]}`}
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-ink-2 w-4 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent conversations */}
        <div className={`card col-span-${data?.ticketsByPriority?.length > 0 ? '3' : '5'}`}>
          <div className="px-5 py-4 border-b border-surface-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-1">Recent Conversations</p>
            <span className="text-xs text-ink-4">{data?.recentConversations?.length ?? 0} shown</span>
          </div>
          {!data?.recentConversations?.length ? (
            <div className="px-5 py-12 text-center">
              <div className="w-10 h-10 rounded-2xl bg-surface-2 flex items-center justify-center mx-auto mb-3">
                <MessageSquare size={18} className="text-ink-4" />
              </div>
              <p className="text-sm font-medium text-ink-2">No conversations yet</p>
              <p className="text-xs text-ink-4 mt-1">Deploy your widget to start receiving chats</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-2">
              {data.recentConversations.map((conv: any) => {
                const s = statusColors[conv.status] || statusColors.OPEN
                return (
                  <div key={conv.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-surface-1 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink-1 truncate">
                          {conv.customerName || conv.customerEmail || 'Anonymous'}
                        </p>
                        <p className="text-xs text-ink-4 flex items-center gap-1 mt-0.5">
                          <Clock size={10} />
                          {formatDistanceToNow(new Date(conv.createdAt), { addSuffix: true })}
                          <span className="text-surface-3">·</span>
                          {conv._count?.messages ?? 0} msgs
                        </p>
                      </div>
                    </div>
                    <span className={s.badge}>{conv.status}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
