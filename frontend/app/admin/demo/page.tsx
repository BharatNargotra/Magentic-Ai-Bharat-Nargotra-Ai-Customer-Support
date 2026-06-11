'use client'
import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Send, Bot, User, RefreshCw, Info } from 'lucide-react'
import clsx from 'clsx'

const API_KEY = 'sk_demo_fc237f3276f14fd7ba2ebe32b3685dad'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface Message {
  role: 'USER' | 'ASSISTANT'
  content: string
  escalated?: boolean
}

export default function DemoPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: config } = useQuery({
    queryKey: ['bot-config'],
    queryFn: () => api.get('/config').then(r => r.data),
  })

  const botName = config?.botName || 'SupportBot'
  const welcomeMessage = config?.welcomeMessage || 'Hi! How can I help you today?'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: 'ASSISTANT', content: welcomeMessage }])
    }
  }, [welcomeMessage])

  const reset = () => {
    setMessages([{ role: 'ASSISTANT', content: welcomeMessage }])
    setConversationId(null)
    setInput('')
  }

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'USER', content: text }])
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
        body: JSON.stringify({ message: text, conversationId }),
      })
      const data = await res.json()

      if (data.conversationId) setConversationId(data.conversationId)
      setMessages(prev => [...prev, {
        role: 'ASSISTANT',
        content: data.message || 'Sorry, something went wrong.',
        escalated: data.escalated,
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'ASSISTANT',
        content: 'Could not reach the backend. Make sure the server is running.',
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full">
      {/* Info panel */}
      <div className="w-72 border-r border-surface-3 bg-white p-5 flex flex-col gap-5 flex-shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-ink-1 mb-1">Chat demo</h1>
          <p className="text-xs text-ink-3 leading-relaxed">
            This is how your customers experience the bot. Messages here create real
            conversations visible in the Conversations tab.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium text-ink-2 uppercase tracking-wide">Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-ink-3">API key ready</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={clsx('w-2 h-2 rounded-full', conversationId ? 'bg-blue-400' : 'bg-gray-300')} />
            <span className="text-xs text-ink-3">
              {conversationId ? `Conversation: ${conversationId.slice(0, 8)}…` : 'No active conversation'}
            </span>
          </div>
        </div>

        {config && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-ink-2 uppercase tracking-wide">Bot config</p>
            <div className="bg-surface-1 rounded-xl p-3 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-xs text-ink-4">Name</span>
                <span className="text-xs font-medium text-ink-1">{botName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-ink-4">Personality</span>
                <span className="text-xs font-medium text-ink-1 capitalize">{config.personality || 'professional'}</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <div className="flex gap-2">
            <Info size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Every message sent here is saved to your database and visible in Conversations.
            </p>
          </div>
        </div>

        <button
          onClick={reset}
          className="flex items-center gap-2 text-xs text-ink-3 hover:text-ink-1 transition-colors mt-auto"
        >
          <RefreshCw size={13} />
          Start new conversation
        </button>
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col bg-surface-1">
        {/* Header */}
        <div className="px-5 py-3.5 bg-white border-b border-surface-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center">
            <Bot size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-1">{botName}</p>
            <p className="text-xs text-emerald-500 font-medium">● Online</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={clsx('flex gap-2.5', msg.role === 'USER' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'ASSISTANT' && (
                <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={14} className="text-white" />
                </div>
              )}
              <div className={clsx(
                'max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
                msg.role === 'USER'
                  ? 'bg-brand-600 text-white rounded-tr-sm'
                  : 'bg-white text-ink-1 border border-surface-3 rounded-tl-sm shadow-sm'
              )}>
                {msg.content}
                {msg.escalated && (
                  <div className="mt-2 pt-2 border-t border-amber-200 text-xs text-amber-600">
                    🎫 Escalated — a human will follow up
                  </div>
                )}
              </div>
              {msg.role === 'USER' && (
                <div className="w-7 h-7 rounded-full bg-surface-3 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User size={14} className="text-ink-3" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
                <Bot size={14} className="text-white" />
              </div>
              <div className="bg-white border border-surface-3 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 bg-ink-4 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-ink-4 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-ink-4 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-surface-3">
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Type a message…"
              value={input}
              disabled={loading}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="btn-primary px-4 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
