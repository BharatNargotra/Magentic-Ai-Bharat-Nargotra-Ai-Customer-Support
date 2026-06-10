'use client'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Copy, Check, Plus, Trash2, Bot, Key, Shield, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const qc = useQueryClient()
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({
    botName: '', welcomeMessage: '', personality: 'professional',
    escalationRules: [] as { keyword: string; priority: string }[],
    suggestedQs: [] as string[],
  })

  const { data: config } = useQuery({
    queryKey: ['bot-config'],
    queryFn: () => api.get('/config').then(r => r.data),
  })

  const { data: apiKeyData } = useQuery({
    queryKey: ['api-key'],
    queryFn: () => api.get('/config/api-key').then(r => r.data),
  })

  useEffect(() => {
    if (config) {
      setForm({
        botName: config.botName || '',
        welcomeMessage: config.welcomeMessage || '',
        personality: config.personality || 'professional',
        escalationRules: config.escalationRules || [],
        suggestedQs: config.suggestedQs || [],
      })
    }
  }, [config])

  const saveMut = useMutation({
    mutationFn: () => api.put('/config', form),
    onSuccess: () => {
      toast.success('Settings saved')
      qc.invalidateQueries({ queryKey: ['bot-config'] })
    },
    onError: () => toast.error('Failed to save'),
  })

  const copyKey = () => {
    if (apiKeyData?.key) {
      navigator.clipboard.writeText(apiKeyData.key)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('API key copied')
    }
  }

  const addRule = () => setForm(f => ({ ...f, escalationRules: [...f.escalationRules, { keyword: '', priority: 'HIGH' }] }))
  const removeRule = (i: number) => setForm(f => ({ ...f, escalationRules: f.escalationRules.filter((_, j) => j !== i) }))
  const updateRule = (i: number, field: string, value: string) => setForm(f => ({
    ...f, escalationRules: f.escalationRules.map((r, j) => j === i ? { ...r, [field]: value } : r),
  }))
  const addQ = () => setForm(f => ({ ...f, suggestedQs: [...f.suggestedQs, ''] }))
  const removeQ = (i: number) => setForm(f => ({ ...f, suggestedQs: f.suggestedQs.filter((_, j) => j !== i) }))
  const updateQ = (i: number, value: string) => setForm(f => ({ ...f, suggestedQs: f.suggestedQs.map((q, j) => j === i ? value : q) }))

  const Section = ({ icon: Icon, title, children }: any) => (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-3 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center">
          <Icon size={14} className="text-brand-600" />
        </div>
        <p className="text-sm font-semibold text-ink-1">{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-sub">Configure your AI assistant behaviour and integrations</p>
      </div>

      {/* API Key */}
      <Section icon={Key} title="API Key & Widget Embed">
        <p className="text-xs text-ink-3 mb-3">Embed this key on your website to activate the chat widget</p>
        <div className="flex gap-2 mb-4">
          <input type="password" className="input font-mono text-xs flex-1" value={apiKeyData?.key || ''} readOnly />
          <button onClick={copyKey} className="btn-secondary flex-shrink-0">
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        {apiKeyData?.key && (
          <div className="bg-ink-1 rounded-xl p-4 text-xs font-mono overflow-x-auto">
            <p className="text-ink-4 mb-2 text-[11px]">{'<!-- Paste before </body> -->'}</p>
            <p className="text-emerald-400 break-all">
              {`<script src="${process.env.NEXT_PUBLIC_API_URL || 'https://your-api.com'}/widget.js" data-api-key="${apiKeyData.key}" defer></script>`}
            </p>
          </div>
        )}
      </Section>

      {/* Bot config */}
      <Section icon={Bot} title="Bot Configuration">
        <div className="space-y-4">
          <div>
            <label className="label">Bot name</label>
            <input className="input" value={form.botName}
              onChange={e => setForm(f => ({ ...f, botName: e.target.value }))}
              placeholder="SupportBot" />
          </div>
          <div>
            <label className="label">Welcome message</label>
            <textarea className="input min-h-[80px] resize-none" value={form.welcomeMessage}
              onChange={e => setForm(f => ({ ...f, welcomeMessage: e.target.value }))}
              placeholder="Hi! How can I help you today?" />
          </div>
          <div>
            <label className="label">Personality</label>
            <div className="grid grid-cols-3 gap-2">
              {['professional', 'friendly', 'technical'].map(p => (
                <button key={p}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, personality: p }))}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-all capitalize ${
                    form.personality === p
                      ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                      : 'bg-white text-ink-2 border-surface-3 hover:border-brand-300'
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Escalation rules */}
      <Section icon={Shield} title="Escalation Rules">
        <p className="text-xs text-ink-4 mb-4">Automatically create high-priority tickets when these keywords are detected</p>
        <div className="space-y-2 mb-3">
          {form.escalationRules.map((rule, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input className="input flex-1" placeholder="Keyword (e.g. refund, angry, legal)"
                value={rule.keyword} onChange={e => updateRule(i, 'keyword', e.target.value)} />
              <select className="input w-28" value={rule.priority} onChange={e => updateRule(i, 'priority', e.target.value)}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
              <button onClick={() => removeRule(i)}
                className="btn-ghost p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {form.escalationRules.length === 0 && (
            <p className="text-xs text-ink-4 py-2">No custom rules. Default keywords (refund, legal, angry) are always active.</p>
          )}
        </div>
        <button onClick={addRule} className="btn-secondary text-xs">
          <Plus size={13} /> Add rule
        </button>
      </Section>

      {/* Suggested questions */}
      <Section icon={MessageCircle} title="Suggested Questions">
        <p className="text-xs text-ink-4 mb-4">Quick-reply buttons shown to customers when they open the chat</p>
        <div className="space-y-2 mb-3">
          {form.suggestedQs.map((q, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input className="input flex-1" value={q}
                onChange={e => updateQ(i, e.target.value)}
                placeholder="e.g. What is your refund policy?" />
              <button onClick={() => removeQ(i)}
                className="btn-ghost p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <button onClick={addQ} className="btn-secondary text-xs"><Plus size={13} /> Add question</button>
      </Section>

      <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="btn-primary w-full justify-center py-3">
        {saveMut.isPending ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  )
}
