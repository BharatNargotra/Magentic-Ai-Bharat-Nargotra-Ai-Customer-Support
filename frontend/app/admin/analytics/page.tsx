'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { TrendingUp, TrendingDown, MessageSquare, Ticket, CheckCircle, AlertTriangle } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const PRIORITY_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-ink-1 text-white text-xs rounded-xl px-3 py-2 shadow-panel">
      <p className="font-semibold">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.fill || p.stroke }}>{p.name}: {p.value}{typeof p.value === 'number' && p.name.includes('Rate') ? '%' : ''}</p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => api.get('/analytics/dashboard').then(r => r.data),
  })

  const o = data?.overview || {}

  const priorityData = (data?.ticketsByPriority || []).map((row: any) => ({
    name: row.priority,
    value: row._count,
  }))

  const rateData = [
    { name: 'Resolution', value: o.resolutionRate || 0 },
    { name: 'Escalation', value: o.escalationRate || 0 },
    { name: 'Open Rate',  value: o.totalTickets > 0 ? Math.round((o.openTickets / o.totalTickets) * 100) : 0 },
  ]

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-7 bg-surface-3 rounded-lg w-40 animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl border border-surface-3 animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl space-y-6">
      <div>
        <h1 className="page-title">Analytics</h1>
        <p className="page-sub">Performance metrics for your AI support system</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Conversations',   value: o.totalConversations || 0, icon: MessageSquare, color: 'text-blue-600',    bg: 'bg-blue-50' },
          { label: 'Total Tickets',   value: o.totalTickets || 0,       icon: Ticket,        color: 'text-violet-600',  bg: 'bg-violet-50' },
          { label: 'Resolution Rate', value: `${o.resolutionRate||0}%`, icon: CheckCircle,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Escalation Rate', value: `${o.escalationRate||0}%`, icon: AlertTriangle, color: 'text-red-600',     bg: 'bg-red-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={17} className={color} />
            </div>
            <p className="text-2xl font-bold text-ink-1 tabular-nums">{value}</p>
            <p className="text-xs font-medium text-ink-3 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Priority pie */}
        <div className="card p-5">
          <p className="text-sm font-semibold text-ink-1 mb-4">Tickets by Priority</p>
          {priorityData.length === 0 ? (
            <div className="h-52 flex flex-col items-center justify-center text-ink-4 gap-2">
              <Ticket size={24} className="text-surface-3" />
              <p className="text-xs">No ticket data yet</p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={180}>
                <PieChart>
                  <Pie data={priorityData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value" paddingAngle={3}>
                    {priorityData.map((_: any, i: number) => <Cell key={i} fill={PRIORITY_COLORS[i % PRIORITY_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {priorityData.map((d: any, i: number) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PRIORITY_COLORS[i] }} />
                    <span className="text-xs text-ink-2 font-medium">{d.name}</span>
                    <span className="text-xs font-bold text-ink-1 ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rate bar chart */}
        <div className="card p-5">
          <p className="text-sm font-semibold text-ink-1 mb-4">Rate Overview</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={rateData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8b95a8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#8b95a8' }} unit="%" axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f3f9', radius: 8 }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#5b7ef5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-xs font-semibold text-ink-3 uppercase tracking-wide mb-1">Open Tickets</p>
          <p className="text-3xl font-bold text-amber-600 tabular-nums">{o.openTickets || 0}</p>
          <p className="text-xs text-ink-4 mt-1">Awaiting resolution</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-ink-3 uppercase tracking-wide mb-1">Resolved</p>
          <p className="text-3xl font-bold text-emerald-600 tabular-nums">{o.resolvedTickets || 0}</p>
          <p className="text-xs text-ink-4 mt-1">Successfully closed</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-ink-3 uppercase tracking-wide mb-1">Escalated</p>
          <p className="text-3xl font-bold text-red-600 tabular-nums">{o.escalatedTickets || 0}</p>
          <p className="text-xs text-ink-4 mt-1">Needed human agent</p>
        </div>
      </div>
    </div>
  )
}
