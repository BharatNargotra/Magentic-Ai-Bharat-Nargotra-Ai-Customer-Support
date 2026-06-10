'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Search, X, User, Mail, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const priorityBadge: any = {
  URGENT: 'badge-red',
  HIGH:   'badge-orange',
  MEDIUM: 'badge-yellow',
  LOW:    'badge-green',
}
const statusBadge: any = {
  OPEN:        'badge-blue',
  IN_PROGRESS: 'badge-purple',
  RESOLVED:    'badge-green',
  CLOSED:      'badge-gray',
}
const priorityDot: any = {
  URGENT: 'bg-red-500',
  HIGH:   'bg-orange-400',
  MEDIUM: 'bg-amber-400',
  LOW:    'bg-emerald-400',
}

export default function TicketsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [selected, setSelected] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', search, statusFilter, priorityFilter],
    queryFn: () => api.get('/tickets', { params: { search, status: statusFilter, priority: priorityFilter } }).then(r => r.data),
    refetchInterval: 10000,
  })

  const updateMut = useMutation({
    mutationFn: ({ id, ...data }: any) => api.patch(`/tickets/${id}`, data),
    onSuccess: (res) => {
      toast.success('Ticket updated')
      setSelected(res.data)
      qc.invalidateQueries({ queryKey: ['tickets'] })
    },
  })

  const tickets = data?.items || []

  return (
    <div className="flex h-full">
      {/* List */}
      <div className="flex-1 p-8 overflow-y-auto min-w-0">
        <div className="max-w-4xl space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="page-title">Tickets</h1>
              <p className="page-sub">{data?.total ?? 0} total tickets</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
              <input className="input pl-9" placeholder="Search tickets…" value={search}
                onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input w-36" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            <select className="input w-36" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
              <option value="">All priority</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Ticket table */}
          <div className="card overflow-hidden">
            {isLoading ? (
              <div className="p-5 space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-surface-2 rounded-xl animate-pulse" />)}
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 bg-surface-2 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                  <AlertCircle size={20} className="text-ink-4" />
                </div>
                <p className="text-sm font-medium text-ink-2">No tickets found</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-3 bg-surface-1">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-ink-3 uppercase tracking-wide">Subject</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-3 uppercase tracking-wide">Customer</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-3 uppercase tracking-wide">Priority</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-3 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-3 uppercase tracking-wide">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-2">
                  {tickets.map((t: any) => (
                    <tr key={t.id} onClick={() => setSelected(t)}
                      className={clsx('cursor-pointer hover:bg-surface-1 transition-colors',
                        selected?.id === t.id && 'bg-brand-50')}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityDot[t.priority] || 'bg-gray-400'}`} />
                          <span className="font-medium text-ink-1 truncate max-w-xs">{t.subject}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-ink-2">{t.customerName}</td>
                      <td className="px-4 py-3.5"><span className={priorityBadge[t.priority] || 'badge-gray'}>{t.priority}</span></td>
                      <td className="px-4 py-3.5"><span className={statusBadge[t.status] || 'badge-gray'}>{t.status.replace('_', ' ')}</span></td>
                      <td className="px-4 py-3.5 text-ink-4 text-xs">{formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-88 border-l border-surface-3 bg-white flex flex-col overflow-y-auto flex-shrink-0" style={{ width: 360 }}>
          <div className="px-5 py-4 border-b border-surface-3 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink-1 leading-snug">{selected.subject}</p>
            </div>
            <button onClick={() => setSelected(null)}
              className="btn-ghost p-1.5 rounded-lg flex-shrink-0">
              <X size={14} />
            </button>
          </div>

          <div className="p-5 space-y-5 flex-1">
            {/* Customer info */}
            <div className="space-y-2">
              <p className="label">Customer</p>
              <div className="bg-surface-1 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User size={13} className="text-ink-4 flex-shrink-0" />
                  <span className="text-ink-1 font-medium">{selected.customerName}</span>
                </div>
                {selected.customerEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={13} className="text-ink-4 flex-shrink-0" />
                    <span className="text-brand-600">{selected.customerEmail}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="label">Priority</p>
                <span className={priorityBadge[selected.priority]}>{selected.priority}</span>
              </div>
              <div>
                <p className="label">Status</p>
                <span className={statusBadge[selected.status]}>{selected.status.replace('_', ' ')}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="label">Description</p>
              <p className="text-sm text-ink-2 bg-surface-1 rounded-xl p-3 leading-relaxed">{selected.description}</p>
            </div>

            {/* Status update */}
            <div>
              <p className="label">Update Status</p>
              <div className="grid grid-cols-2 gap-2">
                {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(s => (
                  <button key={s}
                    onClick={() => updateMut.mutate({ id: selected.id, status: s })}
                    disabled={selected.status === s}
                    className={clsx('btn-secondary text-xs py-2 justify-center', selected.status === s && 'opacity-40 cursor-default')}>
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority update */}
            <div>
              <p className="label">Update Priority</p>
              <div className="grid grid-cols-2 gap-2">
                {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => (
                  <button key={p}
                    onClick={() => updateMut.mutate({ id: selected.id, priority: p })}
                    disabled={selected.priority === p}
                    className={clsx('btn-secondary text-xs py-2 justify-center', selected.priority === p && 'opacity-40 cursor-default')}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
