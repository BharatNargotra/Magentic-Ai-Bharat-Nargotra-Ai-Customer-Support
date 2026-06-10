'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Search, MessageSquare, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const statusBadge: any = {
  OPEN:      'badge-blue',
  ESCALATED: 'badge-red',
  RESOLVED:  'badge-green',
  CLOSED:    'badge-gray',
}
const statusDot: any = {
  OPEN:      'bg-blue-400',
  ESCALATED: 'bg-red-400',
  RESOLVED:  'bg-emerald-400',
  CLOSED:    'bg-gray-300',
}

export default function ConversationsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState<any>(null)

  const { data } = useQuery({
    queryKey: ['conversations', search, status],
    queryFn: () => api.get('/analytics/conversations', { params: { search, status } }).then(r => r.data),
    refetchInterval: 10000,
  })

  // Admin detail view — no API key header needed (open GET endpoint)
  const { data: conv } = useQuery({
    queryKey: ['conversation-detail', selected?.id],
    queryFn: () => api.get(`/chat/${selected.id}`).then(r => r.data),
    enabled: !!selected,
  })

  const conversations = data?.items || []

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar list */}
      <div className="w-80 border-r border-surface-3 bg-white flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-surface-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-semibold text-ink-1">Conversations</h1>
            <span className="text-xs text-ink-4 bg-surface-2 rounded-lg px-2 py-0.5">{data?.total ?? 0}</span>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
            <input className="input-sm pl-8" placeholder="Search…" value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input-sm" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All conversations</option>
            <option value="OPEN">Open</option>
            <option value="ESCALATED">Escalated</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-surface-2">
          {conversations.length === 0 && (
            <div className="p-8 text-center text-ink-4 text-xs">No conversations found</div>
          )}
          {conversations.map((c: any) => (
            <div key={c.id} onClick={() => setSelected(c)}
              className={clsx('px-4 py-3 cursor-pointer transition-colors',
                selected?.id === c.id ? 'bg-brand-50' : 'hover:bg-surface-1')}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot[c.status] || 'bg-gray-300'}`} />
                  <p className="text-xs font-semibold text-ink-1 truncate">
                    {c.customerName || c.customerEmail || 'Anonymous'}
                  </p>
                </div>
                <span className={clsx(statusBadge[c.status], 'text-[10px] flex-shrink-0')}>{c.status}</span>
              </div>
              <p className="text-xs text-ink-3 truncate pl-3.5">{c.messages?.[0]?.content || 'No messages'}</p>
              <p className="text-[11px] text-ink-5 mt-1 pl-3.5">
                {formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true })}
                {c._count?.messages ? ` · ${c._count.messages} msgs` : ''}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat detail */}
      <div className="flex-1 flex flex-col overflow-hidden bg-surface-1">
        {selected ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-surface-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold">
                    {(selected.customerName || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-1">{selected.customerName || 'Anonymous'}</p>
                    {selected.customerEmail && <p className="text-xs text-ink-3">{selected.customerEmail}</p>}
                  </div>
                </div>
                <span className={statusBadge[selected.status]}>{selected.status}</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {conv?.messages?.map((msg: any) => (
                <div key={msg.id} className={clsx('flex', msg.role === 'USER' ? 'justify-end' : 'justify-start')}>
                  {msg.role === 'ASSISTANT' && (
                    <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                      </svg>
                    </div>
                  )}
                  <div className={clsx(
                    'max-w-[72%] rounded-2xl px-4 py-3 text-sm shadow-sm',
                    msg.role === 'USER'
                      ? 'bg-brand-600 text-white rounded-tr-sm'
                      : 'bg-white text-ink-1 border border-surface-3 rounded-tl-sm'
                  )}>
                    {msg.role === 'ASSISTANT' ? (
                      <div className="chat-content prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    ) : msg.content}
                  </div>
                  {msg.role === 'USER' && (
                    <div className="w-7 h-7 rounded-full bg-surface-3 flex items-center justify-center flex-shrink-0 ml-2 mt-0.5">
                      <User size={14} className="text-ink-3" />
                    </div>
                  )}
                </div>
              ))}
              {conv?.messages?.length === 0 && (
                <div className="text-center text-ink-4 text-sm py-12">No messages in this conversation</div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-14 h-14 bg-white rounded-2xl border border-surface-3 shadow-card mx-auto mb-4 flex items-center justify-center">
                <MessageSquare size={22} className="text-ink-4" />
              </div>
              <p className="text-sm font-medium text-ink-2">Select a conversation</p>
              <p className="text-xs text-ink-4 mt-1">View the full message history</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
